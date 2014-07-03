/**
 * Outputs all REST requests/responses on the karma console.
 */
var IntegrationRestLogger = {

  disabled: false,
  options: {
    logRequests: true,
    logResponses: true,
    logHeaders: true
  },

  disable: function () {
    this.disabled = true;
  },

  output: function (data) {
    if (this.disabled === true) {
      return;
    }

    if (this.options.logRequests === true) {
      if (data.config.params) {
        dump('-->', data.config.method, data.config.url, data.config.params);
      } else {
        dump('-->', data.config.method, data.config.url);
      }
      if (this.options.logHeaders) {
        dump('   ' + angular.toJson(data.config.headers));
      }
    }

    if (this.options.logResponses === true) {
      dump('<--', data.status, angular.toJson(data.data));
    }
  },

  /**
   * @param {object} angularModule The angular moduleName
   * @param {boolean} doLogRequest Set to true if you want to log the requests
   * @param {boolean} doLogResponse Set to true if you want to log the responses
   */
  setup: function (options) {
    this.disabled = false;
    if (angular.isDefined(options)) {
      this.options = options;
    }

    var that = this;


    var defaultHeaders = {
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'text/html,application/json'
    };

    angular.module('integrationtest')
      .config(function ($httpProvider) {
        var interceptor = function ($q) {
          function success(data) {
            that.output(data);
            return data;
          }

          function error(data) {
            that.output(data);
            return $q.reject(data);
          }

          return function (promise) {
            return promise.then(success, error);
          };

        };
        $httpProvider.responseInterceptors.push(interceptor);
        angular.extend($httpProvider.defaults.headers.common, defaultHeaders);
        $httpProvider.defaults.withCredentials = true;
      });
  }

};
