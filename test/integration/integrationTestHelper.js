/**
 * helps setting up integration tests against a CQRS based backend
 */
var IntegrationTestHelper = {

  inj: undefined,

  /**
   * when running karma tests from within webstorm, we do not have a global 'dump' function
   */
  ensureDumpFunction: function () {
    if (angular.isUndefined(window.dump)) {
      window.dump = function () {
        console.log.apply(window.console, arguments);
      };
    }
  },

  setup: function (moduleConfigCallbackFunction) {

    this.ensureDumpFunction();

    // creating test module integrationtest with dependency to our CQRS code
    this.module = angular.module('integrationtest', ['ngCQRS']);

    if (angular.isDefined(moduleConfigCallbackFunction)) {
      this.module.config(moduleConfigCallbackFunction);
    }

    this.inj = angular.injector(['ng', 'integrationtest']);
  },


  /**
   * will return a angular component (services, factories) for the given name.
   * Note: you cannot get Providers this way. Use IntegrationTestHelper.setup(function(MyProvider){...});  instead.
   */
  getCollaborator: function (collaboratorName) {
    return this.inj.get(collaboratorName);
  }

};
