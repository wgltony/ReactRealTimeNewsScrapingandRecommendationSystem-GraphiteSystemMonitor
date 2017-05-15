import React from 'react';
import formatNumber from 'plugins/monitoring/lib/format_number';
import { get, capitalize } from 'lodash';
import { ElasticsearchStatusIcon } from 'plugins/monitoring/components/elasticsearch/status_icon';
import { ClusterItemContainer, HealthStatusIndicator, BytesUsage, BytesPercentageUsage } from './helpers';

export default class ElasticsearchPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      primaries: 'N/A',
      replicas: 'N/A'
    };
  }

  componentWillReceiveProps(nextProps) {
    const indices = get(nextProps, 'stats.indices');
    const total = get(indices, 'shards.total', 0);
    let primaries = get(indices, 'shards.primaries', 'N/A');
    let replicas = 'N/A';

    // we subtract primaries from total to get replica count, so if we don't know primaries, then
    //  we cannot know replicas (because we'd be showing the wrong number!)
    if (primaries !== 'N/A') {
      primaries = formatNumber(primaries, 'int_commas');
      replicas = formatNumber(total - primaries, 'int_commas');
    }

    this.setState({
      primaries,
      replicas
    });
  }

  render() {
    const stats = this.props.stats || {};
    const nodes = stats.nodes;
    const indices = stats.indices;

    const statusIndicator = (
      <HealthStatusIndicator>
        <ElasticsearchStatusIcon status={this.props.status} />&nbsp;
        {capitalize(this.props.status)}
      </HealthStatusIndicator>
    );

    return (
      <ClusterItemContainer {...this.props} statusIndicator={statusIndicator} url='elasticsearch' title='Elasticsearch'>
        <div className='row'>
          <div className='col-md-4'>
            <dl data-test-subj='elasticsearch_overview' data-overview-status={this.props.status}>
              <dt className='cluster-panel__inner-title'>
                <a className='link' onClick={() => this.props.angularChangeUrl('elasticsearch')}>Overview</a>
              </dt>
              <dd>Version: {get(nodes, 'versions[0]') || 'N/A'}</dd>
              <dd>Uptime: {formatNumber(get(nodes, 'jvm.max_uptime_in_millis'), 'time_since')}</dd>
            </dl>
          </div>
          <div className='col-md-4'>
            <dl>
              <dt className='cluster-panel__inner-title'>
                <a className='link' onClick={() => this.props.angularChangeUrl('elasticsearch/nodes')}>
                  Nodes: <span data-test-subj='number_of_elasticsearch_nodes'>
                    {formatNumber(get(nodes, 'count.total'), 'int_commas')}
                  </span>
                </a>
              </dt>
              <dd>
                Disk Available: <BytesUsage
                  usedBytes={get(nodes, 'fs.available_in_bytes')}
                  maxBytes={get(nodes, 'fs.total_in_bytes')}
                />
              </dd>
              <dd>
                JVM Heap: <BytesPercentageUsage
                  usedBytes={get(nodes, 'jvm.mem.heap_used_in_bytes')}
                  maxBytes={get(nodes, 'jvm.mem.heap_max_in_bytes')}
                />
              </dd>
            </dl>
          </div>
          <div className='col-md-4'>
            <dl>
              <dt className='cluster-panel__inner-title'>
                <a className='link' onClick={() => this.props.angularChangeUrl('elasticsearch/indices')}>
                  Indices: {formatNumber(get(indices, 'count'), 'int_commas')}
                </a>
              </dt>
              <dd>Documents: {formatNumber(get(indices, 'docs.count'), 'int_commas')}</dd>
              <dd>Disk Usage: {formatNumber(get(indices, 'store.size_in_bytes'), 'bytes')}</dd>
              <dd>Primary Shards: {this.state.primaries}</dd>
              <dd>Replica Shards: {this.state.replicas}</dd>
            </dl>
          </div>
        </div>
      </ClusterItemContainer>
    );
  }
};
