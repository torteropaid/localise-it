'use strict';

var _bind = Function.prototype.bind;

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var aggregation = function aggregation(base) {
    for (var _len = arguments.length, mixins = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        mixins[_key - 1] = arguments[_key];
    }

    var aggregate = (function (_base) {
        function __Aggregate() {
            var _this = this;

            _classCallCheck(this, __Aggregate);

            for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                args[_key2] = arguments[_key2];
            }

            _get(Object.getPrototypeOf(__Aggregate.prototype), 'constructor', this).apply(this, args);

            mixins.forEach(function (mixin) {
                if (typeof mixin.prototype.initializer === 'function') mixin.prototype.initializer.call(_this);
            });
        }

        _inherits(__Aggregate, _base);

        return __Aggregate;
    })(base);

    var copyProps = function copyProps(target, source) {
        Object.getOwnPropertyNames(source).forEach(function (prop) {
            if (prop.match(/^(?:initializer|constructor|prototype|arguments|caller|name|bind|call|apply|toString|length)$/)) return;
            Object.defineProperty(target, prop, Object.getOwnPropertyDescriptor(source, prop));
        });
    };

    mixins.forEach(function (mixin) {
        copyProps(aggregate.prototype, mixin.prototype);
        copyProps(aggregate, mixin);
    });

    return aggregate;
};

var Model = (function () {
    function Model() {
        _classCallCheck(this, Model);

        this.__uid = '';
        this.__rev = 0;
        this.__data = {};
        this.__schema = '';
    }

    _createClass(Model, [{
        key: 'initFromData',
        value: function initFromData(data) {
            this.__data = data;
            this.__uid = this._generateUUID();
            return this;
        }
    }, {
        key: 'getFromUID',
        value: function getFromUID(uid) {
            if (typeof this.onPreGet === 'function') {
                this.onPreGet();
            }
            if (typeof this._doGet === 'function') {
                this._doGet(uid);
            }
            if (typeof this.onPostGet === 'function') {
                this.onPostGet();
            }
            return this;
        }
    }, {
        key: 'remove',
        value: function remove() {
            var res = false;
            if (typeof this.onPreRemove === 'function') {
                this.onPreRemove();
            }
            if (typeof this._doRemove === 'function') {
                res = this._doRemove();
            }
            if (typeof this.onPostRemove === 'function') {
                this.onPostRemove();
            }
            return res;
        }
    }, {
        key: 'put',
        value: function put() {
            var res = false;
            if (typeof this.onPrePut === 'function') {
                this.onPrePut();
            }
            if (typeof this._doPut === 'function') {
                res = this._doPut();
            }
            if (typeof this.onPostPut === 'function') {
                this.onPostPut();
            }
            return res;
        }
    }, {
        key: 'get',
        value: function get() {
            var key = arguments[0] === undefined ? '' : arguments[0];

            var parts = key.split('.');
            var res = this.__data;
            for (var i = 0; i < parts.length; i++) {
                if (typeof res === 'object') {
                    res = res[parts[i]];
                } else {
                    res = undefined;
                    break;
                }
            }
            return res;
        }
    }, {
        key: 'set',
        value: function set(key, value) {
            if (key === undefined) key = '';

            var parts = key.split('.');
            var current = this.__data;
            for (var i = 0; i < parts.length - 1; i++) {
                var next = current[parts[i]];
                if (typeof next !== 'object') {
                    current[parts[i]] = {};
                    next = current[parts[i]];
                }
                current = next;
            }
            current[parts[parts.length - 1]] = value;
        }
    }, {
        key: '_generateUUID',
        value: function _generateUUID() {
            var d = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c == 'x' ? r : r & 0x3 | 0x8).toString(16);
            });
            return uuid;
        }
    }]);

    return Model;
})();

var ServerModel = (function (_Model) {
    function ServerModel() {
        _classCallCheck(this, ServerModel);

        _get(Object.getPrototypeOf(ServerModel.prototype), 'constructor', this).call(this);
    }

    _inherits(ServerModel, _Model);

    _createClass(ServerModel, [{
        key: '_doGet',
        value: function _doGet(uid) {
            this.__uid = uid;
            var raw = db.get(this.__name + ':' + this.__uid);
            this.__data = JSON.parse(raw);
        }
    }, {
        key: '_doRemove',
        value: function _doRemove() {
            return db.remove(this.__name + ':' + this.__uid);
        }
    }, {
        key: '_doPut',
        value: function _doPut() {
            var key = this.__name + ':' + this.__uid;
            var value = JSON.stringify(this.__data);
            return db.put(key, value);
        }
    }]);

    return ServerModel;
})(Model);

var ServerApp = (function () {
    function ServerApp() {
        _classCallCheck(this, ServerApp);

        this.__models = {};
        this.__pages = [];
        this.__debugLogs = true;
        this._initDebugLogs();
    }

    _createClass(ServerApp, [{
        key: '_initDebugLogs',
        value: function _initDebugLogs() {
            var orig = console.log;
            if (this.__debugLogs) {
                console.debug = function () {
                    for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
                        args[_key3] = arguments[_key3];
                    }

                    return console.log.apply(console, ['ServerJS>'].concat(args));
                };
            } else {
                console.debug = function () {};
            }
        }
    }, {
        key: 'Model',
        value: function Model(name) {
            console.debug('declare server model ' + name + '...');

            for (var _len4 = arguments.length, mixins = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
                mixins[_key4 - 1] = arguments[_key4];
            }

            this.__models[name] = aggregation.apply(undefined, [ServerModel].concat(mixins));
        }
    }, {
        key: 'CreateModel',
        value: function CreateModel(name) {
            for (var _len5 = arguments.length, args = Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
                args[_key5 - 1] = arguments[_key5];
            }

            var model = new (_bind.apply(this.__models[name], [null].concat(args)))();
            model.__name = name;
            return model;
        }
    }, {
        key: 'Page',
        value: function Page(url, renderer) {
            console.debug('declare page for url: ' + url);
            this.__pages.push({ url: url, renderer: renderer });
        }
    }, {
        key: 'renderPage',
        value: function renderPage() {
            var renderer = null;
            for (var i = 0; i < this.__pages.length; i++) {
                if (URL.match(this.__pages[i].url)) {
                    renderer = this.__pages[i].renderer;
                    break;
                }
            }
            if (renderer === null) {
                console.debug('no renderer found... sending 404');
                return {
                    body: '',
                    status: 404,
                    header: {}
                };
            }
            var result = renderer();
            result.body = result.body || '';
            result.status = result.status || 200;
            result.header = result.header || {};
            return result;
        }
    }]);

    return ServerApp;
})();

var restless = new ServerApp();
restless.Model('Project', (function () {
    var _class = function _class() {
        _classCallCheck(this, _class);
    };

    _createClass(_class, [{
        key: 'onPreGet',
        value: function onPreGet() {
            if (ROLE !== 'admin') throw 'no right!';
        }
    }, {
        key: 'onPostGet',
        value: function onPostGet() {}
    }, {
        key: 'onPreRemove',
        value: function onPreRemove() {
            if (ROLE !== 'admin') throw 'no right!';
            var translationKeys = this.get('keys');
            for (var i = 0; i < translationKeys.length; i++) {
                var translation = restless.CreateModel('Translation');
                translation.getFromUID(translationKeys[i]);
                translation.remove();
            }
        }
    }, {
        key: 'onPostRemove',
        value: function onPostRemove() {
            console.debug('deleted project ' + this.__uid);
        }
    }, {
        key: 'onPrePut',
        value: function onPrePut() {
            if (ROLE !== 'admin') throw 'no right!';
            if (this.get('keys') === undefined) {
                this.set('keys', []);
            }
        }
    }, {
        key: 'onPostPut',
        value: function onPostPut() {
            console.debug('updated project ' + this.__uid);
        }
    }]);

    return _class;
})());

restless.Model('Translation', (function () {
    var _class2 = function _class2() {
        _classCallCheck(this, _class2);
    };

    _createClass(_class2, [{
        key: 'onPreGet',
        value: function onPreGet() {
            if (ROLE !== 'admin') throw 'no right!';
        }
    }, {
        key: 'onPreRemove',
        value: function onPreRemove() {
            if (ROLE !== 'admin') throw 'no right!';
            var project = restless.CreateModel('Project');
            project.getFromUID(this.get('pid'));
            var translationKeys = project.get('keys');
            for (var i = 0; i < translationKeys.length; i++) {
                if (translationKeys[i] === this.__uid) {
                    console.debug('deleted key ' + this.__uid + ' from project ' + project.__uid);
                    translationKeys.splice(i, 1);
                    project.put();
                    break;
                }
            }
        }
    }, {
        key: 'onPostRemove',
        value: function onPostRemove() {
            console.debug('deleted translation ' + this.__uid + ' of project ' + this.get('pid'));
        }
    }, {
        key: 'onPrePut',
        value: function onPrePut() {
            if (ROLE !== 'admin') throw 'no right!';
        }
    }, {
        key: 'onPostPut',
        value: function onPostPut() {
            var project = restless.CreateModel('Project');
            project.getFromUID(this.get('pid'));
            var translationKeys = project.get('keys');
            if (!contains(translationKeys, this.__uid)) {
                translationKeys.push(this.__uid);
                project.put();
                console.debug('added key ' + this.__uid + ' to project ' + project.__uid);
            }
            console.debug('updated translation ' + this.__uid + ' of project ' + this.get('pid'));
        }
    }]);

    return _class2;
})());

function contains(arr, elem) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] === elem) {
            return true;
        }
    }
    return false;
}

restless.Page('^/langfile', function () {
    var parts = URL.split('/');
    if (parts.length < 3) {
        throw 'call this url with /langfile/<projectid>/<locale>';
    }
    if (METHOD === 'GET') {
        var langFile = new LanguageFile(parts[2], parts[3]);
        return {
            status: 200,
            header: {
                'content-type': 'application/json'
            },
            body: JSON.stringify(langFile.getData())
        };
    } else if (METHOD === 'POST') {
        var langFile = new LanguageFile(parts[2], parts[3]);
        return {
            status: 200,
            header: {
                'content-type': 'application/json'
            },
            body: JSON.stringify(langFile.setData(JSON.parse(BODY)))
        };
    } else {
        return {
            status: 404,
            body: 'not an implemented http verb: ' + METHOD
        };
    }
});

var timesaver = {
    dirty: true
};

var LanguageFile = (function () {
    function LanguageFile(projectid, locale) {
        _classCallCheck(this, LanguageFile);

        this.defaultLocale = 'en_gb';
        this.locale = locale;
        if (timesaver.dirty) {
            this.project = restless.CreateModel('Project');
            this.project.getFromUID(projectid);
            console.debug('got project ' + this.project.__uid);
            var translationKeys = this.project.get('keys');
            console.debug('got ' + translationKeys.length + ' projectkeys');
            this.translations = {};
            for (var i = translationKeys.length - 1; i >= 0; i--) {
                var t = restless.CreateModel('Translation');
                t.getFromUID(translationKeys[i]);
                this.translations[t.get('key')] = t;
                console.debug('loaded translation: ' + t.__uid);
            }
            timesaver.project = this.project;
            timesaver.translations = this.translations;
            timesaver.dirty = false;
        } else {
            this.project = timesaver.project;
            this.translations = timesaver.translations;
        }
    }

    _createClass(LanguageFile, [{
        key: 'getData',
        value: function getData() {
            var result = {};
            var translationKeys = Object.keys(this.translations);
            console.debug('got ' + translationKeys.length + ' keys');
            for (var i = translationKeys.length - 1; i >= 0; i--) {
                var key = translationKeys[i];
                var translation = this.translations[key];
                if (this.locale === 'all') {
                    result[translation.get('key')] = translation.get('translations');
                    result[translation.get('key')].__internalKey = translation.get('__internalKey');
                } else if (translation.get('translations.' + this.locale) !== undefined) {
                    result[translation.get('key')] = translation.get('translations.' + this.locale);
                } else {
                    result[translation.get('key')] = translation.get('translations.' + this.defaultLocale);
                }
            }
            return result;
        }
    }, {
        key: 'setData',
        value: function setData(data) {
            var count = 0;
            var max = Object.keys(data).length;
            for (var key in data) {
                var myTranslation = this.translations[key];
                if (myTranslation === undefined && this.locale === this.defaultLocale) {
                    var translation = restless.CreateModel('Translation');
                    translation.initFromData({
                        pid: this.project.__uid,
                        key: key
                    });
                    translation.set('translations.' + this.locale, data[key]);
                    translation.set('__internalKey', translation.__uid);
                    translation.put();
                    timesaver.project.__data.keys.push(translation.__uid);
                    timesaver.translations[key] = translation;
                    this.translations[key] = translation;
                } else if (myTranslation !== undefined) {
                    var myStr = myTranslation.get('translations.' + this.locale);
                    var myDefault = myTranslation.get('translations.' + this.defaultLocale);
                    if (myStr === undefined) {
                        if (myDefault !== data[key]) {
                            console.debug('translation differs from default translation: ' + data[key] + ' <!> ' + myDefault);
                            myTranslation.set('translations.' + this.locale, data[key]);
                            myTranslation.put();
                            timesaver.translations[key] = myTranslation;
                        }
                    } else if (myStr !== data[key]) {
                        myTranslation.set('translations.' + this.locale, data[key]);
                        myTranslation.put();
                        timesaver.translations[key] = myTranslation;
                    }
                }
                count++;
                console.debug('imported ' + count + ' / ' + max + '\t(' + 1.0 * count / (1.0 * max) * 100 + '%)');
            }
            return true;
        }
    }]);

    return LanguageFile;
})();

restless.Page('^/test$', function () {

    return {
        body: '\nUrl: ' + URL + '\nMethod: ' + METHOD + '\nHeaders: ' + JSON.stringify(HEADERS) + '\nUser: ' + USERNAME + '\nRole: ' + ROLE + '\nBody: ' + BODY + '\n\n'
    };
});
//# sourceMappingURL=server.js.map
