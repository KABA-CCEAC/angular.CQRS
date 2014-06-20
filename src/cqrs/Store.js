angular.module('ngCQRS')

/**
 * @ngdoc object
 * @name ngCQRS.service:Store
 *
 * @description
 *
 */
   .service('Store', function Store($rootScope, $q, CQRS) {

      var store = { };

      CQRS.onEvent(function (evt) {
         if (angular.isDefined(evt.payload) && angular.isDefined(evt.payload.id)) {
            store[evt.payload.id] = evt.payload;
         }
      });

      /**
       * @ngdoc function
       * @name ngCQRS.service:Store#get
       * @methodOf ngCQRS.service:Store
       *
       * @description
       *  queries the server for data
       */
      function get(dataId) {
         var deferred = $q.defer();
         var queryPromise = CQRS.query(dataId);
         queryPromise.then(function (result) {
            store[dataId] = result;
            deferred.resolve(store[dataId]);
         });
         return deferred.promise;
      }

      var serviceInstance = {
         get: get
      };

      return serviceInstance;

   });