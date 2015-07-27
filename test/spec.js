var $ = require('../src/app')(require);

describe('when i ask it to get me things', function() {
    it('then it should be able to get me built in modules', function () {
        expect($.fs).toBe(require('fs'));
        expect($.childProcess.exec).toBe(require('child_process').exec);
    });

    it('then it should be able to get me public repository modules', function () {
        expect($.express).toBe(require('express'));
        expect($.serveStatic).toBe(require('serve-static'));
    });

    it('then it should be able to get me local files', function () {
        expect($.sameDir).toBe(require('./same-dir'));
    });

    it('then it should be able to get me local files when requiring a folder', function () {
        expect($.nested).toBe(require('./nested'));
    });

    it('then it should be able to get me nested local files', function () {
        expect($.nested$childModule).toBe(require('./nested/child-module'));
    });

    it('then it should be internally caching', function () {
        var resolved = require.resolve('./same-dir'),
            sd = require('./same-dir');

        // Clear cache from previous tests - confirm it gets cleared
        delete require.cache[resolved];
        expect(require.cache[resolved]).toBeUndefined();

        // Sanity check that we do have an item in the cache after requiring
        require('./same-dir');
        expect(require.cache[resolved]).toBeDefined();

        // Clear it once again
        delete require.cache[resolved];
        expect(require.cache[resolved]).toBeUndefined();

        // Finally, use get me to retrieve the module and check the require
        // cache wasn't repopulated by a call to require
        expect($.sameDir).toBe(sd);
        expect(require.cache[resolved]).toBeUndefined();
    });

    describe('and i use no cache', function() {
        it('then it should NOT be internally caching', function () {
            var $ = require('../src/app')(require, true),
                resolved = require.resolve('./same-dir'),
                sd = require('./same-dir');

            // Clear cache from previous tests - confirm it gets cleared
            delete require.cache[resolved];
            expect(require.cache[resolved]).toBeUndefined();

            // Sanity check that we do have an item in the cache after requiring
            require('./same-dir');
            expect(require.cache[resolved]).toBeDefined();

            // Clear it once again
            delete require.cache[resolved];
            expect(require.cache[resolved]).toBeUndefined();

            // Finally, use get me to retrieve the module and check the require
            // cache WAS repopulated by a call to require
            expect($.sameDir).toEqual(sd);
            expect(require.cache[resolved]).toBeDefined();
        });
    });

    describe('and i globally alias modules', function() {
        it('then it should get me the correct aliased modules back', function() {
            var $$ = require('../src/app')
                .alias('ex', 'express')
                .alias({
                    // You can alias properties deferenced on a required module
                    // by enclosing the actual module name in square brackets
                    // then using dot-notation
                    'exec': '[child_process].exec'
                })(require);

            // Aliasing is GLOBAL, not per getme
            expect($.ex).toBe(require('express'));

            expect($$.exec).toBe(require('child_process').exec);
        });

        describe('and i alias using non-string values', function() {
            it('then i should get the values back when doing a require', function() {
                var w = new String('xyz'),
                    x = function() {},
                    y = 4,
                    z = { a: 1, b: 'b' },
                    $$ = require('../src/app')
                    .alias('w', w)
                    .alias('x', x)
                    .alias({
                        y: y,
                        z: z
                    })(require);

                // Aliasing is GLOBAL, not per getme
                expect($$.w).toBe('xyz');
                expect(w instanceof String).toBe(true);
                expect($$.w instanceof String).toBe(false);
                expect($.x).toBe(x);
                expect($$.y).toBe(4);
                expect($.z).toBe(z);
            });
        });
    });

    describe('and i locally alias modules', function() {
        it('then it should get me the correct aliased modules back for each ' +
        'instance', function() {
            var $ = require('../src/app').alias.flush()(require),
            $$ = require('../src/app').alias({
                // set a global alias too
                exec: 'fs'
            })(require, {
                'exec': '[child_process].exec'
            }),
            $$$ = require('../src/app')(require, {
                'exec': 'express'
            });

            // Global alias working against $
            expect($.exec).toBe(require('fs'));

            // Local alias overrides global
            expect($$$.exec).toBe(require('express'));

            // But not each other
            expect($$.exec).toBe(require('child_process').exec);
        });

        describe('and i alias using non-string values', function() {
            it('then i should get the values back when doing a require', function() {
                var w = new String('abc'),
                    x = function() {},
                    y = 4,
                    z = { a: 1, b: 'b' },
                    $$ = require('../src/app')
                    .alias('x',
                        function x(){})(require, {
                        w: w,
                        x: x,
                        y: y,
                        z: z
                    });

                expect($$.w).toBe('abc');
                expect(w instanceof String).toBe(true);
                expect($$.w instanceof String).toBe(false);
                expect($.x).not.toBe(x);
                expect($$.x).toBe(x);
                expect($$.y).toBe(y);
                expect($$.z).toBe(z);
            });
        });
    });
});
