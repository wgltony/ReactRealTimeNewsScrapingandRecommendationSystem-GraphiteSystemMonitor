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

/**
 * THESE ARE AUTOMATICALLY INCLUDED IN LODASH
 *
 * use:
 * var _ = require('lodash');
 */

const _ = require('node_modules/lodash/index.js').runInContext();
require('ui/utils/lodash-mixins/string')(_);
require('ui/utils/lodash-mixins/lang')(_);
require('ui/utils/lodash-mixins/object')(_);
require('ui/utils/lodash-mixins/collection')(_);
require('ui/utils/lodash-mixins/function')(_);
require('ui/utils/lodash-mixins/oop')(_);
module.exports = _;
