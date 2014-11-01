define(['underscore', 'choose_element'],
	function (_, ce) {
		var assert = chai.assert;
		var expect = chai.expect;

		describe('elementInfoRegex', function () {

			var re = ce.elementInfoRegex;

			it('should match "1:*"', function (done) {
				re.exec('1:*');
				var match = re.exec('1:*');
				assert.equal(match[0], "1:*", 'Whole match incorrect');
				assert.equal(match[1], "1", 'Universe name incorrect');
				assert.equal(match[2], "*", 'Body name incorrect');
				done();
			});

			it('should match "1:2"', function (done) {
				var match = re.exec('1:2');
				assert.equal(match[0], "1:2", 'Whole match incorrect');
				assert.equal(match[1], "1", 'Universe name incorrect');
				assert.equal(match[2], "2", 'Body name incorrect');
				done();
			});

			it('should match "1:2;nocollapse"', function (done) {
				var match = re.exec('1:2;nocollapse');
				assert.equal(match[0], "1:2;nocollapse", 'Whole match incorrect');
				assert.equal(match[1], "1", 'Universe name incorrect');
				assert.equal(match[2], "2", 'Body name incorrect');
				assert.equal(match[3], "nocollapse", "Options incorrect");
				done();
			});

		});

		describe('ChoiceUniverse', function () {
			it('should add elements to the right body', function (done) {
				var universe = new ce.ChoiceUniverse('test1');
				var element = {

				};
				universe.addElement({universe: 'test1', bodyName: 'body1'}, element);
				var body1 = universe.getBody('body1');
				assert.equal(body1.length, 1, "Choice body 'body1' should have one element");
				assert.equal(body1[0].element, element, "Choice body 'body1' should contain the added element");
				done();
			});

			it('should execute a function for each non-selected element', function (done) {
				var universe = new ce.ChoiceUniverse('test-universe-reject');
				var result = [],
					elements = _.map([1, 2, 3, 4, 5, 6], function (n) {
						var o = { val: n };
						universe.addElement({bodyName: n.toString()}, o);
						return o;
					});

				var callback = sinon.spy();
				universe.eachRejected(['2'], callback);

				var expected = _.reject(elements, { val: 2 });
				assert.equal(callback.callCount, elements.length - 1);
				assert.equal(callback.getCall(0).args[0], elements[0]);
				assert.equal(callback.getCall(1).args[0], elements[2]);
				done();
			});

			it('should randomly select one body', function (done) {
				var universe = new ce.ChoiceUniverse('test-choose');
				var elements = _.times(9, function (n) { return {id: 'el_'+n} });
				_.each(elements, function (e, i) { universe.addElement({bodyName: i % 3}); });
				var choice = universe.generateChoice(_.noop, _.noop);
				assert.lengthOf(choice, 1);
				assert.include(['0', '1', '2'], choice[0], 'the chosen body must be among the ones added');
				done();
			});

			it('should randomly choose one body using noop store and retrieve', function (done) {
				var universe = new ce.ChoiceUniverse('test-choose');
				var elements = _.times(9, function (n) { return {id: 'el_'+n} });
				_.each(elements, function (e, i) { universe.addElement({bodyName: i % 3}); });
				var choice = universe.generateChoice(_.constant(undefined), _.noop);
				assert.lengthOf(choice, 1);
				assert.include(['0', '1', '2'], choice[0], 'the chosen body must be among the ones added');
				done();
			});

			it('should choose one body using store and retrieve', function (done) {
				var universe = new ce.ChoiceUniverse('test-choose');
				var elements = _.times(9, function (n) { return {id: 'el_'+n} });
				_.each(elements, function (e, i) { universe.addElement({bodyName: i % 3}); });
				var retrieve = sinon.stub().returns(['1']);
				var store = sinon.spy();
				var choice = universe.generateChoice(retrieve, store);
				assert.sameMembers(choice, ['1'], 'the choice be the supplied choice');
				expect(retrieve).calledWith('test-choose');
				expect(store).calledWith('test-choose', ['1']);
				done();
			});

		});

		describe('ChoiceMultiverse', function () {
			it('should add elements to the right universe', function (done) {
				var multiverse = new ce.ChoiceMultiverse();
				var element = stubElement("test3-el1", "test3:body1")
				multiverse.addElement(element);

				var universe = multiverse.getUniverseByName('test3');
				assert.isNotNull(universe, "universe 'test3' was not created");
				var body1 = universe.getBody('body1');
				assert.isNotNull(body1, "choice body 'body1' was not created");
				assert.sameMembers(_.pluck(body1, 'element'), [element], "choice body 'body1' should contain the added element");
				done();
			});

			it('should execute a function for each non-selected element', function (done) {
				var multiverse = new ce.ChoiceMultiverse();
				var el1 = stubElement("test4-chosen", "test4:b1");
				var el2 = stubElement("test4-rejected", "test4:b2");
				multiverse.addElement(el1);
				multiverse.addElement(el2);

				var universe = multiverse.getUniverseByName('test4');
				assert.isNotNull(universe, "universe 'test4' was not created");
				var body1 = universe.getBody('b1');
				assert.isNotNull(body1, "choice body 'b1' was not created");

				var result = [];
				multiverse.eachRejected({'test4':['b1']}, function (el) {
					result.push(el);
				});

				assert.sameMembers(result, [el2], "eachRejected should be executed for all non-chosen elements");
				done();
			});

			it('should properly treat wildcard annotations', function (done) {
				var multiverse = new ce.ChoiceMultiverse();
				var childElements = [
					stubElement("test5-chosen", null),
					stubElement("test5-rejected", null)];
				var parent = stubParent("test5-parent", "test5:*", childElements);
				multiverse.addElement(parent);

				var universe = multiverse.getUniverseByName('test5');
				assert.isNotNull(universe, "universe 'test5' was not created");
				var body1 = universe.getBody('1');
				assert.isNotNull(body1, "choice body '1' was not created");
				var body2 = universe.getBody('2');
				assert.isNotNull(body2, "choice body '2' was not created");

				var result = [];
				multiverse.eachRejected({'test5':['0']}, function (el) {
					result.push(el);
				});

				assert.sameMembers(result, [childElements[1]], "eachRejected should be executed for all non-chosen elements");
				done();
			});

			it('should randomly select one body per universe', function (done) {
				var multiverse = new ce.ChoiceMultiverse('test-choose-multiverse');
				var elements = _.flatten(_.times(3, function (n_u) {
					return _.times(4, function (n_b) {
						return _.times(2, function (n_e) {
							return stubElement('el_' + n_u + '_' + n_b + '_' + n_e, n_u + ':' + n_b);
						});
					});
				}));
				_.each(elements, function (e) { multiverse.addElement(e); });
				var choice = multiverse.generateChoice(_.noop, _.noop);
				assert.sameMembers(_(choice).keys(), ['0', '1', '2'], 'there must be one choice for each universe');
				done();
			});

			it('should call the callback with all information about the element', function (done) {
				var multiverse = new ce.ChoiceMultiverse('test-callback-parameters');
				var elements = _.times(2, function (n_b) {
					var obj = {
						id: 'el_' + n_b,
						getAttribute: function () {}
					};
					sinon.stub(obj, 'getAttribute').returns('1:' + n_b + ';nocollapse');
					return obj;
				});
				_.each(elements, function (e) { multiverse.addElement(e); });
				var choice = {
					'1': ['1']
				}
				var callback = sinon.spy();
				multiverse.eachRejected(choice, callback);
				multiverse.eachSelected(choice, callback);
				assert.equal(callback.callCount, 2);
				assert.equal(callback.getCall(0).args[0], elements[0]);
				assert.equal(callback.getCall(0).args[1].universe, '1');
				assert.equal(callback.getCall(0).args[1].bodyName, '0');
				assert.equal(callback.getCall(0).args[1].nocollapse, true);
				assert.equal(callback.getCall(0).args[1].shuffle, false);
				assert.equal(callback.getCall(0).args[1].exclusiveChoice, true);
				assert.equal(callback.getCall(1).args[0], elements[1]);
				assert.equal(callback.getCall(1).args[1].universe, '1');
				assert.equal(callback.getCall(1).args[1].bodyName, '1');
				assert.equal(callback.getCall(1).args[1].nocollapse, true);
				assert.equal(callback.getCall(1).args[1].shuffle, false);
				assert.equal(callback.getCall(1).args[1].exclusiveChoice, true);
				done();
			});

			it('should shuffle elements', function (done) {
				var multiverse = new ce.ChoiceMultiverse('test-shuffle');
				var elements = _.times(10, function (n_b) {
					var obj = {
						id: 'el_' + n_b,
						getAttribute: function () {}
					};
					sinon.stub(obj, 'getAttribute').returns('1:' + n_b + ';shuffle');
					return obj;
				});
				_.each(elements, function (e) { multiverse.addElement(e); });

				var choice1 = multiverse.generateChoice(_.noop, _.noop);
				var choice2, i = 10;
				do {
					i -= 1;
					choice2 = multiverse.generateChoice(_.noop, _.noop);
				}
				while (_.isEqual(choice1, choice2) && i >= 0);

				assert.isTrue(i > 0);
				assert.sameMembers(choice1['1'], choice2['1']);

				done();
			});

		});


		var stubElement = function (id_, data_choice) {
			return {
				id: id_,
				getAttribute: function (name) {
					if (name !== 'data-choice') {
						return null;
					} else {
						return data_choice;
					}
				}
			};
		};

		var stubParent = function (id_, data_choice, childNodes_) {
			return {
				id: id_,
				getAttribute: function (name) {
					if (name !== 'data-choice') {
						return null;
					} else {
						return data_choice;
					}
				},
				childNodes: childNodes_
			}
		}

	});