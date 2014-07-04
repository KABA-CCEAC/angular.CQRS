angular.module('ngCQRS')

/**
 * @ngdoc service
 * @name ngCQRS.service:DenormalizationService
 *
 * @description
 * Used to configure denormalizers.
 *
 * ### Usage
 *
 *  ```javascript
DenormalizationService.registerDenormalizerFunction({
  viewModelName: 'profile',
  eventName: 'profileChanged'
}, function (oldData, payload) {
  return angular.extend(oldData, payload);
});
 *  ```
 *
 */
  .service('DenormalizationService', function DenormalizationService() {
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
     * @param {string} eventName The event name
     * @param {string} aggregateType The aggregate type
     */
    function getDenormalizerFunctions(eventName, aggregateType) {
      if (angular.isUndefined(aggregateType)) {
        aggregateType = '_common';
      }
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
     * @kind function
     * @name ngCQRS.service:DenormalizationService#registerDenormalizerFunction
     * @methodOf ngCQRS.service:DenormalizationService
     *
     *
     * @description
     * Is used to register a denormalization function for incoming events. Can be used to merge the change delta into the existing dataset on the client.
     * You must register a denormalization function for every viewModel + eventName combination (aggregateType is optional) you want to handle.
     *
     * @param {object} config A configuration object that can contain:
     *
     *    Object properties:
     *
     *    - `viewModelName` – `{string}` – The name of the viewModel
     *    - `eventName` - `{string}` - The name of the event
     *    - `aggregateType` – `{string}` – An optional name of a aggregate type
     *
     * @param {function} denormalizerFunction The function used to merge (denormalized) event payload and original viewModelName data.
     *    Angular.CQRS will pass in the original viewModelName data and the event payload.
     *
     */
    function registerDenormalizerFunction(config, denormalizerFunction) {
      if (angular.isUndefined(config.aggregateType)) {
        // this is allowed. store all denormalizers without a specific aggregateType under '_common'
        config.aggregateType = '_common';
      }
      if (angular.isUndefined(denormalizerFunctions[config.aggregateType])) {
        denormalizerFunctions[config.aggregateType] = {};
      }
      if (angular.isUndefined(denormalizerFunctions[config.aggregateType][config.eventName])) {
        denormalizerFunctions[config.aggregateType][config.eventName] = {};
      }
      if (angular.isDefined(denormalizerFunctions[config.aggregateType][config.eventName][config.viewModelName])) {
        throw 'Denormalizer function for viewModelName "' + config.viewModelName + '", aggregateType: "' + config.aggregateType + '" and eventName "' + config.eventName + '" already defined.';
      }
      denormalizerFunctions[config.aggregateType][config.eventName][config.viewModelName] = denormalizerFunction;
    }

    return {
      getDenormalizerFunctions: getDenormalizerFunctions,
      registerDenormalizerFunction: registerDenormalizerFunction
    };
  });
