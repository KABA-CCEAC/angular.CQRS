module.exports = function (config) {
   config.set({
      basePath: './',
      frameworks: ['mocha', 'expect'],

      files: [
         'src/bower_components/angular/angular.js',
         'src/bower_components/angular-mocks/angular-mocks.js',
         'test/**/*.js'
      ],
      exclude: [
         'karma.conf.js'
      ],
      logLevel: config.LOG_INFO,
      browsers: ['PhantomJS'],
      // web server port
      port: 8081,

      // cli runner port
      runnerPort: 9000,
      reporters: ['progress'],
      captureTimeout: 7000
   });
};