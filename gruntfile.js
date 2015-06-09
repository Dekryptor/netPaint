module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-include-source');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-typescript');
  grunt.loadNpmTasks('grunt-serve');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.initConfig({
    
    concat: {
    basic: {
      src: ['components/DrawComponent/draw.html','components/MenuBar/menu.html','components/NetworkHandler/network.html', 'components/Flyout/flyout.html'],
      dest: 'components/compiled.html'
    }},
    
    
    serve: {
        options: {
            port: 9000,
            'path': "/"
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
        files: { 'css/main.css': 'sass/main.scss' }
      }
    },

    watch:
    {
      scripts:
      {
        files: ['**/*.js'],
        tasks: [],
        options: {
          spawn: false,
          livereload: true
        }
       },
       

        sassStyles:
        {
          files: ['**/*.scss'],
          tasks: ['sass'],
          options: {
            spawn: false,
            livereload: true
            }
         },
         
        }
        



      });

  grunt.registerTask('default', ['concat','sass:dist']);
  grunt.registerTask('hint', ['jshint']);


};