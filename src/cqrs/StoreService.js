angular.module('ngCQRS')

/**
 * @ngdoc service
 * @name ngCQRS.service:StoreService
 *
 * @description
 * Used to obtain a {@link ngCQRS.service:Store Store} instance.
 */
  .service('StoreService', function StoreService($rootScope, $q, $filter, $timeout, CQRS, DenormalizationService) {

    var scopeCallbacks = {};

    function isValidDataModelUpdateEvent(evt) {
      return (angular.isDefined(evt.payload) && angular.isDefined(evt.name));
    }

    function onEventHandler(evt) {
      if (!isValidDataModelUpdateEvent(evt)) {
        return;
      }

      var denormalizerFunctions = DenormalizationService.getDenormalizerFunctions(evt.name, evt.aggregateType);
      angular.forEach(denormalizerFunctions, function (denormalizerFunction, viewModelName) {
        var scopeCallback = scopeCallbacks[viewModelName];
        if (angular.isDefined(scopeCallback)) {
          // invoke denormalizer function
          scopeCallback.data = denormalizerFunction(scopeCallback.data, evt);

          // invoke all handler callbacks (in controllers and services) with the denormalized data
          scopeCallback.callbacks.forEach(function (callback) {
            callback.callbackFunction(scopeCallback.data);
          });
        }
      });
      $rootScope.$apply();
    }

    // register for events and update our store with the new data
    CQRS.onEvent(onEventHandler);

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

    function handleQueryResponseError(error, errorCallback) {
      errorCallback(error.data, error.status);
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
        delete scopeCallbacks[orphan];
      });
    }

    /**
     *  Queries the server for the required model. Will update given Scope on server events
     */
    function get(viewModelName, parameters, callback, errorCallback, scopeId) {
      throwErrorIfInvalidGetArguments(viewModelName, parameters, callback);
      var queryPromise = CQRS.query(viewModelName, parameters);
      queryPromise.then(function (data) {
        handleQueryResponse(data, viewModelName, callback, scopeId);
      }, function (error) {
        handleQueryResponseError(error, errorCallback);
      });
    }

    /**
     * @ngdoc service
     * @kind function
     * @name ngCQRS.service:Store
     *
     * @description
     *  The store allows for querying modelViews and registering for subsequent events on that viewModelName.
     *
     *  ### Usage
     *  In your angular controller, you can query a viewModel and keep getting updates on events:
     *
     *  ```javascript
     * var store = StoreService.createForController($scope);
     *
     * store.for('profile').do(function (personDetails) {
     *   $scope.personDetails = personDetails;
     * });
     *  ```
     *
     *  Make sure to register an appropriate denormalizer function (see {@link ngCQRS.service:DenormalizationService DenormalizationService})
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
       *  @param {object} parameters An optional object containing url parameters. This will be passed together with the viewModelName identifier into your {@link ngCQRS.provider:CQRSProvider#setUrlFactory urlFactory} function.
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
       *    Angular.CQRS will pass in the denormalized object (See {@link ngCQRS.service:DenormalizationService#registerDenormalizerFunction registerDenormalizerFunction}).
       *
       *  @param {function} errorCallback Function that is called on a http error during the first query request.
       *    Angular.CQRS will pass in the received data and the http status code.
       */
      this.do = function (callback, errorCallback) {
        get(this.viewModelName, this.parameters, callback, errorCallback, scopeId);
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
      createForService: createForService
    };

  });
