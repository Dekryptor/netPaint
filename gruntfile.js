module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-include-source');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-typescript');
  grunt.loadNpmTasks('grunt-serve');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.initConfig({
    //Automatisch alle abhängigkeiten in die Index.html einfügen
    includeSource: {
      options: {
        basePath: 'app',
      },
      myTarget: {
        files: {
          'app/index.html': 'src/index.tpl.html'
         
        }
      }
    },
    
    concat: {
    basic: {
      src: ['src/components/room.html','src/components/menu.html','src/components/network.html', 'src/components/flyout.html'],
      dest: 'app/components-compiled.html'
    }},
    
    
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
        files: { 'app/css/main.css': 'src/sass/main.scss' }
      }
    },


    jshint:
    {
      all: ['app/**/*.js']
    },
    
    typescript: {
          base: {
            src: ['src/ts/*.ts'],
            dest: 'app/js/lib',
            options: {
              module: 'amd', //or commonjs 
              target: 'es5', //or es3 
              basePath: 'src/ts/',
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

  grunt.registerTask('default', ['typescript', 'concat','sass:dist', 'includeSource']);
  grunt.registerTask('hint', ['jshint']);


};