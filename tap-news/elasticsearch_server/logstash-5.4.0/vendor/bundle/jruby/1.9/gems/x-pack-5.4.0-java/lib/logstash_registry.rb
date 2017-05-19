# encoding: utf-8
require "logstash/plugins/registry"
require "monitoring/monitoring"
require "monitoring/inputs/metrics"

LogStash::PLUGIN_REGISTRY.add(:input, "metrics", LogStash::Inputs::Metrics)
LogStash::PLUGIN_REGISTRY.add(:universal, "monitoring", LogStash::MonitoringExtension)
