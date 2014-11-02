// Karma configuration
// Generated on Thu Oct 02 2014 19:47:09 GMT+0200 (W. Europe Daylight Time)

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['mocha', 'requirejs', 'sinon-chai'],
    files: [
		{pattern: 'src/**/*.js', included: false},
		{pattern: 'test/**/*-test.js', included: false},
		{pattern: 'lib/**/*.js', included: false},
		'test-main.js',
		{pattern: 'bower-paths.js', included: false}
    ],
    exclude: [
    ],
    preprocessors: {
    },
    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: [],
    singleRun: false
  });
};
