angular.module('ngCQRS')

/**
 * @ngdoc object
 * @name ngCQRS.service:Store
 *
 * @description
 * Used to subscribe listeners to events and store ("cache") view models in the client.
 */
  .service('Store', function Store($rootScope, $q, $timeout, CQRS) {

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
              callback(storeItem.data);
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

    function handleQueryResponse(result, modelName, callback) {
      if (angular.isDefined(store[modelName])) {
        store[modelName].callbacks.push(callback);
        store[modelName].data = result;
      } else {
        store[modelName] = { callbacks: [callback], data: result};
      }
      callback(result);
    }

    /**
     * @ngdoc function
     * @name ngCQRS.service:Store#get
     * @methodOf ngCQRS.service:Store
     *
     * @description
     *  Queries the server for the required model. Will update given Scope on server events
     */
    function get(modelName, parameters, callback) {
      throwErrorIfInvalidGetArguments(modelName, parameters, callback);

      // TODO:  should the server be queried every time ?
      // or should this method return a reference to the data that is already in the store (matching the given modelName)

      var queryPromise = CQRS.query(modelName, parameters);
      queryPromise.then(function (result) {
        handleQueryResponse(result.data, modelName, callback);
      });
    }


    /**
     * @ngdoc function
     * @name ngCQRS.service:Store#clear
     * @methodOf ngCQRS.service:Store
     *
     * @description
     *  clears the store
     */
    function clear() {
      store = {};
    }

    return {
      get: get,
      clear: clear
    };

  });