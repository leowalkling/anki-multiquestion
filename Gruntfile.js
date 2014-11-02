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
		},
		requirejs: {
			compile: {
				options: {
					baseUrl: "src/",
					mainConfigFile: "main-config.js",
					out: "randomquestions-bundle.js",
					name: '../main', 
					optimize: 'none'
				}
			}
		}
    });
	
	grunt.loadNpmTasks('grunt-karma');
	grunt.loadNpmTasks('grunt-bower-requirejs');
	grunt.loadNpmTasks('grunt-requirejs');
	
	grunt.registerTask('default', ['karma']);
};
