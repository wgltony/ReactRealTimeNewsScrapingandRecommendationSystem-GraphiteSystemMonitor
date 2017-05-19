# encoding: utf-8
require "logstash/event"
require "logstash/inputs/base"
require "logstash/instrument/collector"
require "concurrent"

module LogStash module Inputs
  # The Metrics input recieves periodic metric data snapshot from Logstash core.
  # This input is responsible for registring itself to the collector.
  # The collector class will periodically emits new snapshot of the system, JVM and other metric data.
  # This input further transform it into a `Logstash::Event`, which can be consumed by the shipper and
  # shipped to Elasticsearch
  class Metrics < LogStash::Inputs::Base
    require "monitoring/inputs/timer_task_logger"

    config_name "metrics"

    # Polling frequency in seconds on the metric store
    config :collection_interval, :type => :integer, :default => 10

    # Maximum time in seconds a polling iteration of the metric store can take before it dies
    # When it dies, the snapshot will wait the `collection_interval` before doing another snapshot.
    config :collection_timeout_interval, :type => :integer, :default => 10 * 60

    def register
      @global_stats = fetch_global_stats()
      configure_snapshot_poller()
    end

    def configure_snapshot_poller
      @timer_task = Concurrent::TimerTask.new({
        :execution_interval => @collection_interval,
        :timeout_interval => @collection_timeout_interval
      }) do
        update(metric.collector.snapshot_metric)
      end

      @timer_task.add_observer(TimerTaskLogger.new)
    end

    def run(queue)
      @logger.debug("Metric: input started")
      @queue = queue

      @timer_task.execute

      # Keep this plugin thread alive,
      # until we shutdown the metric pipeline
      sleep(1) while !stop?
    end

    def stop
      @logger.debug("Metrics input: stopped")
      @timer_task.shutdown if @timer_task
    end

    def update(snapshot)
      @logger.debug("Metrics input: received a new snapshot", :created_at => snapshot.created_at, :snapshot => snapshot) if @logger.debug?

      event = build_event(snapshot)
      return if event.nil?

      remove_reserved_fields(event)

      # The back pressure is handled in the collector's
      # scheduled task (running into his own thread) if something append to one of the listener it will
      # will timeout. In a sane pipeline, with a low traffic of events it shouldn't be a problems.
      @queue << event
    end

    private
    def remove_reserved_fields(event)
      event.remove("@timestamp")
      event.remove("@version")
    end

    private
    def build_event(snapshot)
      ms = snapshot.metric_store
      LogStash::Event.new(
        "timestamp" => snapshot.created_at,
        "logstash" => fetch_node_stats(ms),
        "events" => format_global_event_count(ms),
        #"pipelines" => format_pipelines_info(ms.get_with_path("/stats/pipelines")[:stats][:pipelines]),  # TODO add this in v2 of metric shipper
        "process" => format_process_stats(ms),
        "reloads" => format_reloads(ms),
        "jvm" => format_jvm_stats(ms),
        "os" => format_os_stats(ms),
        "queue" => format_queue_stats(ms)
      )
    rescue => e
      if @logger.debug?
        @logger.error("Failed to create monitoring event", :message => e.message, :error => e.class.name, :backtrace => e.backtrace)
      else
        @logger.error("Failed to create monitoring event", :message => e.message, :error => e.class.name)
      end
      nil
    end

    def format_process_stats(stats)
      stats.extract_metrics([:jvm, :process],
        [:cpu, :percent],
        :open_file_descriptors,
        :max_file_descriptors
      )
    end

    def format_pipelines_info(stats)
      stats.map do |p_id, p_stats|
        {
          "name" => p_id.to_s,
          "events" => format_pipeline_events(p_stats[:events]),
          "plugins" => {
            "inputs" => format_pipeline_plugin_stats(p_stats[:plugins][:inputs]),
            "filters" => format_pipeline_plugin_stats(p_stats[:plugins][:filters]),
            "outputs" => format_pipeline_plugin_stats(p_stats[:plugins][:outputs]),
          },
          "reloads" => {
            "successes" => p_stats[:reloads][:successes].value,
            "failures" => p_stats[:reloads][:failures].value
          }
        }
      end
    end

    def format_pipeline_events(stats)
      result = {}
      (stats || {}).each { |stage, counter| result[stage.to_s] = counter.value }
      result
    end

    def format_pipeline_plugin_stats(stats = {})
      result = []
      (stats || {}).each do |plugin_id, plugin_stats|
        result << { "id" => plugin_id, "name" => plugin_stats[:name].value }
      end
      result
    end

    def format_jvm_stats(stats)

      result = stats.extract_metrics([:jvm], :uptime_in_millis)

      heap_stats = stats.extract_metrics([:jvm, :memory, :heap],
                     :used_in_bytes, :used_percent, :max_in_bytes)

      result["mem"] = {
        "heap_used_in_bytes" => heap_stats[:used_in_bytes],
        "heap_used_percent" => heap_stats[:used_percent],
        "heap_max_in_bytes" => heap_stats[:max_in_bytes],
      }

      result["gc"] = {
        "collectors" => {
          "old" => stats.extract_metrics([:jvm, :gc, :collectors, :old],
                        :collection_time_in_millis, :collection_count),
          "young" => stats.extract_metrics([:jvm, :gc, :collectors, :young],
                        :collection_time_in_millis, :collection_count)
        }
      }

      result
    end

    def format_os_stats(stats)
      load_average = stats.extract_metrics([:jvm, :process, :cpu], :load_average)
      if os_stats?(stats)
        cpuacct = stats.extract_metrics([:os, :cgroup, :cpuacct], :control_group, :usage_nanos)
        cgroups_stats = stats.extract_metrics([:os, :cgroup, :cpu, :stat], :number_of_elapsed_periods, :number_of_times_throttled, :time_throttled_nanos)
        control_group = stats.get_shallow(:os, :cgroup, :cpu, :control_group).value
        {:cpu => load_average, :cgroup => {:cpuacct =>  cpuacct, :cpu => {:control_group => control_group, :stat => cgroups_stats}}}
      else
        {:cpu => load_average}
      end
    end

    # OS stats are not available on all platforms
    # TODO: replace exception logic with has_keys? when it is implemented in MetricStore
    def os_stats?(stats)
      stats.get_shallow(:os)
      true
    rescue LogStash::Instrument::MetricStore::MetricNotFound
      false
    end

    def format_reloads(stats)
      stats.extract_metrics([:stats, :reloads], :successes, :failures)
    end

    def format_global_event_count(stats)
      stats.extract_metrics([:stats, :events], :in, :filtered, :out, :duration_in_millis)
    end

    def format_queue_stats(stats)
      queue_type = stats.get_shallow(:stats, :pipelines, :main, :queue, :type).value
      events = 0
      if queue_type == "persisted"
        events = stats.get_shallow(:stats, :pipelines, :main, :queue, :events).value
      end
      {:type => queue_type, :events_count => events}
    end

    def fetch_node_stats(stats)
      @global_stats.merge("http_address" => stats.get_shallow(:http_address).value)
    end

    def fetch_global_stats
      {
        "uuid" => LogStash::SETTINGS.get("node.uuid"),
        "name" => LogStash::SETTINGS.get("node.name"),
        "host" => Socket.gethostname,
        "http_address" => nil,
        "version" => ::LOGSTASH_VERSION,
        "snapshot" => ::BUILD_INFO["build_snapshot"],
        "status" => "green",
        "pipeline" => {
          "workers" => LogStash::SETTINGS.get("pipeline.workers"),
          "batch_size" => LogStash::SETTINGS.get("pipeline.batch.size"),
        }
      }
    end
  end
end;end
