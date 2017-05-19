# Logstash x-pack

Set of plugins that form Logstash x-pack features. Currently, the only feature is monitoring.

# Setup
You must checkout x-pack-logstash and logstash with a specific directory structure. The
logstash checkout will be used when building x-pack. The structure is:

- /path/to/logstash
- /path/to/logstash-extra/x-pack-logstash

```
$ ls $PATH_TO_REPOS
 ├── logstash
 └── logstash-extra
     └── x-pack-logstash
```

# Build

**Prerequisites**

Download and install JRuby 1.7.26 using `rvm` or `rbenv`. If you already have JRuby, you can skip the step below.

Install JRuby using rvm which is a Ruby manager: https://rvm.io/rvm/install

```sh
gpg --keyserver hkp://keys.gnupg.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3
\curl -sSL https://get.rvm.io | bash -s stable --ruby=jruby-1.7.26
```

Confirm you are using JRuby 1.7.26
```sh
ruby -v
```

---------------------------------------------------

To build a zip of Logstash x-pack, you can run:

```sh
gradle clean assemble
```

This will build a snapshot which is good for development purposes

To build a release version,

```sh
gradle clean assemble -Dbuild.snapshot=false
```

**Note:** If `xpack.logstash.build` is false, Logstash build step will be skipped.

# Build targets

The above build/assemble steps will create the plugin zip file in `build/distributions/x-pack-<version>.zip`
The gem file is already packaged inside this zip.

# Installing x-pack on Logstash binary

**Offline install:**

```sh
bin/logstash-plugin install file:///<dir>/distributions/x-pack-6.0.0-alpha1-SNAPSHOT.zip
```

**Staging URL:**

```sh
LOGSTASH_PACK_URL="https://staging.elastic.co/<hash>/downloads/logstash-plugins" bin/logstash-plugin install x-pack
```

# Configuration

To configure x-pack settings, you can edit config/logstash.yml and add `xpack.*` configs

# Starting Logstash

Start Logstash with minimal config

```sh
bin/logstash -e 'input {stdin {}}'
```

If you want to start another LS instance, simply point your `path.data` to a new directory and start like above
