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

         /**
          * @ngdoc function
          * @name ngCQRS.service:CQRS#sendCommand
          * @methodOf ngCQRS.service:CQRS
          *
          * @description
          *
          */
         function sendCommand(commandName, payload) {
            $rootScope.$emit('CQRS:commands', {
               command: commandName,
               payload: payload
            });
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
            $rootScope.$on('CQRS:events', listener);
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
            $rootScope.$on('CQRS:commands', listener);
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