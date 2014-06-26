angular.module('ngCQRS')

/**
 * @ngdoc object
 * @name ngCQRS.service:StoreService
 *
 * @description
 * Used to obtain a {@link ngCQRS.service:Store Store} instance.
 */
  .service('StoreService', function StoreService($rootScope, $q, $filter, $timeout, CQRS) {

    var scopeCallbacks = {}, denormalizerFunctions = {};

    function isValidDataModelUpdateEvent(evt) {
      return (angular.isDefined(evt.payload) && angular.isDefined(evt.name) && angular.isDefined(evt.aggregateType));
    }

    function getDenormalizerFunctions(aggregateType, eventName) {
      if (angular.isUndefined(denormalizerFunctions[aggregateType])) {
        return {};
      }
      if (angular.isUndefined(denormalizerFunctions[aggregateType][eventName])) {
        return {};
      }
      return denormalizerFunctions[aggregateType][eventName];
    }

    function init() {
      // register for events and update our store with the new data
      CQRS.onEvent(function (evt) {
        if (!isValidDataModelUpdateEvent(evt)) {
          return;
        }

        var denormalizerFunctions = getDenormalizerFunctions(evt.aggregateType, evt.name);
        angular.forEach(denormalizerFunctions, function (denormalizerFunction, viewModelName) {
          var scopeCallback = scopeCallbacks[viewModelName];
          if (angular.isDefined(scopeCallback)) {
            scopeCallback.data = denormalizerFunction(scopeCallback.data, evt.payload);
            scopeCallback.callbacks.forEach(function (callback) {
              callback.callbackFunction(scopeCallback.data);
            });
          }
        });
        $rootScope.$apply();
      });
    }

    init();

    /**
     * @ngdoc object
     * @name ngCQRS.service:StoreService#registerDenormalizerFunction
     * @methodOf ngCQRS.service:StoreService
     * @kind function
     *
     * @description
     * Can be used to register a denormalization function for incoming events. Can be used to merge the change delta into the existing dataset on the client.
     *
     * Registering a denormalization function is optional. If no denormalizer is registered for a specifiv viewModelName and event combination, the event payload itself is passed to the {@link ngCQRS.service:Store#do do} callback.
     *
     * @param {string} viewModelName The viewModelName identifier
     * @param {string} eventName The event identifier
     * @param {function} denormalizerFunction The function used to merge (denormalized) event payload and original viewModelName data.
     *    Angular.CQRS will pass in the original viewModelName data and the event payload.
     *
     */
    function registerDenormalizerFunction(viewModelName, aggregateType, eventName, denormalizerFunction) {
      if (angular.isUndefined(denormalizerFunctions[aggregateType])) {
        denormalizerFunctions[aggregateType] = {};
      }
      if (angular.isUndefined(denormalizerFunctions[aggregateType][eventName])) {
        denormalizerFunctions[aggregateType][eventName] = {};
      }
      if (angular.isDefined(denormalizerFunctions[aggregateType][eventName][viewModelName])) {
        throw 'Denormalizer function for viewModelName "' + viewModelName + '", aggregateType: "' + aggregateType + '" and eventName "' + eventName + '" already defined.';
      }
      denormalizerFunctions[aggregateType][eventName][viewModelName] = denormalizerFunction;
    }

    function throwErrorIfInvalidGetArguments(viewModelName, parameters, callback) {
      if (angular.isUndefined(parameters) || typeof parameters !== 'object') {
        throw 'Please provide a valid parameters object!';
      }
      if (angular.isUndefined(viewModelName) || typeof viewModelName !== 'string') {
        throw 'Please provide a valid model Name (string)!';
      }
      if (angular.isUndefined(callback) || typeof callback !== 'function') {
        throw 'Please provide a valid callback function!';
      }
    }

    function handleQueryResponse(queryResult, viewModelName, callback, scopeId) {
      if (angular.isDefined(scopeCallbacks[viewModelName])) {
        scopeCallbacks[viewModelName].callbacks.push({callbackFunction: callback, scopeId: scopeId});
        scopeCallbacks[viewModelName].data = queryResult;
      } else {
        scopeCallbacks[viewModelName] = {
          data: queryResult,
          callbacks: [
            {
              callbackFunction: callback,
              scopeId: scopeId
            }
          ]
        };
      }
      callback(queryResult);
    }


    function removeCallbacksForScope(scope) {

      var orphanedStoreItems = [];

      angular.forEach(scopeCallbacks, function (callbackItem, viewName) {
        var cleanedCallbacks = $filter('filter')(callbackItem.callbacks, function (callback) {
          return (callback.scopeId !== scope.$id);
        });
        if (cleanedCallbacks.length < 1) {
          orphanedStoreItems.push(viewName);
        } else {
          callbackItem.callbacks = cleanedCallbacks;
        }
      });

      orphanedStoreItems.forEach(function (orphan) {
        scopeCallbacks[orphan] = undefined;
      });
    }

    /**
     *  Queries the server for the required model. Will update given Scope on server events
     */
    function get(viewModelName, parameters, callback, scopeId) {
      throwErrorIfInvalidGetArguments(viewModelName, parameters, callback);
      var queryPromise = CQRS.query(viewModelName, parameters);
      queryPromise.then(function (result) {
        handleQueryResponse(result.data, viewModelName, callback, scopeId);
      });
    }

    /**
     * @ngdoc object
     * @name ngCQRS.service:Store
     *
     * @description
     *  The store allows for querying modelViews and registering for subsequent events on that viewModelName.
     */
    var StoreObject = function (scopeId) {

      /**
       * @ngdoc function
       * @name ngCQRS.service:Store#for
       * @methodOf ngCQRS.service:Store
       *
       * @description
       *  Specify the a viewModelName and optional url parameters
       *
       *  @param {string} viewModelName The identifier of the viewModelName
       *  @param {object} parameters An optional object containing url parameters. This will be passed toghether with the viewModelName identifier into your {@link ngCQRS.provider:CQRSProvider#setUrlFactory urlFactory} function.
       */
      this.for = function (viewModelName, parameters) {
        this.viewModelName = viewModelName;
        this.parameters = parameters || {};
        return this;
      };

      /**
       * @ngdoc function
       * @name ngCQRS.service:Store#do
       * @methodOf ngCQRS.service:Store
       *
       * @description
       *  register a handler for events on the specified viewModelName
       *
       *  @param {function} callback Function that is called on first query response and on subsequent events.
       *    Angular.CQRS will pass in the denormalized object (See {@link ngCQRS.provider:CQRSProvider#registerDenormalizerFunctions registerDenormalizerFunctions}).
       */
      this.do = function (callback) {
        get(this.viewModelName, this.parameters, callback, scopeId);
      };
    };

    /**
     * @ngdoc function
     * @name ngCQRS.service:StoreService#createForController
     * @methodOf ngCQRS.service:StoreService
     *
     * @description
     * Creates a {@link ngCQRS.service:Store Store} for your controller.
     *
     *  @param {object} $scope The angular $scope of your controller.
     *  Used to correctly clean-up the store once your controller scope is destroyed.
     */
    function createForController($scope) {
      $scope.$on('$destroy', function (evt) {
        removeCallbacksForScope(evt.currentScope);
      });
      return new StoreObject($scope.$id);
    }

    /**
     * @ngdoc function
     * @name ngCQRS.service:StoreService#createForService
     * @methodOf ngCQRS.service:StoreService
     *
     * @description
     * Creates a {@link ngCQRS.service:Store Store} for your service.
     */
    function createForService() {
      return new StoreObject(undefined);
    }

    return {
      createForController: createForController,
      createForService: createForService,
      registerDenormalizerFunction: registerDenormalizerFunction
    };

  });
