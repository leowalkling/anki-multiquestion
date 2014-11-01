require.config({
  baseUrl: "src/",
  paths: {
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

  ]
});