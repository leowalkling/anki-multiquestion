define(['cookies-js', 'underscore', 'jsface'], function (Cookies, _, jsface) {
	"use strict";
    var Class = jsface.Class,
		extend = jsface.extend;

    function isChoices(o) {
		"use strict";
        return typeof o === 'object' &&
            typeof o.addElement === 'function'
    }

	var ChoiceUniverse = Class({
		constructor: function (name) {
			"use strict";
			this.name = name;
			this.bodies = Object.create(null);
		},
		addElement: function (info, element) {
			"use strict";
			if (!info || (info.universe && info.universe !== this.name)) {
				throw {
					name: "Invalid Argument",
					level: "Assertion",
					message: "supplied element's info invalid",
					toString: function () {
						return this.name + ": " + this.message;
					}
				};
			}
			else {
				info.universe = this.name;
			}
			if (!Object.prototype.hasOwnProperty.call(this.bodies, info.bodyName)) {
				this.bodies[info.bodyName] = [];
			}
			var body = this.bodies[info.bodyName];
			body.push({ element: element, info: info});
		},
		getBody: function (bodyName) {
			"use strict";
			if (typeof bodyName !== 'string') {
				throw {
					name: "Invalid Argument",
					level: "Assertion",
					message: "supplied bodyName is not a string",
					toString: function () {
						return this.name + ": " + this.message;
					}
				};
			}
			return this.bodies[bodyName];
		},
		eachRejected: function (chosen, fn) {
			"use strict";
			var keys = _.difference(_.keys(this.bodies), chosen);
			this.each(keys, fn);
		},
		eachSelected: function (chosen, fn) {
			"use strict";
			var keys = _.intersection(_.keys(this.bodies), chosen);
			this.each(keys, fn);
		},
		each: function (bodies, fn) {
			"use strict";
			var that = this;
			if (typeof fn !== 'function') {
				throw {
					name: "Invalid Argument",
					level: "Assertion",
					message: "fn must be a function",
					toString: function () {
						return this.name + ": " + this.message;
					}
				};
			}
			_.each(bodies, function (key) {
				var elements = that.bodies[key];
				_.each(elements, function (e) {
					var info = _.clone(e.info);
					info.exclusiveChoice = bodies.length <= 1;
					fn(e.element, info);
				});
			})
		},
		generateChoice: function (retrieve, store) {
			"use strict";
			var retrievedChoice = retrieve(this.name),
				finalChoice = [];
			if (!_.isEmpty(_.intersection(_.keys(this.bodies), retrievedChoice))) {
				finalChoice = retrievedChoice;
			}
			else {
				var that = this;
				var shuffleBodies = _.filter(_.keys(this.bodies), function (b) {
					return _.every(that.bodies[b],
						function (e) {
							return e.info.shuffle;
						}
					);
				});
				var original_length = shuffleBodies.length;
				if (original_length >= 1) {
					for (var i = 0; i < original_length; i += 1) {
						var choiceIndex = Math.floor(Math.random() * shuffleBodies.length);
						var choice = shuffleBodies.splice(choice, 1);
						finalChoice.push(choice);
					}
				}
				else
				{
					var bodyNames = _.keys(this.bodies);
					var length = bodyNames.length;
					var choice = Math.floor(Math.random() * length);
					finalChoice = [bodyNames[choice]];
				}
			}
			store(this.name, finalChoice);
			return finalChoice;
		}
	});

	var ChoiceMultiverse = Class({
		constructor: function () {
			"use strict";
			this.universes = Object.create(null);
		},

		addElement: function (element) {
			"use strict";
			var info = getElementInfo(element);

			if (info.bodyName === "*") {
				this.addChildNodesOfElement(element);
			} else {
				if (!Object.prototype.hasOwnProperty.call(this.universes, info.universe)) {
					this.universes[info.universe] = new ChoiceUniverse(info.universe);
				}

				this.universes[info.universe].addElement(info, element);
			}
		},

		addChildNodesOfElement: function (element) {
			"use strict";
			var that = this;
			var childNodes = element.childNodes;
			var info = getElementInfo(element);

			if (!Object.prototype.hasOwnProperty.call(this.universes, info.universe)) {
				this.universes[info.universe] = new ChoiceUniverse(info.universe);
			}
			_.each(childNodes, function (child, index) {
				that.universes[info.universe].addElement({universe:info.universe,bodyName:index.toString()}, child);
			});
		},

		getUniverseByName: function (universeName) {
			"use strict";
			if (typeof universeName !== 'string') {
				throw {
					name: "Invalid Argument",
					level: "Assertion",
					message: "supplied universeName is not a string",
					toString: function () {
						return this.name + ": " + this.message;
					}
				};
			}
			return this.universes[universeName];
		},

		eachRejected: function (chosenBodies, fn) {
			"use strict";
			var that = this;
			if (typeof fn !== 'function') {
				throw {
					name: "Invalid Argument",
					level: "Assertion",
					message: "fn must be a function",
					toString: function () {
						return this.name + ": " + this.message;
					}
				};
			}

			_.each(this.universes, function (universe) {
				if (Object.prototype.hasOwnProperty.call(chosenBodies, universe.name)) {
					universe.eachRejected(chosenBodies[universe.name], fn);
				}
			});
		},
		eachSelected: function (chosenBodies, fn) {
			"use strict";
			var that = this;
			if (typeof fn !== 'function') {
				throw {
					name: "Invalid Argument",
					level: "Assertion",
					message: "fn must be a function",
					toString: function () {
						return this.name + ": " + this.message;
					}
				};
			}

			_.each(this.universes, function (universe) {
				if (Object.prototype.hasOwnProperty.call(chosenBodies, universe.name)) {
					universe.eachSelected(chosenBodies[universe.name], fn);
				}
			});
		},
		generateChoice: function (retrieve, store) {
			"use strict";
			var choices = {};
			_.each(this.universes, function (u, key) {
				choices[key] = u.generateChoice(retrieve, store);
			});
			return choices;
		},

		choiceElementSelector: "[data-choice]"
	});

	var elementInfoRegex = /^(\w+):(\w+|\*)(?: *; *(?:(nocollapse)|(shuffle)))*$/;

	function getElementInfo(element) {
		"use strict";
		var dataChoice = element.getAttribute('data-choice');
		var match =  elementInfoRegex.exec(dataChoice);

		var info = Object.create(null);

		if (match === null) {
			return info;
		}

		info.universe = match[1];
		info.bodyName = match[2];
		info.nocollapse = match[3] === 'nocollapse';
		info.shuffle = match[4] === 'shuffle';

		return info;
	}

	function isCookiesAllowed() {
		"use strict";
		return ((location.protocol === 'file:' || location.protocol === 'http:'));
	}

	function storeChoice(universe, body) {
		if (isCookiesAllowed()) {
			Cookies.set(universe, body);
		}
	}

	function makeRetrieveChoice(reset_cookies) {
		if (reset_cookies) { return _.constant(undefined); }
		else {
			return function (universe) {
				return Cookies.get(universe);
			}
		}
	}

	function choose_element (reset_cookies) {
		"use strict";
		var multiverse = new ChoiceMultiverse();
		var elements = document.body.querySelectorAll(multiverse.choiceElementSelector);
		_.each(elements, function (e) { multiverse.addElement(e); });
		var retrieveChoice = makeRetrieveChoice(reset_cookies);
		var choice = multiverse.generateChoice(retrieveChoice, storeChoice);
		multiverse.eachRejected(choice, function (e) {
			e.parentNode.removeChild(e);
			e = null;
		});
		multiverse.eachSelected(choice, function (e, info) {
			if (info.nocollapse) { return; }

			var new_node = document.createElement('div');

			var containers = [e.parentNode];
			var highest_container = e.parentNode;
			while (highest_container.parentNode && highest_container.parentNode.childNodes.length === 1) {
				highest_container = highest_container.parentNode;
				containers.push(highest_container);
			}
			// Copy attributes and styles top-down
			_.each(containers.reverse(), function (c) {
				var attributes = c.attributes;
				_.each(attributes, function (attr) {
					new_node.setAttribute(attr.name, attr.value);
				});
			});

			// Move all child nodes
			_.each(e.childNodes, function (child) {
				new_node.appendChild(child);
			})

			// Replace the highest container with the new node
			highest_container.parentNode.replaceChild(new_node, highest_container);

		});
	}

	var exports = choose_element;
	exports.elementInfoRegex = elementInfoRegex;
	exports.ChoiceUniverse = ChoiceUniverse;
	exports.ChoiceMultiverse = ChoiceMultiverse;

	return exports;
});