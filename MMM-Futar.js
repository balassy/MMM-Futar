/* global Module, Log, moment */

/* Magic Mirror Module: MMM-Futar (https://github.com/balassy/MMM-Futar)
 * By György Balássy (https://www.linkedin.com/in/balassy)
 * MIT Licensed.
 */

Module.register('MMM-Futar', {
  defaults: {
    updateInterval: 60000,
    minutesAfter: 60,
    fade: true,
    fadePoint: 0.25,
    align: 'left' // 'left' | 'right'
  },

  requiresVersion: '2.1.0',

  getScripts() {
    return [
      'moment.js',
      'moment-timezone.js'
    ];
  },

  getStyles() {
    return ['MMM-Futar.css'];
  },

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
      if (this.viewModel.departureTimes.length === 0) {
        const noDepartureEl = this._getDomForNoDeparture();
        wrapper.appendChild(noDepartureEl);
      } else {
        const tableEl = document.createElement('table');

        if (this.config.align === 'right') {
          tableEl.classList = 'align-right';
        }

        for (let i = 0; i < this.viewModel.departureTimes.length; i++) {
          const rowEl = this._getDomForDepartureTime(this.viewModel.departureTimes, i);
          tableEl.appendChild(rowEl);
        }

        wrapper.appendChild(tableEl);

        const clearfixEl = document.createElement('div');
        clearfixEl.classList = 'clearfix';
        wrapper.appendChild(clearfixEl);
      }
    } else {
      const loadingEl = this._getDomForLoading();
      wrapper.appendChild(loadingEl);
    }

    return wrapper;
  },

  _getDomForLoading() {
    const loadingEl = document.createElement('div');
    loadingEl.innerHTML = this.translate('LOADING');
    loadingEl.classList = 'dimmed small';
    return loadingEl;
  },

  _getDomForNoDeparture() {
    const noDepartureEl = document.createElement('div');
    noDepartureEl.innerHTML = this.translate('NO_DEPARTURE', { minutes: this.config.minutesAfter });
    noDepartureEl.classList = 'dimmed small';
    return noDepartureEl;
  },

  _getDomForDepartureTime(departureTimes, index) {
    const departureTime = departureTimes[index];

    const timeEl = document.createElement('tr');
    timeEl.classList = 'small';
    timeEl.style.opacity = this._getRowOpacity(departureTimes.length, index);

    const relativeTimeEl = document.createElement('td');
    relativeTimeEl.classList = 'relative-time';
    relativeTimeEl.innerHTML = departureTime.relativeTime;
    timeEl.appendChild(relativeTimeEl);

    const absoluteTimeEl = document.createElement('td');
    absoluteTimeEl.classList = 'absolute-time dimmed';
    absoluteTimeEl.innerHTML = ` (${departureTime.absoluteTime})`;
    timeEl.appendChild(absoluteTimeEl);

    return timeEl;
  },

  _getData() {
    const self = this;

    const url = `http://futar.bkk.hu/bkk-utvonaltervezo-api/ws/otp/api/where/arrivals-and-departures-for-stop.json?stopId=${this.config.stopId}&onlyDepartures=true&minutesBefore=0&minutesAfter=${this.config.minutesAfter}`;

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

    const departureTimes = [];

    const trips = this._getAllTripsFromResponse(response);

    const stopTimes = this._getAllStopTimesFromResponse(response);
    for (let i = 0; i < stopTimes.length; i++) {
      const stopTime = stopTimes[i];
      const tripId = this._getTripIdFromStopTime(stopTime);
      const trip = this._getTripById(trips, tripId);
      const routeId = this._getRouteIdFromTrip(trip);

      if (!this.config.routeId || routeId === this.config.routeId) {
        const departureTimestamp = this._getDepartureTimestampFromStopTime(stopTime);
        const timeInLocalTime = this._convertTimestampToLocalTime(departureTimestamp);
        const departureTime = {
          relativeTime: timeInLocalTime.fromNow(),
          absoluteTime: timeInLocalTime.format('LT')
        };
        departureTimes.push(departureTime);
      }
    }

    this.viewModel = {
      headSign: response.data.entry.stopTimes[0].stopHeadsign,
      departureTimes
    };

    if (!this.hasData) {
      this.updateDom();
    }

    this.hasData = true;
  },

  _getAllStopTimesFromResponse(response) {
    return response.data.entry.stopTimes;
  },

  _getTripIdFromStopTime(stopTime) {
    return stopTime.tripId;
  },

  _getAllTripsFromResponse(response) {
    return response.data.references.trips;
  },

  _getTripById(trips, tripId) {
    return trips[tripId];
  },

  _getRouteIdFromTrip(trip) {
    return trip.routeId;
  },

  _getDepartureTimestampFromStopTime(stopTime) {
    return stopTime.predictedArrivalTime || stopTime.arrivalTime || stopTime.departureTime;
  },

  _convertTimestampToLocalTime(timestamp) {
    const TIMEZONE_NAME = 'Europe/Budapest';
    const timeInMilliseconds = timestamp * 1000;
    const timeInGmt = new Date(timeInMilliseconds);
    const timeInLocalTime = moment(timeInGmt).tz(TIMEZONE_NAME);
    return timeInLocalTime;
  },

  _getRowOpacity(totalNumberOfRows, currentRowNumber) {
    let opacity = 1;

    if (this.config.fade && this.config.fadePoint < 1) {
      if (this.config.fadePoint < 0) {
        this.config.fadePoint = 0;
      }
      const startingPoint = totalNumberOfRows * this.config.fadePoint;
      const steps = totalNumberOfRows - startingPoint;
      if (currentRowNumber >= startingPoint) {
        const currentStep = currentRowNumber - startingPoint;
        opacity = 1 - (1 / steps * currentStep);
      }
    }

    return opacity;
  }
});
