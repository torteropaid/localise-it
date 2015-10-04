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
    '<%= pkg.project.directories.vendor %>jquery-ui/jquery-ui.js',
    '<%= pkg.project.directories.vendor %>jquery.ui.touch-punch/jquery.ui.touch-punch.min.js',
    '<%= pkg.project.directories.vendor %>fuse.min.js',
    '<%= pkg.project.directories.vendor %>clusterize/clusterize.min.js'
  ];

  grunt.config.merge({
    
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
            '<%= pkg.project.directories.src %>src/emil/bin/src/emil.jade',
            '<%= pkg.project.directories.src %>components/**/*.jade'
          ]
        }
      },
      index: {
        files: {
          '<%= pkg.project.directories.bin %>index.html':
            '<%= pkg.project.directories.src %>index.jade'
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
          mangle: false
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
          src: ['font/**/*'],
          dest: '<%= pkg.project.directories.bin %>css/'
        }]
      },
      img: {
        files: [{
          expand: true,
          cwd: '<%= pkg.project.directories.src %>',
          src: ['img/*'],
          dest: '<%= pkg.project.directories.bin %>'
        }] 
      },
      index: {
        files: [{
          expand: true,
          cwd: '<%= pkg.project.directories.src %>',
          src: ['index.html'],
          dest: '<%= pkg.project.directories.bin %>'
        }] 
      }
    }

  });

  grunt.registerTask('build_old', '', [
      'clean:build',
      'sudo_subcomponents:build',
      'jade:components',
      'jade:index',
      'less:compile',
      'uglify:vendor',
      'uglify:app',
      'uglify:templates',
      'copy:fonts',
      'copy:img',
      'copy:index'
  ]);

};
