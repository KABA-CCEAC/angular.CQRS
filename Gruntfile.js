'use strict';

module.exports = function (grunt) {

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  var pkg = require('./package.json');

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

      meta: {
        name: pkg.name,
        author: pkg.author,
        version: pkg.version,
        banner: '// <%= meta.name %>, v<%= meta.version %>\n' +
          '// Copyright (c)<%= grunt.template.today("yyyy") %> <%= meta.author %>.\n\n'
      },

      // delete files in folders
      clean: {
        dist: {
          files: [
            {
              dot: true,
              src: [
                '.tmp',
                '<%= config.dist %>/*',
                '!<%= config.dist %>/.git*'
              ]
            }
          ]
        }
      },

      // concatenate source files to one
      concat: {
        dist: {
          files: {
            '<%= config.dist %>/angular-cqrs.js': [
              '<%= config.src %>/{,*/}module.js',
              '<%= config.src %>/{,*/}*.js',
              '.tmp/{,*/}*.js'
            ]
          }
        }
      },

      //minifies js source files
      ngmin: {
        dist: {
          files: [
            {
              expand: true,
              cwd: '<%= config.dist %>',
              src: '*.js',
              dest: '<%= config.dist %>',
              ext: '.min.js'
            }
          ]
        }
      },

      //obfuscates minified js source files
      uglify: {
        options: {
          beautify: false,
          mangle: true,
          banner: '<%= meta.banner %>'
        },
        dist: {
          files: [
            {
              expand: true,
              cwd: '<%= config.dist %>',
              src: '*.min.js',
              dest: '<%= config.dist %>',
              ext: '.min.js'
            }
          ]
        }
      },

      // Watches files for changes and runs tasks based on the changed files
      watch: {
        jstest: {
          files: ['test/{,*/}*.js'],
          tasks: ['test:watch']
        }
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

      // generate api documentation with ngdocs
      ngdocs: {
        options: {
          dest: 'docs',
          html5Mode: false,
          startPage: '/api',
          title: 'Angular.CQRS Documentation',
          animation: true,
          styles: ['docs/css/docuStyle.css']
        },
        api: {
          src: [
            'src/cqrs/**/*.js',
            'src/cqrs/*.js'
          ],
          title: 'API Reference'
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
            '!<%= config.src %>/**/module.js'
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

      // checks for newline at end of file
      lintspaces: {
        all: {
          src: [
            '**/*',
            '!coverage/**/*',
            '!docs/**/*',
            '!node_modules/**/*',
            '!<%= config.src %>/bower_components/**/*',
            '!<%= config.dist %>/**/*'
          ],
          options: {
            newline: true
          }
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
          singleRun: true
        },
        unitwatch: {
          configFile: 'karma.conf.js',
          singleRun: false,
          autoWatch: true
        }
      }
    }
  );


  grunt.registerTask('docu', [
    'ngdocs'
  ]);

  grunt.registerTask('test', [
    'eslint:sourcefiles',
    'eslint:testfiles',
    'lintspaces',
    'connect:test',
    'karma:unit'
  ]);

  grunt.registerTask('testwatch', [
    'eslint:sourcefiles',
    'eslint:testfiles',
    'lintspaces',
    'connect:test',
    'karma:unitwatch'
  ]);

  grunt.registerTask('build', [
    'clean:dist',
    'test',
    'docu',
    'concat:dist',
    'ngmin',
    'uglify'
  ]);

  grunt.registerTask('default', [
    'build'
  ]);

};
