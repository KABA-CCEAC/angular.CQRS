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
    var denormalizerFunctions = {};

    var urlFactory = function () {
        throw 'Please specify a urlFactory for CQRS queries. CQRSProvider.setUrlFactory(function (dataId) { .... }';
      };


      this.setUrlFactory = function (urlFactoryFunction) {
         urlFactory = urlFactoryFunction;
      };

      /**
       * @ngdoc object
       * @name ngCQRS.provider:CQRSProvider#registerDenormalizerFunctions
       * @methodOf ngCQRS.provider:CQRSProvider
       * @kind function
       *
       * @description
       * Can be used to register a denormalization function for incoming events. Can be used to merge the change delta into the existing dataset on the client.
       */
      this.registerDenormalizerFunctions = function (viewModel, eventName, denormalizerFunction) {
        if(angular.isUndefined(denormalizerFunctions[viewModel])){
          denormalizerFunctions[viewModel] = {};
        }
        if(angular.isDefined(denormalizerFunctions[viewModel][eventName])){
          throw 'Denormalizer function for viewModel "' + viewModel + '" and eventName "' + eventName + '" already defined.';
        }
        denormalizerFunctions[viewModel][eventName] = denormalizerFunction;
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
         function sendCommand(command) {
            $rootScope.$emit('CQRS:commands', command);
         }

        function denormalizerFunctionExists(viewModel, eventName){
          return angular.isDefined(denormalizerFunctions[viewModel]) && angular.isDefined(denormalizerFunctions[viewModel][eventName]);
        }

        /**
         * @ngdoc function
         * @name ngCQRS.service:CQRS#denormalize
         * @methodOf ngCQRS.service:CQRS
         *
         * @description
         *
         */
        function denormalize(event, originalData, delta) {
          if(denormalizerFunctionExists(event.viewModel,event.eventName)){
            var denormalizerFunction = denormalizerFunctions[event.viewModel][event.eventName];
            return denormalizerFunction(originalData, delta);
          } else {
            return delta;
          }
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
            $rootScope.$on('CQRS:events', function (angularEvent, data) {
               listener(data);
            });
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
            $rootScope.$on('CQRS:commands', function (angularEvent, data) {
               listener(data);
            });
         }


         return {
            query: query,
            sendCommand: sendCommand,
            onEvent: onEvent,
            onCommand: onCommand,
            eventReceived: eventReceived,
            denormalize: denormalize
         };
      };

   });