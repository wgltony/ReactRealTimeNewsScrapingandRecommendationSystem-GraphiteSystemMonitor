# encoding: utf-8
require "logstash/agent"
require "logstash/universal_plugin"
java_import java.util.concurrent.TimeUnit

module LogStash
  class MonitoringExtension < LogStash::UniversalPlugin
    include LogStash::Util::Loggable

    class TemplateData
      def initialize(node_uuid,
                     system_api_version,
                     es_hosts,
                     user,
                     password,
                     ca_path,
                     truststore_path,
                     truststore_password,
                     keystore_path,
                     keystore_password,
                     collection_interval,
                     collection_timeout_interval,
                     sniffing)
        @system_api_version = system_api_version
        @es_hosts = es_hosts
        @user = user
        @password = password
        @node_uuid = node_uuid
        @ca_path = ca_path
        @truststore_path = truststore_path
        @truststore_password = truststore_password
        @keystore_path = keystore_path
        @keystore_password = keystore_password
        @collection_interval = collection_interval
        @collection_timeout_interval = collection_timeout_interval
        @sniffing = sniffing
      end

      attr_accessor :system_api_version, :es_hosts, :user, :password, :node_uuid
      attr_accessor :ca_path, :truststore_path, :truststore_password
      attr_accessor :keystore_path, :keystore_password, :sniffing

      def collection_interval
        TimeUnit::SECONDS.convert(@collection_interval, TimeUnit::NANOSECONDS)
      end

      def collection_timeout_interval
        TimeUnit::SECONDS.convert(@collection_timeout_interval, TimeUnit::NANOSECONDS)
      end

      def auth?
        user && password
      end

      def ssl?
        ca_path || (truststore_path && truststore_password) || (keystore_path && keystore_password)
      end

      def truststore?
        truststore_path && truststore_password
      end

      def keystore?
        keystore_path && keystore_password
      end

      def get_binding
        binding
      end
    end

    class PipelineRegisterHook
      include LogStash::Util::Loggable

      PIPELINE_ID = ".monitoring-logstash"
      API_VERSION = 2

      def initialize
        # nothing to do here
      end

      def after_initialize(agent)
        logger.trace "starting #after_initialize"
        LogStash::SETTINGS.set("node.uuid", agent.id)
        return unless LogStash::SETTINGS.get("xpack.monitoring.enabled")
        logger.trace("registering the metrics pipeline")
        agent.register_pipeline(setup_metrics_pipeline())
      rescue => e
        logger.error("Failed to set up the metrics pipeline", :message => e.message, :backtrace => e.backtrace)
        raise e
      end

      def setup_metrics_pipeline
        settings = LogStash::SETTINGS.clone

        # reset settings for the metrics pipeline
        settings.get_setting("path.config").reset
        settings.set("pipeline.id", PIPELINE_ID)
        settings.set("config.reload.automatic", false)
        settings.set("metric.collect", false)
        settings.set("queue.type", "memory")
        settings.set("pipeline.workers", 1) # this is a low throughput pipeline
        settings.set("pipeline.batch.size", 2)

        # generate the configuration
        config = generate_pipeline_config(settings)
        logger.debug("compiled metrics pipeline config: ", :config => config)
        settings.set("config.string", config)

        settings
      end

      def generate_pipeline_config(settings)
        monitoring_enabled = settings.get("xpack.monitoring.enabled")
        url = settings.get("xpack.monitoring.elasticsearch.url")
        username = settings.get("xpack.monitoring.elasticsearch.username")
        password = settings.get("xpack.monitoring.elasticsearch.password")
        ca_path = settings.get("xpack.monitoring.elasticsearch.ssl.ca")
        truststore_path = settings.get("xpack.monitoring.elasticsearch.ssl.truststore.path")
        truststore_password = settings.get("xpack.monitoring.elasticsearch.ssl.truststore.password")
        keystore_path = settings.get("xpack.monitoring.elasticsearch.ssl.keystore.path")
        keystore_password = settings.get("xpack.monitoring.elasticsearch.ssl.keystore.password")
        collection_interval = settings.get("xpack.monitoring.collection.interval")
        collection_timeout_interval = settings.get("xpack.monitoring.collection.timeout_interval")
        sniffing = settings.get("xpack.monitoring.elasticsearch.sniffing")

        data = TemplateData.new(LogStash::SETTINGS.get("node.uuid"), API_VERSION,
                                url, username, password, ca_path,
                                truststore_path, truststore_password,
                                keystore_path, keystore_password,
                                collection_interval, collection_timeout_interval, sniffing)

        template_name = if major_version(fetch_es_output_version()) == 6
                          "template_6x.cfg.erb"
                        else
                          "template.cfg.erb"
                        end

        template_path = ::File.join(::File.dirname(__FILE__), "..", template_name)
        template = ::File.read(template_path)
        ERB.new(template, 3).result(data.get_binding)
      end

      private
      def fetch_es_output_version
        ::Gem::Specification.find_by_name("logstash-output-elasticsearch").version
      end

      def major_version(version)
        version.segments.first
      end
    end

    def initialize
      # nothing to do here
    end

    def register_hooks(hooks)
      logger.trace "registering hook"
      hooks.register_hooks(LogStash::Agent, PipelineRegisterHook.new)
    end

    def additionals_settings(settings)
      logger.trace("registering additionals_settings")

      settings.register(LogStash::Setting::Boolean.new("xpack.monitoring.enabled", true))
      settings.register(LogStash::Setting::ArrayCoercible.new("xpack.monitoring.elasticsearch.url", String, [ "http://localhost:9200" ] ))
      settings.register(LogStash::Setting::TimeValue.new("xpack.monitoring.collection.interval", "10s"))
      settings.register(LogStash::Setting::TimeValue.new("xpack.monitoring.collection.timeout_interval", "10m"))
      settings.register(LogStash::Setting::NullableString.new("xpack.monitoring.elasticsearch.username", "logstash_system"))
      settings.register(LogStash::Setting::NullableString.new("xpack.monitoring.elasticsearch.password", "changeme"))
      settings.register(LogStash::Setting::NullableString.new("xpack.monitoring.elasticsearch.ssl.ca"))
      settings.register(LogStash::Setting::NullableString.new("xpack.monitoring.elasticsearch.ssl.truststore.path"))
      settings.register(LogStash::Setting::NullableString.new("xpack.monitoring.elasticsearch.ssl.truststore.password"))
      settings.register(LogStash::Setting::NullableString.new("xpack.monitoring.elasticsearch.ssl.keystore.path"))
      settings.register(LogStash::Setting::NullableString.new("xpack.monitoring.elasticsearch.ssl.keystore.password"))
      settings.register(LogStash::Setting::Boolean.new("xpack.monitoring.elasticsearch.sniffing", false))


      settings.register(LogStash::Setting::String.new("node.uuid", ""))
    rescue => e
      logger.error e.message
      logger.error e.backtrace
      raise e
    end
  end
end
