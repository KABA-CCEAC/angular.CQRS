angular.module('ngCQRS')

/**
 * @ngdoc object
 * @name ngCQRS.service:StoreService
 *
 * @description
 * Used to subscribe listeners to events and store view models in the client.
 */
  .service('StoreService', function StoreService($rootScope, $q, $filter, $timeout, CQRS) {

    var store = {}, denormalizerFunctions = {};

    /**
     * Returns undefined if no denormalization function is registered for a given viewModel/eventName pair.
     */
    function getDenormalizerFunction(viewModel, eventName) {
      if (angular.isUndefined(denormalizerFunctions[viewModel])) {
        return undefined;
      }
      return denormalizerFunctions[viewModel][eventName];
    }

    /**
     * Calls the registered denormalization function for a specific event (viewModel/eventName pair).
     * Returns the event payload if no denormalizer is registered.
     */
    function denormalize(originalData, event) {
      var denormalizerFunction = getDenormalizerFunction(event.viewModel, event.eventName);
      if (angular.isDefined(denormalizerFunction)) {
        return denormalizerFunction(originalData, event.payload);
      } else {
        return event.payload;
      }
    }

    function isValidDataModelUpdateEvent(evt) {
      return (angular.isDefined(evt.payload) && angular.isDefined(evt.eventName) && angular.isDefined(evt.viewModel));
    }

    function init() {
      // register for events and update our store with the new data
      CQRS.onEvent(function (evt) {
        if (isValidDataModelUpdateEvent(evt)) {
          var storeItem = store[evt.viewModel];
          if (angular.isDefined(storeItem)) {
            storeItem.data = denormalize(storeItem.data, evt);
            storeItem.callbacks.forEach(function (callback) {
              callback.callbackFunction(storeItem.data);
            });
            $rootScope.$apply();
          }
        }
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
     * Registering a denormalization function is optional. If no denormalizer is registered for a specifiv modelView and event combination, the event payload itself is passed to the {@link ngCQRS.service:Store#do do} callback.
     *
     * @param {string} viewModel The viewModel identifier
     * @param {string} eventName The event identifier
     * @param {function} denormalizerFunction The function used to merge (denormalized) event payload and original modelView data.
     *    Angular.CQRS will pass in the original modelView data and the event payload.
     *
     */
    function registerDenormalizerFunction(viewModel, eventName, denormalizerFunction) {
      if (angular.isUndefined(denormalizerFunctions[viewModel])) {
        denormalizerFunctions[viewModel] = {};
      }
      if (angular.isDefined(denormalizerFunctions[viewModel][eventName])) {
        throw 'Denormalizer function for viewModel "' + viewModel + '" and eventName "' + eventName + '" already defined.';
      }
      denormalizerFunctions[viewModel][eventName] = denormalizerFunction;
    }

    function throwErrorIfInvalidGetArguments(modelName, parameters, callback) {
      if (angular.isUndefined(parameters) || typeof parameters !== 'object') {
        throw 'Please provide a valid parameters object!';
      }
      if (angular.isUndefined(modelName) || typeof modelName !== 'string') {
        throw 'Please provide a valid model Name (string)!';
      }
      if (angular.isUndefined(callback) || typeof callback !== 'function') {
        throw 'Please provide a valid callback function!';
      }
    }

    function handleQueryResponse(result, modelName, callback, scopeId) {
      if (angular.isDefined(store[modelName])) {
        store[modelName].callbacks.push({callbackFunction: callback, scopeId: scopeId});
        store[modelName].data = result;
      } else {
        store[modelName] = {
          callbacks: [
            {
              callbackFunction: callback,
              scopeId: scopeId
            }
          ], data: result};
      }
      callback(result);
    }


    function removeCallbacksForScope(scope) {

      var orphanedStoreItems = [];

      angular.forEach(store, function (storeItem, modelView) {
        var cleanedCallbacks = $filter('filter')(storeItem.callbacks, function (callback) {
          return (callback.scopeId !== scope.$id);
        });
        if (cleanedCallbacks.length < 1) {
          orphanedStoreItems.push(modelView);
        } else {
          storeItem.callbacks = cleanedCallbacks;
        }
      });

      orphanedStoreItems.forEach(function (orphan) {
        store[orphan] = undefined;
      });
    }

    /**
     *  Queries the server for the required model. Will update given Scope on server events
     */
    function get(modelName, parameters, callback, scopeId) {
      throwErrorIfInvalidGetArguments(modelName, parameters, callback);
      var queryPromise = CQRS.query(modelName, parameters);
      queryPromise.then(function (result) {
        handleQueryResponse(result.data, modelName, callback, scopeId);
      });
    }

    /**
     * @ngdoc object
     * @name ngCQRS.service:Store
     *
     * @description
     *  The store allows for querying modelViews and registering for subsequent events on that modelView.
     */
    var StoreObject = function (scopeId) {

      /**
       * @ngdoc function
       * @name ngCQRS.service:Store#for
       * @methodOf ngCQRS.service:Store
       *
       * @description
       *  Specify the a modelView and optional url parameters
       *
       *  @param {string} modelView The identifier of the modelView
       *  @param {object} parameters An optional object containing url parameters. This will be passed toghether with the modelView identifier into your {@link ngCQRS.provider:CQRSProvider#setUrlFactory urlFactory} function.
       */
      this.for = function (modelView, parameters) {
        this.modelView = modelView;
        this.parameters = parameters || {};
        return this;
      };

      /**
       * @ngdoc function
       * @name ngCQRS.service:Store#do
       * @methodOf ngCQRS.service:Store
       *
       * @description
       *  register a handler for events on the specified modelView
       *
       *  @param {function} callback Function that is called on first query response and on subsequent events.
       *    Angular.CQRS will pass in the denormalized object (See {@link ngCQRS.provider:CQRSProvider#registerDenormalizerFunctions registerDenormalizerFunctions}).
       */
      this.do = function (callback) {
        get(this.modelView, this.parameters, callback, scopeId);
      };
    };

    /**
     * @ngdoc function
     * @name ngCQRS.service:StoreService#createForController
     * @methodOf ngCQRS.service:StoreService
     *
     * @description
     *  Returns a store
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
     *  Returns a store
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
