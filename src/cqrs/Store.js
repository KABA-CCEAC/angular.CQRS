angular.module('ngCQRS')

/**
 * @ngdoc object
 * @name ngCQRS.service:Store
 *
 * @description
 *
 */
   .service('Store', function Store($rootScope, $q, CQRS) {

      var store = {};

      function isValidDataModelUpdateEvent(evt) {
         return ( angular.isDefined(evt.payload) && angular.isDefined(evt.payload.id));
      }

      function init() {
         // register for events and update our store with the new data
         CQRS.onEvent(function (evt) {
            if (isValidDataModelUpdateEvent(evt)) {
               store[evt.payload.id] = evt.payload;
            }
         });
      }

      init();

      /**
       * @ngdoc function
       * @name ngCQRS.service:Store#get
       * @methodOf ngCQRS.service:Store
       *
       * @description
       *  Queries the server and returns a reference to the data that will be automatically updated on future events.
       */
      function get(modelName) {
         // TODO:  should the server be queried every time ?
         // or should this method return a reference to the data that is already in the store (matching the given modelName)

         var deferred = $q.defer();
         var queryPromise = CQRS.query(modelName);
         queryPromise.then(function (result) {
            store[modelName] = result;
            deferred.resolve(store[modelName]);
         });
         return deferred.promise;
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