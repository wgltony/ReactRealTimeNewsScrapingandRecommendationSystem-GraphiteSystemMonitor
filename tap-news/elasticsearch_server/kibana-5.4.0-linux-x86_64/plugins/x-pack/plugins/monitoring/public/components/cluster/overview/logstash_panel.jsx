import React from 'react';
import formatNumber from 'plugins/monitoring/lib/format_number';
import { ClusterItemContainer, BytesPercentageUsage } from './helpers';

export default class LogstashPanel extends React.Component {
  render() {
    if (!this.props.count) return null;

    return (
      <ClusterItemContainer {...this.props} url='logstash' title='Logstash'>
        <div className='row'>
          <div className='col-md-4'>
            <dl data-test-subj='logstash_overview'>
              <dt className='cluster-panel__inner-title'>
                <a className='link' onClick={() => this.props.angularChangeUrl('logstash')}>Overview</a>
              </dt>
              <dd>Events Received: {formatNumber(this.props.events_in_total, '0.[0]a')}</dd>
              <dd>Events Emitted: {formatNumber(this.props.events_out_total, '0.[0]a')}</dd>
            </dl>
          </div>
          <div className='col-md-4'>
            <dl>
              <dt className='cluster-panel__inner-title'>
                <a className='link' onClick={() => this.props.angularChangeUrl('logstash/nodes')}>
                  Nodes: <span data-test-subj='number_of_logstash_instances'>{this.props.count}</span>
                </a>
              </dt>
              <dd>Uptime: {formatNumber(this.props.max_uptime, 'time_since')}</dd>
              <dd>
                JVM Heap: <BytesPercentageUsage usedBytes={this.props.avg_memory_used} maxBytes={this.props.avg_memory} />
              </dd>
            </dl>
          </div>
        </div>
      </ClusterItemContainer>
    );
  }
}
