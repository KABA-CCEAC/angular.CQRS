angular.module('ngCQRS')

/**
 * @ngdoc object
 * @name ngCQRS.provider:CQRSProvider
 * @kind function
 *
 * @description
 * blubb
 */
   .provider('CQRS', function CQRS() {

      var urlFactory = function () {
         throw 'Please specify a urlFactory for CQRS queries. CQRSProvider.setUrlFactory(function (dataId) { .... }';
      };

      this.setUrlFactory = function (urlFactoryFunction) {
         urlFactory = urlFactoryFunction;
      };

      /**
       * @ngdoc service
       * @kind function
       * @name ngCQRS.service:CQRS
       *
       * @description
       *   blah
       */
      this.$get = function ($q, $rootScope, $http) {

         /**
          * @ngdoc function
          * @name ngCQRS.service:CQRS#query
          * @methodOf ngCQRS.service:CQRS
          *
          * @description
          * Send a HTTP GET request to the backend.
          * Use specified 'urlFactory' function to build URL.
          * Note: generally you should use Store#get()
          *
          */
         function query(dataId) {
            var deferred = $q.defer();
            $http.get(urlFactory(dataId)).
               success(function (data) {
                  deferred.resolve(data);
               }).
               error(function (data) {
                  deferred.reject(data);
               });
            return deferred.promise;
         }

         function onEvent(listener) {
            $rootScope.$on('CQRS:events', listener);
         }

         function onCommand(listener) {
            $rootScope.$on('CQRS:commands', listener);
         }

         function eventReceived(data) {
            $rootScope.$emit('CQRS:events', data);
         }

         return {
            query: query,
            onEvent: onEvent,
            onCommand: onCommand,
            eventReceived: eventReceived
         };
      };

   });