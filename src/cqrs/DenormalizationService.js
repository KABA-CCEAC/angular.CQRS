angular.module('ngCQRS')

/**
 * @ngdoc object
 * @name ngCQRS.service:DenormalizationService
 *
 * @description
 * Used to configure denormalizers.
 */
  .service('DenormalizationService', function DenormalizationService(){
    var denormalizerFunctions = {};

    /**
     * @ngdoc object
     * @name ngCQRS.service:DenormalizationService#getDenormalizerFunctions
     * @methodOf ngCQRS.service:DenormalizationService
     * @kind function
     *
     * @description
     * Returns the denormalization functions for the specified aggregateType/eventName pair.
     *
     * @param {string} aggregateType The aggregate type
     * @param {string} eventName The event name
     */
    function getDenormalizerFunctions(aggregateType, eventName) {
      if (angular.isUndefined(denormalizerFunctions[aggregateType])) {
        return {};
      }
      if (angular.isUndefined(denormalizerFunctions[aggregateType][eventName])) {
        return {};
      }
      return denormalizerFunctions[aggregateType][eventName];
    }

    /**
     * @ngdoc object
     * @name ngCQRS.service:DenormalizationService#registerDenormalizerFunction
     * @methodOf ngCQRS.service:DenormalizationService
     * @kind function
     *
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

    return {
      getDenormalizerFunctions:getDenormalizerFunctions,
      registerDenormalizerFunction:registerDenormalizerFunction
    };
});
