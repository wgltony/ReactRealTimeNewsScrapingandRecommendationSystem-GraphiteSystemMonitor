# encoding: utf-8
require "logstash/util/loggable"
require "concurrent"

module LogStash module Inputs
  class TimerTaskLogger
    include LogStash::Util::Loggable

    def update(run_at, result, exception)
      if !exception.nil?
        # This can happen if the pipeline is blocked for too long
        if exception.is_a?(Concurrent::TimeoutError)
          logger.debug("metric shipper took too much time to complete", :exception => exception.class, :message => exception.message)
        else
          logger.error("metric shipper exception", :exception => exception.class, :message => exception.message)
        end
      end
    end
  end
end end
