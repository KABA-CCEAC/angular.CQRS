angular.module('ngCQRS')

/**
 * @ngdoc object
 * @name ngCQRS.provider:CQRSProvider
 * @kind function
 *
 * @description
 * Handles the configuration of the CQRS module.
 *
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
      },
      commandIdExtractionFunction = function (event) {
        return event.commandId;
      };

    function throwIfInvalidFunction(func) {
      if (typeof func !== 'function') {
        throw 'Please specify a valid function!';
      }
    }

    /**
     * @ngdoc object
     * @name ngCQRS.provider:CQRSProvider#setCommandIdExtractionFunction
     * @methodOf ngCQRS.provider:CQRSProvider
     * @kind function
     *
     * @description
     * Registers a function to extract the commandId from an incoming event.
     *
     * @param {function} commandIdFunction The comanndId extraction function.
     *  Angular.CQRS will pass in the received event (after parsing).
     */
    this.setCommandIdExtractionFunction = function (commandIdFunction) {
      throwIfInvalidFunction(commandIdFunction);
      commandIdExtractionFunction = commandIdFunction;
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
     * @name ngCQRS.service:CQRS
     *
     * @description
     * Is used to send commands and define the specific channel over which messages will be sent.
     *
     * ### Usage
     *
     * In order to connect angular.CQRS to your websocket / long polling solution, wire up commands and events.
     *
     * ```javascript
     * var mySocket = io();
     *
     * // pass in events from your socket
     * mySocket.on('events', function (data) {
     *  CQRS.eventReceived(data);
     * });
     *
     * // pass commands to your socket
     * CQRS.onCommand(function (data) {
     *  mySocket.emit('commands', data);
     * });
     *  ```
     * To send Commands to the server:
     *
     * ```javascript
     * CQRS.sendCommand({
     *  command: 'changeProfile',
     *  aggregateType: 'profile',
     *  payload: {
     *    description: 'new Description',
     *    id: result.profile.id
     *  }
     * });
     *  ```
     */
    this.$get = function ($q, $rootScope, $http, ObjectId) {


      var commandCallbacks = {};
      var commandDeferreds = {};


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
          .error(function (data, status) {
            deferred.reject({data: data, status: status});
          });
        return deferred.promise;
      }

      function augmentCommandObject(command) {
        if (angular.isUndefined(command.id)) {
          command.id = ObjectId().toString();
        }
        return command;
      }


      function storeCommandCallbackFunction(commandId, callbackFunction) {
        if (angular.isUndefined(callbackFunction)) {
          return;
        }

        if (typeof callbackFunction !== 'function') {
          throw 'Please specify a valid callback function...';
        }

        commandCallbacks[commandId] = callbackFunction;
      }

      function storeCommandDeferred(commandId, deferred) {
        commandDeferreds[commandId] = deferred;
      }

      function invokeCommandCallbackOrResolvePromise(event) {
        var commandId = commandIdExtractionFunction(event);
        var callback = commandCallbacks[commandId];
        if (angular.isDefined(callback)) {
          callback();
          commandCallbacks[commandId] = undefined;
        }

        var deferred = commandDeferreds[commandId];
        if (angular.isDefined(deferred)) {
          deferred.resolve();
          commandDeferreds[commandId] = undefined;
        }
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
       * @param {function} callbackFunction A optional callback function that is invoked once, as soon as the correspondant event returns from the server
       * @returns {*} Returns a promise object that will be resolved as soon as the correspondant event returns from the server (alternative to the callback function)
       */
      function sendCommand(commandObject, callbackFunction) {
        var augmentedCommandObject = augmentCommandObject(commandObject);

        $rootScope.$emit('CQRS:commands', augmentedCommandObject);

        storeCommandCallbackFunction(augmentedCommandObject.id, callbackFunction);
        var deferred = $q.defer();
        storeCommandDeferred(augmentedCommandObject.id, deferred);
        return deferred.promise;
      }

      /**
       * Used to register a onEvent method in {@link ngCQRS.service:StoreService StoreService}
       */
      function onEvent(listener) {
        $rootScope.$on('CQRS:events', function (angularEvent, data) {
          var event = eventParserFunction(data);
          invokeCommandCallbackOrResolvePromise(event);
          listener(event);
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
