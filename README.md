# get me

Simplifies requiring packages in node harmony, using proxies and memoisation to load packages only as required.

## Install

```sh
$ npm install get-me --save
```

## But why

Partly because I wanted to do something fun with Proxies, but also because why would you do this

```js
var fsx = require('fs-extra'),
    path = require('path'),
    globby = require('globby'),
    execSync = require('child_process').execSync,
    _ = require('underscore'),
    inquirer = require("inquirer");

function doStuff(defaults) {
    var dest = path.resolve(__dirname, '../..');

    inquirer.prompt([/**/], function(a) {
        _.extend(a, defaults);
        matches = globby.sync(a.globs);

        matches.forEach(function(f) {
            fsx.copySync(f, path.resolve(dest, f));
        });

        execSync('git init', {cwd: dest});
    });
}
```

When you can do this

```js
var $ = require('get-me')(require, {
    execSync: '[child_process].execSync'
});

function doStuff(defaults) {
    var dest = $.path.resolve(__dirname, '../..');

    $.inquirer.prompt([/**/], function(a) {
        $.underscore.extend(a, defaults);
        matches = $.globby.sync(a.globs);

        matches.forEach(function(f) {
            $.fsExtra.copySync(f, $.path.resolve(dest, f));
        });

        $.execSync('git init', {cwd: dest});
    });
}
```

Need to bring a new library into a file?

No need to scroll back to the top, drop in another require and all that jazz - **just start using it**, it's a simple as typing `$.myNewLibrary.doStuff()`!  You can install it later, and if you forget, *get-me* will tell you about it when it can't find what you were looking for!

---
See the examples folder for a more replete example of all the API features.
## Mocking in tests
You can also now use get-me for providing stubs/mocks in tests by means of global aliases
```js
// app.js
var $ = require('get-me')(require);
module.exports = function(val) {
    $.myDependency.a = val;
}
```
```js
// spec.js
var getme = require('get-me'),
    $ = getme(require, {
        app: '../src/app'
    });

describe('my app', function() {
    var mock;
    beforeEach(function() {
        mock = {};
        getme.alias({
            './my-dependency': mock
        });
    });

    it('does things', function() {
        $.app(5);
        expect(mock.a).toBe(5);
    });
});
```
