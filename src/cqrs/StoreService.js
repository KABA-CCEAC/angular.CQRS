angular.module('ngCQRS')

/**
 * @ngdoc object
 * @name ngCQRS.service:StoreService
 *
 * @description
 * Used to subscribe listeners to events and store ("cache") view models in the client.
 */
  .service('StoreService', function StoreService($rootScope, $q, $filter, $timeout, CQRS) {

    var store = {};

    function isValidDataModelUpdateEvent(evt) {
      return (angular.isDefined(evt.payload) && angular.isDefined(evt.eventName) && angular.isDefined(evt.viewModel));
    }

    function init() {
      // register for events and update our store with the new data
      CQRS.onEvent(function (evt) {
        if (isValidDataModelUpdateEvent(evt)) {
          var storeItem = store[evt.viewModel];
          if (angular.isDefined(storeItem)) {
            storeItem.data = CQRS.denormalize(evt, storeItem.data, evt.payload);
            storeItem.callbacks.forEach(function (callback) {
              callback.callbackFunction(storeItem.data);
            });
            $rootScope.$apply();
          }
        }
      });
    }

    init();

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

    /**
     * @ngdoc function
     * @name ngCQRS.service:StoreService#get
     * @methodOf ngCQRS.service:StoreService
     *
     * @description
     *  Queries the server for the required model. Will update given Scope on server events
     */
    function get(modelName, parameters, callback, scopeId) {
      throwErrorIfInvalidGetArguments(modelName, parameters, callback);

      // TODO:  should the server be queried every time ?
      // or should this method return a reference to the data that is already in the store (matching the given modelName)

      var queryPromise = CQRS.query(modelName, parameters);
      queryPromise.then(function (result) {
        handleQueryResponse(result.data, modelName, callback, scopeId);
      });
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

    function createForController($scope) {
      $scope.$on('$destroy', function (evt) {
        removeCallbacksForScope(evt.currentScope);
      });

      return {
        for: function (modelView, parameters) {
          this.modelView = modelView;
          this.parameters = parameters || {};
          return this;
        },
        do: function (callback) {
          get(this.modelView, this.parameters, callback, $scope.$id);
        }
      };

    }

    function createForService() {
      return {
        for: function (modelView, parameters) {
          this.modelView = modelView;
          this.parameters = parameters || {};
          return this;
        },
        do: function (callback) {
          get(this.modelView, this.parameters, callback, undefined);
        }
      };

    }


    return {
      createForController: createForController,
      createForService: createForService
    };

  });
