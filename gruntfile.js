module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-include-source');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.initConfig({
    //Automatisch alle abhängigkeiten in die Index.html einfügen
    includeSource: {
      options: {
        basePath: 'app',
      },
      myTarget: {
        files: {
          'app/index.html': 'app/index.tpl.html'
        }
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


    watch:
    {
      scripts:
      {
        files: ['**/*.js'],
        tasks: ['jshint', 'includeSource'],
        options: {
          spawn: false,
        },
      },

      styles:
      {
        files: ['**/*.scss'],
        tasks: ['sass'],
        options: {
          spawn: false,
        },
      },

    }



  });

  grunt.registerTask('default', ['sass:dist', 'includeSource']);
  grunt.registerTask('hint', ['jshint']);



};