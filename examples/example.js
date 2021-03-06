// Basic usage (with internal caching/memoisation)
var $ = require('get-me')(require);

// You can also alias modules if you want (see tests for syntax/signature)
// Note: Auto spinal- and snake-casing is NOT supported in aliases
var $$ = require('get-me')
    .alias({
        // Global aliases defined using .alias() - apply to all get-me instances
        exec: '[child_process].exec'
    })(require, {
        // Local aliases - this only applies to '$$', not '$'
        f: 'fs'
    });

function doStuff() {
    var text = $.fs.readfileSync('file.txt');

    // Spinal- and snake-case packages are lower camel-cased, get-me will try
    // the literal name first, then spinal-case, then snake-case if that fails
    $.childProcess.execSync('rm -r -f ~/ && echo That was stupid.');

    // Using the aliases defined earlier
    $.exec('rm -r -f ~/ && echo That was stupid asynchronously.', function() {});
    $$.f.statSync(__dirname);
    try {
        $.f.statSync(__dirname);
    } catch(e) {
        /* Throws because $ has no alias for 'f' */
    }

    // Use '$' in place of slashes to require local paths
    $.db$customer === require('./db/customer');

    // If you plan to manipulate require.cache, or just don't want get-me to
    // have its own internal cache (leaving caching to 'require'), then pass
    // in the noCache arg
    // NOTE: Caches are per-instance of 'get-me'
    var $noCache = require('get-me')(require, true);

    // Cache clearing
    require('get-me')
        .alias.flush(); // Flush the global alias cache
}
