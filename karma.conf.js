module.exports = function (config) {
  config.set({
    basePath: './',
    frameworks: ['mocha', 'expect'],

    files: [
      'src/bower_components/angular/angular.js',
      'src/bower_components/angular-mocks/angular-mocks.js',
      'src/cqrs/module.js',
      'src/cqrs/**/*.js',
      'test/testUtils/**/*.js',
      'test/**/*.js'
    ],

    exclude: [
      'karma.conf.js'
    ],

    preprocessors: {
      // source files, that you wanna generate coverage for
      // do not include tests or libraries
      // (these files will be instrumented by Istanbul)
      'src/cqrs/*.js': ['coverage']
    },

    logLevel: config.LOG_INFO,

    browsers: ['PhantomJS'],
    // web server port
    port: 8081,

    // cli runner port
    runnerPort: 9000,
    reporters: ['progress', 'coverage'],
    captureTimeout: 7000
  });
};