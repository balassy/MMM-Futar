/* global Module, Log, moment, config */

/* Magic Mirror Module: MMM-Futar (https://github.com/balassy/MMM-Futar)
 * By György Balássy (https://www.linkedin.com/in/balassy)
 * MIT Licensed.  */

Module.register('MMM-Futar', {
  defaults: {
    updateInterval: 60000,
    hideStopTimesInNextMinutes: 0,
    minutesAfter: 50,
    fade: true,
    fadePoint: 0.25,
    align: 'left', // 'left' | 'right',
    showHead: true, // true | false
    showSymbolInHead: true, // true | false
    showSymbolInStopTime: false, // true | false
    showRouteNameInStopTime: false, // true | false
    maxNumberOfItems: 3,
    coloredSymbolInHead: true, // true | false
    coloredTextInHead: true, // true | false
    coloredSymbolInStopTime: true, // true | false
    coloredRouteNameInStopTime: true, // true | false
    symbolColors: {
      tram: '#ffcf42', // yellow-ish
      bus: '#1a9fed', // blue-ish
      subway: '#b3090c', // red-ish
      trolleybus: '#931517', // dark red-ish
      rail: '#5cbc82', // green-ish
      ferry: '#1a52ed' // dark-blue-ish
    },
    alerts: {
      showHeaderInStopTime: true, // true | false
      showSymbolInStopTime: true, // true | false
      color: '#ffcf42', // 'auto' or any CSS color
      language: config.language // 'en' or 'hu' supported only by the Futár API
    }
  },

  requiresVersion: '2.1.0',

  getScripts() {
    return [
      'moment.js',
      'moment-timezone.js'
    ];
  },

  getStyles() {
    return [
      'MMM-Futar.css',
      'font-awesome.css'
    ];
  },

  getTranslations() {
    return {
      en: 'translations/en.json',
      hu: 'translations/hu.json'
    };
  },

  start() {
    const self = this;
    self.viewModel = null;
    self.hasData = false;

    moment.locale(config.language);

    self.sendSocketNotification('MMM-FUTAR.INIT', self.config);
  },

  getDom() {
    const wrapper = document.createElement('div');

    if (this.viewModel) {
      if (this.config.showHead) {
        const headEl = this._getDomForHead(this.viewModel.routeType);
        wrapper.appendChild(headEl);
      }

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

  _getDomForHead(routeType) {
    const headEl = document.createElement('div');

    if (this.config.showSymbolInHead) {
      const headSymbolEl = document.createElement('span');
      headSymbolEl.classList = this._getCssClassNameForRouteType(routeType);

      if (this.config.coloredSymbolInHead) {
        headSymbolEl.style = `color: ${this._getColorForRouteType(routeType)}`;
      }

      headEl.appendChild(headSymbolEl);
    }

    const headTextEl = document.createElement('span');
    headTextEl.innerHTML = this.viewModel.routeName;
    if (this.config.coloredTextInHead) {
      headTextEl.style = `color: ${this._getColorForRouteType(routeType)}`;
    }
    headEl.appendChild(headTextEl);

    return headEl;
  },

  _getDomForDepartureTime(departureTimes, index) {
    const departureTime = departureTimes[index];

    const timeEl = document.createElement('tr');
    timeEl.classList = 'small';
    timeEl.style.opacity = this._getRowOpacity(departureTimes.length, index);

    if (this.config.showSymbolInStopTime) {
      const symbolEl = this._getDomForSymbolInStopTime(departureTime.routeType);
      timeEl.appendChild(symbolEl);
    }

    if (this.config.showRouteNameInStopTime) {
      const routeNameEl = this._getDomForRouteNameInStopTime(departureTime.routeName, departureTime.routeType);
      timeEl.appendChild(routeNameEl);
    }

    const relativeTimeEl = document.createElement('td');
    relativeTimeEl.classList = 'relative-time';
    relativeTimeEl.innerHTML = departureTime.relativeTime;
    timeEl.appendChild(relativeTimeEl);

    const absoluteTimeEl = document.createElement('td');
    absoluteTimeEl.classList = 'absolute-time dimmed';
    absoluteTimeEl.innerHTML = ` (${departureTime.absoluteTime})`;
    timeEl.appendChild(absoluteTimeEl);

    if (this.config.alerts.showHeaderInStopTime && departureTime.alertHeader) {
      const alertEl = this._getDomForAlertHeaderInStopTime(departureTime.alertHeader);
      timeEl.appendChild(alertEl);
    }

    return timeEl;
  },

  _getDomForSymbolInStopTime(routeType) {
    const symbolEl = document.createElement('td');
    symbolEl.classList = `${this._getCssClassNameForRouteType(routeType)} symbol-mini`;

    if (this.config.coloredSymbolInStopTime) {
      symbolEl.style = `color: ${this._getColorForRouteType(routeType)}`;
    }

    return symbolEl;
  },

  _getDomForRouteNameInStopTime(routeName, routeType) {
    const routeNameEl = document.createElement('td');
    routeNameEl.innerHTML = routeName;
    routeNameEl.classList = 'route-name';

    if (this.config.coloredRouteNameInStopTime) {
      routeNameEl.style = `color: ${this._getColorForRouteType(routeType)}`;
    }

    return routeNameEl;
  },

  _getDomForAlertHeaderInStopTime(alertHeader) {
    const alertColor = this._getColorForAlert();

    const alertEl = document.createElement('td');
    alertEl.style = `color: ${alertColor}`;

    if (this.config.alerts.showSymbolInStopTime) {
      const alertSymbolEl = document.createElement('span');
      alertSymbolEl.classList = 'alert-symbol fa fa-exclamation-triangle';
      alertEl.appendChild(alertSymbolEl);
    }

    const alertTextEl = document.createElement('span');
    alertTextEl.classList = 'alert-header';
    alertTextEl.innerHTML = alertHeader;
    alertEl.appendChild(alertTextEl);

    return alertEl;
  },

  _getColorForAlert() {
    return this.config.alerts.color || 'auto';
  },

  _getCssClassNameForRouteType(routeType) {
    let classList = 'symbol fa ';

    switch (routeType) {
      case 'BUS':
        classList += 'fa-bus';
        break;
      case 'FERRY':
        classList += 'fa-ship';
        break;
      case 'RAIL':
        classList += 'fa-train';
        break;
      case 'SUBWAY':
        classList += 'fa-subway';
        break;
      case 'TRAM':
        classList += 'fa-train';
        break;
      case 'TROLLEYBUS':
        classList += 'fa-bus-alt';
        break;
      default:
        break;
    }

    return classList;
  },

  _getColorForRouteType(routeType) {
    if (!routeType) {
      throw new Error('Please specify the routeType to determine its color!');
    }

    const routeTypeLowerCased = routeType.toLowerCase();

    let resultColor = 'auto';

    if (this.config.symbolColors[routeTypeLowerCased]) {
      resultColor = this.config.symbolColors[routeTypeLowerCased];
    } else {
      Log.error(this.name, `MMM-Futar: No symbol color defined for ${routeTypeLowerCased}`);
    }

    return resultColor;
  },

  socketNotificationReceived(notificationName, payload) {
    if (notificationName === 'MMM-FUTAR.STARTED') {
      this.updateDom();
    } else if (notificationName === 'MMM-FUTAR.VALUE_RECEIVED') {
      this.hasData = true;
      this._processResponseJson(payload);
      this.updateDom();
    }
  },

  _processResponseJson(response) {
    const departureTimes = [];

    const trips = this._getAllTripsFromResponse(response);
    const routes = this._getAllRoutesFromResponse(response);
    const alerts = this._getAllAlertsFromResponse(response);

    const stopTimes = this._getAllStopTimesFromResponse(response);
    for (let i = 0; i < stopTimes.length; i++) {
      const stopTime = stopTimes[i];
      const tripId = this._getTripIdFromStopTime(stopTime);
      const trip = this._getTripById(trips, tripId);
      const routeId = this._getRouteIdFromTrip(trip);
      const route = this._getRouteById(routes, routeId);
      const routeType = this._getRouteType(route);
      const routeName = this._getRouteName(route, routes);

      const alertIds = this._getAlertIdsFromStopTime(stopTime);
      const alertHeader = this._getAlertHeader(alerts, alertIds);

      if (!this.config.routeId || routeId === this.config.routeId) {
        const departureTimestamp = this._getDepartureTimestampFromStopTime(stopTime);
        const timeInLocalTime = this._convertTimestampToLocalTime(departureTimestamp);
        const departureTime = {
          relativeTime: timeInLocalTime.fromNow(),
          absoluteTime: timeInLocalTime.format('LT'),
          routeName,
          routeType,
          alertHeader
        };

        // Filter out stop times that are too early.
        const now = moment();
        const relativeTimeInMinutes = (timeInLocalTime - now) / 1000 / 60;
        if (relativeTimeInMinutes >= this.config.hideStopTimesInNextMinutes) {
          departureTimes.push(departureTime);
        }
      }
    }

    const departureTimesLimited = departureTimes.length > this.config.maxNumberOfItems
      ? departureTimes.slice(0, this.config.maxNumberOfItems)
      : departureTimes;

    this.viewModel = {
      departureTimes: departureTimesLimited,
      routeType: departureTimesLimited.length > 0
        ? departureTimesLimited[0].routeType
        : 'BUS',
      routeName: departureTimesLimited.length > 0
        ? departureTimesLimited[0].routeName
        : this._getRouteName(null, routes)
    };

    if (!this.hasData) {
      this.updateDom();
    }

    this.hasData = true;
  },

  _getAllStopTimesFromResponse(response) {
    return response.entry.stopTimes;
  },

  _getAllRoutesFromResponse(response) {
    return response.references.routes;
  },

  _getAllAlertsFromResponse(response) {
    return response.references.alerts;
  },

  _getAlertIdsFromStopTime(stopTime) {
    return stopTime.alertIds;
  },

  _getTripIdFromStopTime(stopTime) {
    return stopTime.tripId;
  },

  _getAllTripsFromResponse(response) {
    return response.references.trips;
  },

  _getTripById(trips, tripId) {
    return trips[tripId];
  },

  _getRouteIdFromTrip(trip) {
    return trip.routeId;
  },

  _getRouteById(routes, routeId) {
    return routes[routeId];
  },

  _getDepartureTimestampFromStopTime(stopTime) {
    return stopTime.predictedArrivalTime || stopTime.arrivalTime || stopTime.departureTime;
  },

  _getRouteType(route) {
    return route.type;
  },

  _getRouteName(route, allRoutes) {
    return route
      ? route.shortName
      : this.config.routeId
        ? allRoutes[this.config.routeId].shortName
        : allRoutes[Object.keys(allRoutes)[0]].shortName; // TODO
  },

  _getAlertHeader(alerts, alertIds) {
    let resultHeader = '';

    if (!alerts || !alertIds) {
      return resultHeader;
    }

    for (let alertIdIndex = 0; alertIdIndex < alertIds.length; alertIdIndex++) {
      const alertId = alertIds[alertIdIndex];
      const alert = alerts[alertId];
      const alertHeader = alert.header.translations[this.config.alerts.language];
      resultHeader += `${alertHeader} `;
    }
    return resultHeader;
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
        opacity = 1 - ((1 / steps) * currentStep);
      }
    }

    return opacity;
  }
});
