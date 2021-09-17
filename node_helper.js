const NodeHelper = require('node_helper'); // eslint-disable-line import/no-unresolved
const request = require('request'); // eslint-disable-line import/no-extraneous-dependencies

module.exports = NodeHelper.create({
  start() {
    this._started = false;
    this._config = null;
  },

  socketNotificationReceived(notificationName, payload) {
    const self = this;

    if (notificationName === 'MMM-FUTAR.INIT') {
      if (!self._started) {
        self._config = payload;
        self._init();
        self.sendSocketNotification('MMM-FUTAR.STARTED', true);
        self._started = true;
      }
    }
  },

  _init() {
    const self = this;

    // Get the data immediately right after the module initialisation has completed.
    setTimeout(() => {
      self._getData();
    }, 0);

    setInterval(() => {
      self._getData();
    }, self._config.updateInterval);
  },

  _getData() {
    const self = this;

    const url = `https://futar.bkk.hu/api/query/v1/ws/otp/api/where/arrivals-and-departures-for-stop.json?stopId=${self._config.stopId}&onlyDepartures=true&minutesBefore=0&minutesAfter=${self._config.minutesAfter}`;

    request(url, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        self._processResponse(body);
      } else {
        console.error(`MMM-Futar Node helper: Failed to load data in the background. Error: ${error}. Response: ${response}`); // eslint-disable-line no-console
      }
    });
  },

  _processResponse(responseBody) {
    const response = JSON.parse(responseBody);
    const payload = response.data;
    this.sendSocketNotification('MMM-FUTAR.VALUE_RECEIVED', payload);
  }
});
