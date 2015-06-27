var suspend = require('suspend');

/**
 * Adds very crude generator support to jasmine's 'it' method.
 * Acheived by lots of fugly wrapping and stuff -> see below ;O
 */
module.exports = function(should, gen) {
    it(should, function(done) {
        suspend(function*() {
            yield* gen();
            done();
        })();
    });
}
