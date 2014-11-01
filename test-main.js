var tests = [];
for (var file in window.__karma__.files) {
  if (window.__karma__.files.hasOwnProperty(file)) {
    if (/-test\.js$/.test(file)) {
      tests.push(file);
    }
  }
}
requirejs.config({
    // Karma serves files from '/base'
    baseUrl: '/base/src',

  paths: {
    basil: "../lib/basil.js/src/basil",
    "cookies-js": "../lib/cookies-js/src/cookies",
    domready: "../lib/domready/ready",
    jsface: "../lib/jsface/jsface",
    requirejs: "../lib/requirejs/require",
    underscore: "../lib/underscore/underscore"
  },
  shim: {
	jsface: {
		exports: 'jsface'
	}
  },
  packages: [

  ],

    // ask Require.js to load these files (all our tests)
    deps: tests,

    // start test run, once Require.js is done
    callback: window.__karma__.start
});