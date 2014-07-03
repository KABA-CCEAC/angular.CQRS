angular.module('ngCQRS')

/**
 * @ngdoc object
 * @name ngCQRS.provider:CQRSProvider
 * @kind function
 *
 * @description
 * Handles the configuration of the CQRS module.
 */
  .provider('CQRS', function CQRS() {


    var urlFactory = function () {
        throw 'Please specify a urlFactory for CQRS queries. CQRSProvider.setUrlFactory(function (viewModelName) { .... }';
      },
      queryParserFunction = function (responseData) {
        return responseData;
      },
      eventParserFunction = function (responseData) {
        return responseData;
      };

    function throwIfInvalidFunction(func) {
      if (typeof func !== 'function') {
        throw 'Please specify a valid function!';
      }
    }

    /**
     * @ngdoc object
     * @name ngCQRS.provider:CQRSProvider#setUrlFactory
     * @methodOf ngCQRS.provider:CQRSProvider
     * @kind function
     *
     * @description
     * Registers a url factory function that will be used to generate query URLs.
     *
     * @param {function} urlFactoryFunction The factory function.
     *  Angular.CQRS will pass in the viewModelName identifier and url parameters.
     */
    this.setUrlFactory = function (urlFactoryFunction) {
      throwIfInvalidFunction(urlFactoryFunction);
      urlFactory = urlFactoryFunction;
    };

    /**
     * @ngdoc object
     * @name ngCQRS.provider:CQRSProvider#setQueryParser
     * @methodOf ngCQRS.provider:CQRSProvider
     * @kind function
     *
     * @description
     * Registers a parse function that will be used to modify all returned query responses.
     * This is optional.
     *
     * @param {function} parserFunction The parser function to modify the query response. angular.CQRS will pass in the query response.
     */
    this.setQueryParser = function (parserFunction) {
      throwIfInvalidFunction(parserFunction);
      queryParserFunction = parserFunction;
    };

    /**
     * @ngdoc object
     * @name ngCQRS.provider:CQRSProvider#setQueryParser
     * @methodOf ngCQRS.provider:CQRSProvider
     * @kind function
     *
     * @description
     * Registers a parse function that will be used to modify all incoming events.
     * This is optional.
     *
     * @param {function} parserFunction The parser function to modify the event. angular.CQRS will pass in the event object.
     */
    this.setEventParser = function (parserFunction) {
      throwIfInvalidFunction(parserFunction);
      eventParserFunction = parserFunction;
    };

    /**
     * @ngdoc object
     * @name ngCQRS.provider:CQRSProvider#toUrlGETParameterString
     * @methodOf ngCQRS.provider:CQRSProvider
     * @kind function
     *
     * @description
     *  Generates a url parameter string in the form '?paramNameOne=paramOne&paramNameTwo=paramTwo'
     *
     *  @param {object} parameters The url parameters object
     */
    this.toUrlGETParameterString = function (parameters) {
      var buffer = [];
      angular.forEach(parameters, function (paramValue, paramName) {
        buffer.push(paramName + '=' + paramValue);
      });
      return '?' + buffer.join('&');
    };

    /**
     * @ngdoc service
     * @kind function
     * @name ngCQRS.service:CQRS
     *
     * @description
     * Is used to send commands and define the specific channel over which messages will be sent.
     */
    this.$get = function ($q, $rootScope, $http) {

      /**
       * Send a HTTP GET request to the backend.
       * Use specified 'urlFactory' function to build URL.
       * Note: generally you should use Store#for()
       */
      function query(viewModelName, parameters) {
        var deferred = $q.defer();
        $http.get(urlFactory(viewModelName, parameters))
          .success(function (data) {
            deferred.resolve(queryParserFunction(data));
          })
          .error(deferred.reject);
        return deferred.promise;
      }

      /**
       * @ngdoc function
       * @name ngCQRS.service:CQRS#sendCommand
       * @methodOf ngCQRS.service:CQRS
       *
       * @description
       * Sends a command using the function registered by {@link ngCQRS.service:CQRS#onCommand onCommand}
       *
       * @param {object} commandObject The command object to send to the backend
       */
      function sendCommand(commandObject) {
        $rootScope.$emit('CQRS:commands', commandObject);
      }

      /**
       * Used to register a onEvent method in {@link ngCQRS.service:StoreService StoreService}
       */
      function onEvent(listener) {
        $rootScope.$on('CQRS:events', function (angularEvent, data) {
          listener(eventParserFunction(data));
        });
      }

      /**
       * @ngdoc function
       * @name ngCQRS.service:CQRS#eventReceived
       * @methodOf ngCQRS.service:CQRS
       *
       * @description
       * Used to call Angular.CQRS from your application, i.e. if a specific websocket message arrived.
       *
       * @param {object} event The received event
       */
      function eventReceived(event) {
        $rootScope.$emit('CQRS:events', event);
      }

      /**
       * @ngdoc function
       * @name ngCQRS.service:CQRS#onCommand
       * @methodOf ngCQRS.service:CQRS
       *
       * @description
       * Used to register a channel over which Angular.CQRS commands will be sent, i.e. websocket connection
       *
       * @param {function} listener The function with which the command should be sent
       */
      function onCommand(listener) {
        $rootScope.$on('CQRS:commands', function (angularEvent, data) {
          listener(data);
        });
      }

      return {
        query: query,
        sendCommand: sendCommand,
        onEvent: onEvent,
        onCommand: onCommand,
        eventReceived: eventReceived
      };
    };

  });
