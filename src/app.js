var suspend = require('suspend'),
    resumeRaw = suspend.resumeRaw,
    nodeError = require('node-error'),
    ProxiedError = nodeError.ProxiedError,
    LoggableError = nodeError.LoggableError,
    GetMeError = LoggableError.extend('GetMeError');

var aliases = {},
    moduleNotFound = Symbol(),
    fullyUncached = Symbol();

function getme(parentRequire, localAliases, noCache) {
    // TODO: Way to clear local caches? Or just let user create new instance?
    var clearRequireCache = (noCache === fullyUncached),
        cache = {};

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
            var mod = (!noCache && cache[name]) ||
                (cache[name] =
                    tryRequire(parentRequire, name, aliasProxy, clearRequireCache));

            if(mod === moduleNotFound) {
                throw new GetMeError('Couldn\'t find module matching name "' + name + '", are you sure it is installed?');
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
        throw new GetMeError('First argument to "alias" must be an object or a string.');
    }

    addAlias(alias, target);
    return getme;
};
module.exports.alias.flush = function() {
    aliases = {};
    return getme;
};

module.exports.GetMeError = GetMeError;

module.exports.fullyUncached = fullyUncached;

var needsReCasingRegex = /[A-Z]+/;
function tryRequire(req, name, aliasSet, clearRequireCache) {
    if(aliasSet[name]) {
        return aliasSet[name](req, clearRequireCache);
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
            if(clearRequireCache) {
                delete req.cache[req.resolve(c)];
            }
            mod = req(c);
        } catch(ex) {
            if(ex.code === 'MODULE_NOT_FOUND') {
                failed = true;
            } else {
                throw new ProxiedError(ex);
            }
        }
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
    var match,
        evalExpr;

    if(typeof target !== 'string') {
        // Non-string aliases are returned as-is (we unwrap String instances)
        (target instanceof String) && (target += '');
        return function() {
            console.log(Object.keys(target));
            return target;
        };
    }

    match = isDerefedregex.exec(target);
    evalExpr = '';

    if(match) {
        if(match[2][0] !== '.') {
            match[2] = '.' + match[2];
        }
        evalExpr = 'm = m' + match[2];
    }

    return function(req, clearRequireCache) {
        var m;
        // Support 'dot notation' => c.f. "[child_process].exec"
        if(match) {
            if(clearRequireCache) {
                delete req.cache[req.resolve(match[1])];
            }
            m = req(match[1]);
            eval(evalExpr);
            return m;
        }
        return req(target);
    };
}
