# encoding: utf-8
require "logstash-core"
require "monitoring/inputs/metrics"
require "rspec/wait"

describe LogStash::Inputs::Metrics do
  let(:collector) { LogStash::Instrument::Collector.new }
  let(:metric) { LogStash::Instrument::Metric.new(collector) }
  let(:queue) { [] }

  # settings
  let(:xpack_monitoring_interval) { 1 }
  let(:options) { { "collection_interval" => xpack_monitoring_interval,
                    "collection_timeout_interval" => 600 } }

  subject { described_class.new(options) }

  before :each do
    allow(subject).to receive(:fetch_global_stats).and_return({"uuid" => "00001" })
    subject.metric = metric
  end

  describe "#run" do
    before do
      subject.register
    end

    it "creates snapshots of the metric store" do
      expect(subject).to receive(:update).at_least(:once)

      Thread.new { subject.run(queue) }
      sleep(xpack_monitoring_interval * 3) # give us a bit of time
      subject.stop
    end
  end

  describe "#update" do
    before :each do
      subject.register
      Thread.new { subject.run(queue) }
      sleep(0.1)
      subject.stop
      allow(subject).to receive(:build_event).and_return(LogStash::Event.new)
      subject.update(collector.snapshot_metric)
    end
    it "add events to the queue" do
      expect(queue.count).to eq(1)
    end
  end

  describe "#stop" do
    it "should unblock the input" do
      subject.register
      t = Thread.new { subject.run(queue) }
      sleep(0.1) # give a bit of time to the thread to start
      subject.do_stop
      wait_for { t.status }.to be_falsey
    end
  end
end
