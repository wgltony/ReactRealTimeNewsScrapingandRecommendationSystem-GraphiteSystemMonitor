'use strict';

var isDate = function isDate(key) {
  return key === "date";
};

module.exports = function (initialData, fields, maxValues) {
  if (initialData.length > maxValues) {
    initialData = initialData.slice(initialData.length - maxValues);
  }

  var columnData = {
    'date': []
  };

  fields.forEach(function (f) {
    return columnData[f] = [];
  });

  initialData.forEach(function (value) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = Object.keys(value)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var key = _step.value;

        if (!columnData[key]) continue;
        columnData[key].push(isDate(key) ? new Date(value[key]) : value[key]);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  });

  var columns = [];
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = Object.keys(columnData)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var key = _step2.value;

      if (isDate(key)) {
        columns.push(['x'].concat(columnData[key]));
      } else columns.push([key].concat(columnData[key]));
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  return columns;
};