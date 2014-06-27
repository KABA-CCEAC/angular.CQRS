module.exports = function (config) {
  config.set({
    basePath: './',
    frameworks: ['mocha', 'expect'],

    files: [
      'src/bower_components/angular/angular.js',
      'node_modules/socket.io/node_modules/socket.io-client/socket.io.js',
      'src/cqrs/module.js',
      'src/cqrs/**/*.js',
      'test/integration/**/*.js'
    ],

    exclude: [
      'karma.conf.js',
      'karma-integration.conf.js'
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
