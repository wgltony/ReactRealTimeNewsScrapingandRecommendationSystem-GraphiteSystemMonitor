# -*- encoding: utf-8 -*-
# stub: x-pack 5.4.0 java lib

Gem::Specification.new do |s|
  s.name = "x-pack"
  s.version = "5.4.0"
  s.platform = "java"

  s.required_rubygems_version = Gem::Requirement.new(">= 0") if s.respond_to? :required_rubygems_version=
  s.metadata = { "logstash_group" => "pack", "logstash_plugin" => "true" } if s.respond_to? :metadata=
  s.require_paths = ["lib"]
  s.authors = ["elastic"]
  s.date = "2017-04-28"
  s.description = "X-Pack bundles powerful features into a single plugin pack to extend Logstash functionality."
  s.email = "dev_ops@elastic.co"
  s.homepage = "https://github.com/elastic"
  s.licenses = ["ELASTIC LICENSE"]
  s.rubygems_version = "2.4.8"
  s.summary = "X-Pack bundles powerful features into a single plugin pack to extend Logstash functionality."

  s.installed_by_version = "2.4.8" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<logstash-core>, [">= 0"])
      s.add_runtime_dependency(%q<logstash-core-plugin-api>, ["~> 2.0"])
      s.add_runtime_dependency(%q<logstash-output-elasticsearch>, [">= 0"])
      s.add_runtime_dependency(%q<logstash-codec-plain>, [">= 0"])
      s.add_runtime_dependency(%q<concurrent-ruby>, [">= 0"])
      s.add_development_dependency(%q<rspec>, [">= 0"])
      s.add_development_dependency(%q<logstash-devutils>, [">= 0"])
      s.add_development_dependency(%q<paquet>, [">= 0"])
      s.add_development_dependency(%q<rake>, [">= 0"])
    else
      s.add_dependency(%q<logstash-core>, [">= 0"])
      s.add_dependency(%q<logstash-core-plugin-api>, ["~> 2.0"])
      s.add_dependency(%q<logstash-output-elasticsearch>, [">= 0"])
      s.add_dependency(%q<logstash-codec-plain>, [">= 0"])
      s.add_dependency(%q<concurrent-ruby>, [">= 0"])
      s.add_dependency(%q<rspec>, [">= 0"])
      s.add_dependency(%q<logstash-devutils>, [">= 0"])
      s.add_dependency(%q<paquet>, [">= 0"])
      s.add_dependency(%q<rake>, [">= 0"])
    end
  else
    s.add_dependency(%q<logstash-core>, [">= 0"])
    s.add_dependency(%q<logstash-core-plugin-api>, ["~> 2.0"])
    s.add_dependency(%q<logstash-output-elasticsearch>, [">= 0"])
    s.add_dependency(%q<logstash-codec-plain>, [">= 0"])
    s.add_dependency(%q<concurrent-ruby>, [">= 0"])
    s.add_dependency(%q<rspec>, [">= 0"])
    s.add_dependency(%q<logstash-devutils>, [">= 0"])
    s.add_dependency(%q<paquet>, [">= 0"])
    s.add_dependency(%q<rake>, [">= 0"])
  end
end
