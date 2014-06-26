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
      throw 'Please specify a urlFactory for CQRS queries. CQRSProvider.setUrlFactory(function (modelView) { .... }';
    };

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
     *  Angular.CQRS will pass in the modelView identifier and url parameters.
     */
    this.setUrlFactory = function (urlFactoryFunction) {
      urlFactory = urlFactoryFunction;
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
     * Is used to send commands, receive queries and subscribe to events.
     */
    this.$get = function ($q, $rootScope, $http) {

      /**
       * Send a HTTP GET request to the backend.
       * Use specified 'urlFactory' function to build URL.
       * Note: generally you should use Store#get()
       */
      function query(viewModel, parameters) {
        return $http.get(urlFactory(viewModel, parameters));
      }

      /**
       * @ngdoc function
       * @name ngCQRS.service:CQRS#sendCommand
       * @methodOf ngCQRS.service:CQRS
       *
       * @description
       *
       */
      function sendCommand(modelView, commandName, payload) {
        $rootScope.$emit('CQRS:commands', {modelView: modelView, commandName: commandName, payload: payload});
      }

      /**
       * @ngdoc function
       * @name ngCQRS.service:CQRS#onEvent
       * @methodOf ngCQRS.service:CQRS
       *
       * @description
       *
       */
      function onEvent(listener) {
        $rootScope.$on('CQRS:events', function (angularEvent, data) {
          listener(data);
        });
      }

      /**
       * @ngdoc function
       * @name ngCQRS.service:CQRS#eventReceived
       * @methodOf ngCQRS.service:CQRS
       *
       * @description
       *
       */
      function eventReceived(data) {
        $rootScope.$emit('CQRS:events', data);
      }

      /**
       * @ngdoc function
       * @name ngCQRS.service:CQRS#onCommand
       * @methodOf ngCQRS.service:CQRS
       *
       * @description
       *
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