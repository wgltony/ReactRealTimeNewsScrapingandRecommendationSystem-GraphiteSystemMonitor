/*
 * ELASTICSEARCH CONFIDENTIAL
 *
 * Copyright (c) 2017 Elasticsearch BV. All Rights Reserved.
 *
 * Notice: this software, and all information contained
 * therein, is the exclusive property of Elasticsearch BV
 * and its licensors, if any, and is protected under applicable
 * domestic and foreign law, and international treaties.
 *
 * Reproduction, republication or distribution without the
 * express written consent of Elasticsearch BV is
 * strictly prohibited.
 */

import visTypes from 'ui/registry/vis_types';
import ConnectionsMapProvider from './connectionsmap/connectionsmap';
import InfluencersListProvider from './influencerslist/influencerslist';
import SwimlaneProvider from './swimlane/swimlane';

visTypes.register(ConnectionsMapProvider);
visTypes.register(InfluencersListProvider);
visTypes.register(SwimlaneProvider);
