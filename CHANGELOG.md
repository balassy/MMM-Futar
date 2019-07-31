# Change Log

All notable changes to this project is documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [1.5.1]

This is a maintenance release that updates all third party developer dependencies to the latest version. This change should not affect the functionality of the module.

- FIXED: Security vulnerabilities in [lodash](https://www.npmjs.com/advisories/1065), [set-value](https://www.npmjs.com/advisories/1012) and [mixin-deep](https://www.npmjs.com/advisories/1013) developer dependencies are fixed.

## [1.5.0]

- FIXED: This release uses the changed BKK API base URL through HTTPS and bypasses the CORS restrictions with JSONP. Please run `npm install` after downloading this version.

## [1.4.1]

This is a maintenance release that updates all third party developer dependencies to the latest version. This change should not affect the functionality of the module.

## [1.4.0]

- ADDED: Too early stop times can be hidden with the new `hideStopTimesInNextMinutes` configuration setting.

## [1.3.1]

- BUGFIX: The ferry, rail, subway and trolleybus vehicle icons are displayed properly. Subway and trolleybus text colors are slightly adjusted. See [issue #5](https://github.com/balassy/MMM-Futar/issues/5).

## [1.3.0]

- ADDED: The route name can be displayed in every stop time using the new `showRouteNameInStopTime` configuration switch.
- ADDED: The route name can be displayed in every stop time in colors using the new `coloredRouteNameInStopTime` configuration switch.
- ADDED: Operational alerts are displayed in every stop time by default, but this behavior can be changed using the properties of the new `alerts` object in the configuration.

## [1.2.0]

- ADDED: The symbol and the head text are colored colored by default, but this behavior can be changed with the new `colorSymbolInHead`, `coloredTextInHead`, `coloredSymbolInStopTime` and `symbolColors` configuration settings.

## [1.1.0]

- ADDED: The maximum number of displayed items can be configured with the `maxNumberOfItems` setting.

## [1.0.1]

- FIXED: Route name is displayed even if there is no upcoming departure in the monitored time window.

## [1.0.0]

- First public release.
