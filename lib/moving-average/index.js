/**
 * Make a Moving Average Object
 * @param  {Number} dataCount the number of values to divide the sum of all values by.
 * @return {Object}           Moving Average Object
 */
module.exports = (dataCount) => {
  const obj = {
    'dataCount': dataCount,
    'data': undefined
  };

  /**
   * Return the value of the moving average
   * @param  {Number} value number to add to moving average sum
   * @return {Number}       moving avarage value
   */
  obj.getMovingAverage = (value) => {
    let data = obj.data;
    const count = obj.dataCount;
    if (!data) {
      data = Array(count).fill(value);
    } else {
      data
        .pop()
        .splice(0, 0, value);
    }
    return Number((data.reduce((x, y) => x + y) / count).toFixed(4));
  };

  return obj;
}
