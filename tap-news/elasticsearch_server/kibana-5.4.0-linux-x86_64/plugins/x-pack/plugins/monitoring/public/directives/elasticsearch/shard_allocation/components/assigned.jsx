/**
 * ELASTICSEARCH CONFIDENTIAL
 * _____________________________
 *
 *  [2014] Elasticsearch Incorporated All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Elasticsearch Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Elasticsearch Incorporated
 * and its suppliers and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Elasticsearch Incorporated.
 */

import _ from 'lodash';
import React from 'react';
import Shard from './shard.jsx';
import calculateClass from '../lib/calculateClass';
import generateQueryAndLink from '../lib/generateQueryAndLink';

function sortByName(item) {
  if (item.type === 'node') {
    return [ !item.master, item.name];
  }
  return [ item.name ];
}

export default React.createClass({
  createShard: function (shard, index) {
    const type = shard.primary ? 'primary' : 'replica';
    const additionId = shard.state === 'UNASSIGNED' ? Math.random() : '';
    const key = `${shard.index}.${shard.node}.${type}.${shard.state}.${shard.shard}${additionId}-${index}`;
    return (
      <Shard shard={ shard } key={ key }/>
    );
  },
  createChild: function (data) {
    const key = data.id;
    const classes = ['child'];
    const shardStats = this.props.shardStats;
    if (shardStats && shardStats[key]) {
      classes.push(shardStats[key].status);
    }

    const that = this;
    const changeUrl = function () {
      that.props.changeUrl(generateQueryAndLink(data));
    };

    const name = (
      <a onClick={ changeUrl } className='link'>
        <span>{ data.name }</span>
      </a>
    );
    let master;
    if (data.node_type === 'master') {
      master = (
        <span className="fa fa-star"></span>
      );
    }
    const shards = _.sortBy(data.children, 'shard').map(this.createShard);
    return (
      <div className={ calculateClass(data, classes.join(' ')) } key={ key }>
        <div className='title'>{ name }{ master }</div>
        { shards }
      </div>
    );
  },
  render: function () {
    const data = _.sortBy(this.props.data, sortByName).map(this.createChild);
    return (
      <td>
        <div className='children'>
          { data }
        </div>
      </td>
    );
  }
});
