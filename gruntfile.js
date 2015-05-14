module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-include-source');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-typescript');
  grunt.loadNpmTasks('grunt-serve');

  grunt.initConfig({
    //Automatisch alle abhängigkeiten in die Index.html einfügen
    includeSource: {
      options: {
        basePath: 'app',
      },
      myTarget: {
        files: {
          'app/index.html': 'app/index.tpl.html',
          'app/elements.html': 'app/elements.tpl.html',
        }
      }
    },
    
    serve: {
        options: {
            port: 9000,
            'path': "app/"
        }
    },

    //Sass Dateien Kompilieren
    sass: {
      options:
      {
        style: 'expanded'
      },
      dist:
      {
        files: { 'app/css/main.css': 'app/sass/main.scss' }
      }
    },


    jshint:
    {
      all: ['app/**/*.js']
    },
    
    typescript: {
          base: {
            src: ['app/ts/*.ts'],
            dest: 'app/js/lib',
            options: {
              module: 'amd', //or commonjs 
              target: 'es5', //or es3 
              basePath: 'app/ts/',
              sourceMap: false,
              noEmitOnError: false,
              declaration: false
            }
          }
        },
    

    watch:
    {
      scripts:
      {
        files: ['**/*.js'],
        tasks: ['jshint', 'includeSource'],
        options: {
          spawn: false,
          livereload: true
        }
       },
       typeScripts:
        {
          files: ['**/*.ts'],
          tasks: ['typescript'],
          options: {
            spawn: false,
          },
        },

        sassStyles:
        {
          files: ['**/*.scss'],
          tasks: ['sass'],
          options: {
            spawn: false,
            livereload: false
            }
         },
         cssStyles:
         {
            files: ['**/*.css'],
            tasks: ['includeSource'],
            options: {
              spawn: false,
              livereload: true
            },

          },

        }
        



      });

  grunt.registerTask('default', ['typescript', 'sass:dist', 'includeSource']);
  grunt.registerTask('hint', ['jshint']);


};