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

  setup: function (options, configCallback) {

    this.ensureDumpFunction();

    // creating test module ntegrationtest with dependency to our CQRS code
    var testModule = angular.module('integrationtest', ['ngCQRS']);

    if (angular.isDefined(configCallback)) {
      testModule.config(configCallback);
    }


    // Creating injector for ng and jet.integrationtest
    this.inj = angular.injector(['ng', 'integrationtest']);
  },

  getCollaborator: function (collaboratorName) {
    return this.inj.get(collaboratorName);
  },

  expectArrayContains: function (value, array) {
    var found = this.getCollaborator('$filter')('filter')(array, value, true);
    expect(found.length).toBeGreaterThan(0);
  }


};
