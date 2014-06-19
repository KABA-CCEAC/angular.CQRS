'use strict';

module.exports = function (grunt) {

   // Load grunt tasks automatically
   require('load-grunt-tasks')(grunt);

   // Time how long tasks take. Can help when optimizing build times
   require('time-grunt')(grunt);


   // Configurable paths
   var config = {
      src: 'src',
      dist: 'dist',
      test: 'test'
   };


   // Define the configuration for all the tasks
   grunt.initConfig({

         // Project settings
         config: config,


         // Watches files for changes and runs tasks based on the changed files
         watch: {

         },


         // The actual grunt server settings
         connect: {
            options: {
               port: 9000,
               open: true,
               livereload: 35729,
               // Change this to '0.0.0.0' to access the server from outside
               hostname: 'localhost'
            },
            test: {
               options: {
                  open: false,
                  port: 9001,
                  middleware: function (connect) {
                     return [
                        connect.static('.tmp'),
                        connect.static('test'),
                        connect().use('/bower_components', connect.static('./bower_components')),
                        connect.static(config.src)
                     ];
                  }
               }
            }
         },


         // js style and error checking
         eslint: {
            sourcefiles: {
               options: {
                  config: '.eslintrc',
                  rulesdir: ['eslintrules']
               },
               src: [
                  '<%= config.src %>/**/*.js',
                  '!<%= config.src %>/bower_components/**/*.js',
                  '!<%= config.src %>/module.js'
               ]
            },
            testfiles: {
               options: {
                  config: '.eslintrctest',
                  rulesdir: ['eslintrules']
               },
               src: [
                  '<%= config.test %>/**/*.js'
               ]
            }
         },


         // Mocha testing framework configuration options
         mocha: {
            all: {
               options: {
                  run: true,
                  urls: ['http://<%= connect.test.options.hostname %>:<%= connect.test.options.port %>/index.html']
               }
            }
         },

         // karma test runner
         karma: {
            unit: {
               configFile: 'karma.conf.js',
               singleRun: true,
               browsers: ['Chrome']
            }
         }
      }
   );


   grunt.registerTask('test', [
      'eslint:sourcefiles',
      'eslint:testfiles',
      'connect:test',
      'karma:unit'
   ]);

   grunt.registerTask('default', [
      'test'
   ]);

};
