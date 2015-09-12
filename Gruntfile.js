module.exports = function(grunt) {
  var js_sources = [
    '<%= pkg.project.directories.src %>js/core.js',
    '<%= pkg.project.directories.src %>js/app.js',
    '<%= pkg.project.directories.src %>js/lib/**/*.js',
    '<%= pkg.project.directories.src %>js/controller/**/*.js',
    '<%= pkg.project.directories.src %>js/view/**/*.js'
  ];

  var vendor_sources = [
    '<%= pkg.project.directories.vendor %>jquery/dist/jquery.js',
    '<%= pkg.project.directories.vendor %>lodash/dist/lodash.js',
    '<%= pkg.project.directories.vendor %>jade/runtime.js',
    '<%= pkg.project.directories.vendor %>jquery-ui/jquery-ui.js'
  ];
  
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    
    clean: {
        build: ['<%= pkg.project.directories.bin %>']
    },
    
    sudo_subcomponents: {
      build: {
        options: {
          cmd: 'grunt',
          args: ['build']
          // default option for components is pkg.project.components
        }
      }
    },

    jade: {
      components: {
        options: {
          compileDebug: false,
          client: true,
          data: {
            debug: false
          }
        },
        files: {
          '<%= pkg.project.directories.bin %>js/templates.js': [
            '<%= pkg.project.directories.src %>emil/bin/src/emil.jade',
            '<%= pkg.project.directories.src %>components/**/*.jade'
          ]
        }
      }
    },
    
    less: {
      compile: {
        files: {
          '<%= pkg.project.directories.bin %>css/app.css' : [
            '<%= pkg.project.directories.src %>components/app.less'
          ]
        }
      }
    },

    // copy/uglify js files + uglify templates output
    uglify: {
      vendor: {
        options: {
          mangle: false,
          preserveComments: false
        },
        src: vendor_sources,
        dest: '<%= pkg.project.directories.bin %>/js/vendor.js'
      },
      app: {
        src: js_sources,
        dest: '<%= pkg.project.directories.bin %>/js/app.js'
      },
      templates: {
        src: ['<%= pkg.project.directories.bin %>/js/templates.js'],
        dest: '<%= pkg.project.directories.bin %>/js/templates.js'
      }
    },

    copy: {
      fonts: {
        files: [{
          expand: true,
          cwd: '<%= pkg.project.directories.src %>',
          src: ['font/*'],
          dest: '<%= pkg.project.directories.bin %>css/'
        }]
      },
      img: {
        files: [{
          expand: true,
          cwd: '<%= pkg.project.directories.src %>',
          src: ['img/*, img/**/*'],
          dest: '<%= pkg.project.directories.bin %>'
        }] 
      },
      flags: {
        files: [{
          expand: true,
          cwd: '<%= pkg.project.directories.src %>',
          src: ['img/**/*'],
          dest: '<%= pkg.project.directories.bin %>'
        }] 
      }
    },
    shell: {
      notification: {
        command: 'sh notification.sh',
        options: {
            stderr: false,
            execOptions: {
                cwd: 'build/tasks'
            }
        }
      }
    }
  });

  // auto-loading
  require('load-grunt-tasks')(grunt, {
    pattern: ['grunt-*'],
    config: 'package.json',
    scope: ['devDependencies', 'dependencies']
  });


  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-shell');

  grunt.registerTask('build', '', [
      'clean:build',
      'jade:components',
      'less:compile',
      'uglify:vendor',
      'uglify:app',
      'uglify:templates',
      'copy:fonts',
      'copy:img',
      'copy:flags'
  ]);

  grunt.loadTasks(grunt.config('pkg.project.directories.build-tasks'));
};