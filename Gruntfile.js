module.exports = function (grunt) {
	grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
		bower: {
			target: {
				rjsConfig: './config.js'
			},
			all: {
				options: {
					baseUrl: 'src'
				}
			}
		}
    });
	
	grunt.loadNpmTasks('grunt-karma');
	grunt.loadNpmTasks('grunt-bower-requirejs');
	grunt.loadNpmTasks('grunt-browserify');
	
	grunt.registerTask('default', ['karma']);
};
