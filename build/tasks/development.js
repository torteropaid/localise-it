module.exports = function(grunt) {
  
  var js_sources = [
    '<%= pkg.project.directories.src %>js/core.js',
    '<%= pkg.project.directories.src %>js/app.js',
    '<%= pkg.project.directories.src %>js/crypter.js',
    '<%= pkg.project.directories.src %>js/meta.json.js',
    '<%= pkg.project.directories.src %>js/lib/**/*.js',
    '<%= pkg.project.directories.src %>js/controller/**/*.js',
    '<%= pkg.project.directories.src %>js/view/**/*.js',
    '<%= pkg.project.directories.src %>js/script.js',
    '<%= pkg.project.directories.src %>js/content.js'
  ];

  grunt.config.merge({
    jshint: {
      development: {
        src: js_sources,
        options: {
          "-W083": true, // ignore dont make functions within loop
          "-W099": true, // Mixed spaces and tabs
          "-W014": true, // Bad line breaking before '||'
          "-W065": true, // Missing radix parameter (parseInt(value, radix = 10)),
          "-W069": true, // is better written in dot notation.
          "-W086": true, // switch statement
          "-W087": true, // debugger statement is fine
          laxbreak: true,
          debug: true
        }
      }
    },
    watch: {
      development: {
        files: [
          '<%= pkg.project.directories.src %>components/**/*',
          '<%= pkg.project.directories.src %>js/**/*',
          '<%= pkg.project.directories.src %>emil/src/**/*',
          '<%= pkg.project.directories.src %>*'          
        ],
        tasks: ['dev'],
        options: {
          spawn: true,
          interrupt: true,
          livereload: true
        }
      }
    },
    concat: {
      jsfiles: {
        src: js_sources,
        dest: '<%= pkg.project.directories.bin %>/js/app.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('default', '', ['dev', 'watch:development']);

  /*grunt.registerTask('development', '', [
    'jshint:development',
    'sudo_subcomponents:build',
    'newer:jade:components',
    'newer:jade:index',
    'less:compile',
    'newer:uglify:vendor',
    //'newer:uglify:app',
    'concat:jsfiles',
    'newer:replace:insert_rsa_key',
    'newer:uglify:templates',
    'newer:copy:fonts',
    'newer:copy:decryptor',
    'newer:copy:urf',
    'newer:copy:php',
    'newer:copy:img',
  ]);*/

  grunt.registerTask('dev', '', [
      'clean:build',
      'jade:components',
      'less:compile',
      'uglify:vendor',
      //'uglify:app',
      'concat:jsfiles',
      'uglify:templates',
      'copy:fonts',
      'copy:img',
      'copy:flags',
      'copy:index',
      'shell:notification'
  ]);

  //grunt.registerTask('dev', '', ['build']);

  //grunt.registerTask('dev',['development']);


};
