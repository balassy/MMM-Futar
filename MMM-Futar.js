/* global Module, Log */

/* Magic Mirror Module: MMM-Futar (https://github.com/balassy/MMM-Futar)
 * By György Balássy (https://www.linkedin.com/in/balassy)
 * MIT Licensed.
 */

Module.register('MMM-Futar', {
  defaults: {
    updateInterval: 60000,
  },

  requiresVersion: '2.1.0',

  getTranslations() {
    return {
      en: 'translations/en.json',
      hu: 'translations/hu.json'
    };
  },

  start() {
    const self = this;
    this.viewModel = null;
    this.hasData = false;

    this._getData();

    setInterval(() => {
      self.updateDom();
    }, this.config.updateInterval);
  },

  getDom() {
    const wrapper = document.createElement('div');

    if (this.viewModel) {
      const priceEl = document.createElement('div');
      priceEl.innerHTML = this.viewModel.headSign
      wrapper.appendChild(priceEl);
    } else {
      const loadingEl = document.createElement('span');
      loadingEl.innerHTML = this.translate('LOADING');
      loadingEl.classList = 'dimmed small';
      wrapper.appendChild(loadingEl);
    }

    return wrapper;
  },

  _getData() {
    const self = this;

    const url = `http://futar.bkk.hu/bkk-utvonaltervezo-api/ws/otp/api/where/arrivals-and-departures-for-stop.json?stopId=${this.config.stopId}&onlyDepartures=true&minutesBefore=0&minutesAfter=45`;

    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function onReadyStateChange() {
      if (this.readyState === 4) {
        if (this.status === 200) {
          self._processResponse(this.response);
        } else {
          Log.error(self.name, `MMM-Futar: Failed to load data. XHR status: ${this.status}`);
        }
      }
    };

    xhr.send();
  },

  _processResponse(responseBody) {
    const response = JSON.parse(responseBody);

    this.viewModel = {
      headSign: response.data.entry.stopTimes[0].stopHeadsign
    };

    if (!this.hasData) {
      this.updateDom();
    }

    this.hasData = true;
  }
});
