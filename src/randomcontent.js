define(['cookies-js', 'underscore', 'jsface', 'domready'], function (Cookies, _, jsface, domready) {
    // Looks for text enclosed in the following patterns:
    // [§§1a]…[/§§] - for each digit, only the contents of one letter are kept
    // [§§1b§§] - same as above, but whole node is used or discarded, collapsing emptied parent nodes
    // [++1a]…[/++] - swaps the contents of each occurrence with those of another occurrence
    // [++1b++] - uses the contents of the enclosing element as content
    "use strict";

    function randomcontent(html, reset_cookies) {
        var projections = Object.create(null),
            permutations = Object.create(null),
            marker_regex = /\[(\/)(§§|\+\+)(\d)([a-z])\]/g,
            match,
            proj_nesting_level = 0,
            perm_nesting_level = 0;

        function add_regex_match_to_registry(match) {
            var is_terminator = match[1] === '/',
                type = match[2],
                digit = match[3],
                letter = match[4],
                container;
            if (type === '§§') {
                projections[digit] = projections[digit] || Object.create(null);
                container = projections[digit] || (projections[digit][letter] = []);
                if (is_terminator) {
                    proj_nesting_level -= 1;
                } else {
                    proj_nesting_level += 1;
                }
            } else if (type === '++') {
                permutations[digit] = permutations[digit] || Object.create(null);
                container = permutations[digit] || (permutations[digit][letter] = []);
                if (is_terminator) {
                    perm_nesting_level -= 1;
                } else {
                    perm_nesting_level += 1;
                }
            } else {
                throw {
                    name: "Incorrect Match",
                    level: "Error",
                    message: "unexpected matching text",
                    toString: function () {
                        return this.name + ": " + this.message;
                    }
                };
            }

            if (container[letter] !== undefined && !is_terminator) {
                container[letter].push({ startIndex: match.index });
            } else if (container[letter] !== undefined && is_terminator) {
                _.last(container[letter]).endIndex = match.index;
            }
        }

        while ((match = marker_regex.exec(html)) !== null) {
            add_regex_match_to_registry(match);
        }

        var use_cookies = !reset_cookies && Cookies.enabled;
        var store_cookies = use_cookies;
        var projection_choices = (function () {
            var projections_cookie = Cookies.get('randomcontent-proj'),
                projection_choices;
            if (use_cookies && projections_cookie !== undefined) {
                projection_choices = JSON.parse(projections_cookie);
            } else {
                projection_choices = Object.create(null);
            }

            _.each(projections, function (proj_set, proj_digit) {
                if (projection_choices[proj_digit] === undefined || !_.has(proj_set, projection_choices[proj_digit])) {
                    var letters = _.keys(proj_set),
                        chosen_index = Math.floor(Math.random() * letters.length),
                        chosen_letter = letters[chosen_index];
                    projection_choices[proj_digit] = chosen_letter;
                }
            });
            return projection_choices;
        }()),
            permutation_choices = (function () {
                var permutations_cookie = Cookies.get('randomcontent-perm'),
                    permutation_choices;
                if (use_cookies && permutations_cookie !== undefined) {
                    permutation_choices = JSON.parse(permutations_cookie);
                } else {
                    permutation_choices = Object.create(null);
                }

                _.each(permutations, function (pemutation_set, perm_digit) {
                    if (permutation_choices[perm_digit] === undefined || !_.every(permutation_choices[perm_digit], _.partial(_.has, permutation_set))) {
                        var letters = _.keys(pemutation_set);
                        permutation_choices[perm_digit] = _.shuffle(letters);
                    }
                });
                return permutation_choices;
            }());

        if (store_cookies) {
            Cookies.defaults = {
                path: location.pathname,
                host: location.host
            };
            Cookies.set('randomcontent-proj', projection_choices);
            Cookies.set('randomcontent-perm', permutation_choices);
        }

        _.each(projections, function (projection_set, digit) {
            _.each(projection_set, function (entry, letter) {
                if (projection_choices[digit] === letter) {
                } else {

                }
            });
        });
    }

    var exports = {
        render: randomcontent
    };

    return exports;
});