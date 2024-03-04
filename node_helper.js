const NodeHelper = require('node_helper'); // eslint-disable-line import/no-unresolved
const request = require('request'); // eslint-disable-line import/no-extraneous-dependencies

module.exports = NodeHelper.create({
  start() {
    this._startedModules = {};
  },

  socketNotificationReceived(notificationName, payload) {
    const self = this;

    if (notificationName === 'MMM-FUTAR.INIT') {
      if (!self._startedModules[payload.moduleId]) {
        self._init(payload.moduleId, payload.config);
        self.sendSocketNotification('MMM-FUTAR.STARTED', true);
        self._startedModules[payload.moduleId] = true;
      }
    }
  },

  _init(moduleId, config) {
    const self = this;

    // Get the data immediately right after the module initialisation has completed.
    setTimeout(() => {
      self._getData(moduleId, config);
    }, 0);

    setInterval(() => {
      self._getData(moduleId, config);
    }, config.updateInterval);
  },

  _getData(moduleId, config) {
    const self = this;

    const url = `https://futar.bkk.hu/api/query/v1/ws/otp/api/where/arrivals-and-departures-for-stop.json?stopId=${config.stopId}&onlyDepartures=true&minutesBefore=0&minutesAfter=${config.minutesAfter}&key=${config.apiKey}`;

    request(url, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        self._processResponse(moduleId, body);
      } else {
        console.error(`MMM-Futar Node helper: Failed to load data in the background. Error: ${error}. Response: ${response}`); // eslint-disable-line no-console
      }
    });
  },

  _processResponse(moduleId, responseBody) {
    const response = JSON.parse(responseBody);
    const payload = {
      moduleId: moduleId,
      data: response.data
    };
    this.sendSocketNotification('MMM-FUTAR.VALUE_RECEIVED', payload);
  }
});
