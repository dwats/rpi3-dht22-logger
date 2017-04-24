'use strict';
const makeMovingAverage = require('../moving-average');
const sensor = require('node-dht-sensor');
const rp = require('request-promise-native');

// TODO Promise-ify getDHTData()
// TODO Promise-ify startLogging()

/**
 * Make a DHT Logger Object
 * @param  {Object} settings starting parameters for the DHT Logger Object
 * @return {Object} 				 DHT Logger Object
 */
module.exports = (settings) => {
  const obj = {
    dhtType: settings.dhtType,
    dhtPin: settings.dhtPin,
    weatherApiKey: settings.weatherApiKey,
    data: {
      indoorAvgTemp: makeMovingAverage(6),
      indoorAvgHumidity: makeMovingAverage(6),
    },
    running: undefined
  }

	/**
	 * Return promise of data from DHT sensor
	 * @return {Promise} promise of temperature and humidity number values
	 */
	obj.getDHTData = () => {
		const type = obj.dhtType;
		const pin = obj.dhtPin;
		return new Promise((resolve, reject) => {
      sensor.read(type, pin, function(err, t, h) {
        const data = [];
        if (!err) {
      		data.push(t); // Temperature
      		data.push(h); // Humidity
      	}
        else {
          reject(err);
        }
        resolve(data);
      });
    });
	};

  /**
   * Return promise of data from Weather Undeground API endpoint
   * @return {Array} promise of temperature and humidity number values
   */
  obj.getWeatherData = () => {
    const apiKey = obj.weatherApiKey;
    const data = [];
    const options = {
      uri:`https://api.wunderground.com/api/${apiKey}/conditions/q/FL/32503.json`,
      headers: {
        'User-Agent': 'Request-Promise'
      },
      json: true
    }
    return rp(options)
      .then((res) => {
        const weather = res;
        const humidity = Number(weather.current_observation.relative_humidity.slice(0, 2));
        data.push(weather.current_observation.temp_c);
        data.push(weather.current_observation.temp_f);
        data.push(humidity);
        return data;
      })
      .catch((err) => {
        console.log('Error retrieving wunderground api JSON', err);
      });
  };

  /**
   * Return formatted DHT Sensor Data and Weather Undeground Data
   * @return {} [description]
   */
  obj.getFormattedData = (dhtData, wunderData) => {
    return Promise
      .all([dhtData, wunderData])
      .then((data) => {
        const dht = data[0];
        const wunder = data[1];
        const avgTemp = obj.data.indoorAvgTemp;
        const avgHumid = obj.data.indoorAvgHumidity;
        const avgInTempC = avgTemp.getMovingAverage(dht[0]);
        const avgInTempF = Number((avgInTempC * 1.8 + 32).toFixed(4));
        return {
          datetime: new Date(),
          indoor: {
            tempC: avgInTempC,
            tempF: avgInTempF,
            humid: avgHumid.getMovingAverage(dht[1])
          },
          outdoor: {
            tempC: wunder[0],
            tempF: wunder[1],
            humid: wunder[2]
          }
        }
      })
      .catch((err) => {
        console.warn('Error in getFormattedData\n', err);
      })
  };

  /**
   * Begin logging DHT data
   * @param {Number} interval how often data will be logged in milliseconds.
   */
  obj.startLogging = (interval = 240000) => {
    let running = obj.running;
    const timeout = interval;
    obj.getFormattedData(obj.getDHTData(), obj.getWeatherData())
      .then((data) => {
        console.log(data);
      });

    running = setInterval(() => {
      obj.getFormattedData(obj.getDHTData(), obj.getWeatherData())
        .then((data) => {
          console.log(data);
        });
    }, timeout);

  };

	return obj;
}
