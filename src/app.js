var suspend = require('suspend'),
    resumeRaw = suspend.resumeRaw;

var aliases = {},
    moduleNotFound = Symbol();

function getme(parentRequire, localAliases, noCache) {
    // TODO: Way to clear local caches? Or just let user create new instance?
    var cache = {};

    if(typeof localAliases !== 'object') {
        noCache = !!localAliases;
        localAliases = {};
    } else {
        Object.keys(localAliases).forEach(k => {
            localAliases[k] = getTargetFunction(localAliases[k]);
        });
    }

    var aliasProxy = Proxy.create({
        get: function(proxy, name) {
            return localAliases.hasOwnProperty(name) ? localAliases[name] :
                aliases.hasOwnProperty(name) ? aliases[name] : undefined;
        }
    });

    return Proxy.create({
        get: function(proxy, name) {
            var mod = noCache ? tryRequire(parentRequire, name, aliasProxy) :
                cache[name] || (cache[name] = tryRequire(parentRequire, name, aliasProxy));
            if(mod === moduleNotFound) {
                throw new Error('Couldn\'t find module matching name "' + name + '", are you sure it is installed?');
            }
            return mod;
        }
    });
};
module.exports = getme;

module.exports.alias = function(alias, target) {
    if(typeof alias === 'object') {
        Object.keys(alias).forEach(a => addAlias(a, alias[a]));
        return getme;
    }

    if(typeof alias !== 'string') {
        throw new Error('First argument to "alias" must be an object or a string.');
    }

    if(typeof target !== 'string') {
        throw new Error('Second argument to "alias" must be a string.');
    }

    addAlias(alias, target);
    return getme;
};
module.exports.alias.flush = function() {
    aliases = {};
    return getme;
};

var needsReCasingRegex = /[A-Z]+/;
function tryRequire(req, name, aliasSet) {
    if(aliasSet[name]) {
        return aliasSet[name](req);
    }

    // Strip (invalid) '$' chars and replace with forward slashes (for specifying paths)
    name = name.replace(/\$/g, '/');

    var candidates = [name],
        mod = moduleNotFound;

    // If it isn't already a relative path (e.g. $$['./index']), then add the
    // relative path version to our list of candidates
    if(!/^\.\//.test(name)) {
        candidates.push('./' + name);
    }

    if(needsReCasingRegex.test(name)) {
        candidates.forEach(c => addCases(candidates, c))
    }

    candidates.some(c => {
        var failed = false;
        try {
            mod = req(c);
        } catch(ex) { failed = true; }
        return !failed;
    });

    return mod;
}

function addCases(candidates, name) {
    var boundaryRegex = /([A-Z])/g,
        snakeConvertor = function($1){return "_"+$1.toLowerCase();},
        spinalConvertor = function($1){return "-"+$1.toLowerCase();};

    candidates.push(name.replace(boundaryRegex, spinalConvertor));
    candidates.push(name.replace(boundaryRegex, snakeConvertor));
}

function addAlias(name, target) {
    aliases[name] = getTargetFunction(target);
}

var isDerefedregex = /^\[(.*?)\](.*)$/;
function getTargetFunction(target) {
    var match = isDerefedregex.exec(target);

    return function(req) {
        var m;
        // Support 'dot notation' => c.f. "[child_process].exec"
        if(match) {
            m = req(match[1]);
            if(match[2][0] !== '.') {
                match[2] = '.' + match[2];
            }
            eval('m = m' + match[2]);
            return m;
        }
        return req(target);
    }
}
