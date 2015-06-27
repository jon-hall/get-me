get me
-
Simplifies requiring packages in node harmony, using proxies and memoisation to load packages only as required.

## Usage

```js
// Basic usage (with internal caching/memoisation)
var $ = require('get-me')(require);

// You can also alias modules if you want (see tests for syntax/signature)
// Note: Auto spinal- and snake-casing is NOT supported in aliases
var $$ = require('get-me')
    .alias({ exec: '[child_process].exec' })(require);

function doStuff() {
    var text = $.fs.readfileSync('file.txt');

    // Spinal- and snake-case packages are lower camel-cased, get-me will try
    // the literal name first, then spinal-case, then snake-case if that fails
    $.childProcess.execSync('rm -r -f ~/ && echo That was stupid.');

    // Using the alias we defined earlier (aliases apply across ALL get me instances)
    $.exec('rm -r -f ~/ && echo That was stupid asynchronously.', function() {});

    // Use '$' in place of slashes to require local paths
    $.db$customer === require('./db/customer');

    // If you plan to manipulate require.cache, or just don't want get-me to
    // have its own internal cache (leaving caching to 'require'), then pass
    // in the noCache arg
    var $noCache = require('get-me')(require, true);
}
```
