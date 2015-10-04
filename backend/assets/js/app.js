
var app = app || {};

app._merge = function () {
  var args = [];
  for (var arg in arguments) {
    args.push(arguments[arg]);
  }
  args.push(function (a, b) {
    return _.isArray(a) ? a.concat(b) : undefined;
  });
  return _.merge.apply(_, args);
};

if (!Function.prototype.bind) {
  Function.prototype.bind = function (binding) {
    var self = this;
    return function () {
      self.apply(binding, arguments);
    };
  };
}

Function.prototype.property = function(key) {
  console.log(app.viewHelper.last, key);
  return this;
};

String.prototype.capitalize = function() {
  return this[0].toUpperCase() + this.slice(1, this.length);
};

String.prototype.insert = function (pos, string) {
  var result = this;
  if (pos > 0) {
    result = this.substring(0, pos) + string + this.substring(pos, this.length);
  }
  else if (pos === 0) {
    result = string + this;
  }

  return result;
};

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(obj, start) {
       for (var i = (start || 0), j = this.length; i < j; i++) {
           if (this[i] === obj) { return i; }
       }
       return -1;
  };
}

if (typeof String.prototype.startsWith != 'function') {
  // see below for better implementation!
  String.prototype.startsWith = function (str){
    return this.indexOf(str) == 0;
  };
}

app.cookie = {
  set: function (opt) {
    var d = new Date();
    var cname = opt.cname;
    d.setTime(d.getTime() + (opt.exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    var path = "path=/";
    document.cookie =cname + "=" + opt.content + "; " + expires + ";" + path;
  },
  get: function (opt) {
    var name = opt.cname+'=';
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0)==' ') c = c.substring(1);
      if (c.indexOf(name) != -1) return c.substring(name.length, c.length);
    }
    return "";
  },

  delete: function(opt) {
      document.cookie = opt.cname+"=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
  },
};

(function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());
var app = app || {};
app.app = {
    init: function(finished) {
        app.controllerHelper.init();
        this.stateManager =  app.stateManager; // @FIXME is currently needed, but will be obsolete with SM2
        this.setConfig();
        app.adapter.init();
        app.viewHelper.init();
        app.app.addJobs();
        if(window.JST) {
            app.app.insertApp();
        } else {
            app.app.loadTemplates();
        }

         try {
            this.localStorage = 'localStorage' in window && window['localStorage'] || {
                __data: {},

                getItem: function (key) {
                    return this.__data[key] || '';
                },
                setItem: function (key, value) {
                    this.__data[key] = value;
                },
            };
        } catch (e) {
            return false;
        }

    },
    setConfig: function() {
        window.Config = {Debug: {debugMode: true}};
    },
    addJobs: function() {
        app.viewHelper.activateDirty(); // Not needed, but activates batching of renderings

        runloop.addJob(new Job({
            type: 'execute',
            callback: app.adapter.trigger.bind(app.adapter),
            interval: 10,
        }));

        app.runloop.addJob(new Job({
            type: 'execute',
            callback: app.controllerHelper.garbageCollecter,
            interval: 5
        }));

        // app.runloop.addJob(new Job({
        //  type: 'execute',
        //  callback: app.adapter.checkForError,
        //  interval: 5
        // }));

        runloop.start();
    },
    insertApp: function() {
        var uid = app.viewHelper.increment;
        app.viewHelper.addAnchor({uid: uid, module: 'main', template: 'main', content: {}});
        $('#app').attr('data-anchor', uid);
        app.viewHelper.executeAnchors();
    },
    loadTemplates: function() {
        /*$.ajax('../rest/concat/gui/templates.jade').done(function(res) {
            var lines = res.split('\n');
            var result = {};
            var current = "";
            var templateName = false;
            for(var i = 0; i < lines.length; i++) {
                var line = lines[i];

                if(line.search('//========') === 0) {
                    templateName = !templateName;
                } else if(templateName) {
                    var delimiter = '/';
                    if(line.split(delimiter).length < line.split('\\').length) { // Check if windowspath, sorry for my poorness
                        delimiter = '\\';
                    }
                    var parts = line.split(delimiter);
                    var filename =  parts[parts.length - 1];
                    current = parts[parts.length - 2] + '/' + filename.split('.')[0];
                    result[current] = "";
                } else if(current){
                    result[current] += line + "\n";
                }
            }

            app.viewHelper.addTemplates(result);
            app.app.insertApp();
        });*/
    }, // @TODO remove 'translation' to a seperate controller
    t: function(key) {
        return key;
    }
};
app.safeTrigger =  function(scope, safe, callback) {
    if(Config.Debug.debugMode) {
        scope[safe]();
    } else {
        try{
            scope[safe]();
        } catch(err) {
            callback(err);
        }
    }
};

$(document).ready(app.app.init.bind(app.app));
function PubSubWebsocket(addr) {

	this.cli = new WebSocket(addr);
	this.callbacks = {};

	this.cli.onmessage = function(msg){
		var data = JSON.parse(msg.data);
		app.adapter.socketIncome(data.topic, data);
	};

	this.cli.onerror = function(msg){
		console.log("error: ",msg);
	};

	this.cli.onclose = function(msg){
		console.log("close: ",msg);
	};

	this.sendObject = function(data){
		this.cli.send(JSON.stringify(data));
	};

	this.subscribe = function(topic){
		var obj = {
			"subscribe" : true,
			"topic" : topic
		};
		this.sendObject(obj);
	};

	this.unsubscribe = function(topic){
		var obj = {
			"unsubscribe" : true,
			"topic" : topic
		};
		this.sendObject(obj);
	};

	this.publish = function(topic,data){
		var obj = {
			"publish" : true,
			"topic" : topic,
			"data" : data
		};
		this.sendObject(obj);
	};

	this.registerCallback = function(topic,callback){
		var list = this.callbacks[topic];
		if (list === undefined) {
			list = [];
			list.push(callback);
			this.callbacks[topic] = list;
		}
		else {
			list.push(callback);
			this.callbacks[topic] = list;
		}
	};
}

if(window.jasmine) {
	window.Config = {"Debug":{"deactivateReload":false,"showPHPErrors":true,"dummyConnectors":true,"logoutTime":60,"noLogout":true,"ignoreCache":true},"Misc":{}};

	app.adapter = {
		init: function() {},
		trigger: function() {},
		subscribe: function() {},
		add: function(opt) {
			var result = testSetup.getMocks(opt);
			window.setTimeout(function() {
				if(_.isFunction(opt.callback)) {
					opt.callback(result, opt);
				} else {
					console.warn('Could not find callback');
				}
			}, 0);
		}
	};

	testSetup = {
		moduleFinished: function(result, request) {
			var opt = app.module.getData(request.payload.id);
			app.controllerHelper.create(result.module, opt);
			if (_.isFunction (opt.callback)) {
				opt.callback();
			}
		},
		loadTemplate: function(opt) {
			setTimeout(function() { // encapsulated to fake async
				app.module.templateLoaded(opt.id);
			}, 0);
		},
		getDevice: function(device) {
			if(!device) {
				device = 'x';
			}

			return device;
		},
		getMocks: function(opt) {
			var device = this.getDevice(opt.device);
			var result = null;

			console.log('Request: ' + device + '-' + opt.controller + '-' + opt.action);
			try {
				result = testSetup.mocks[device][opt.controller][opt.action](opt.payload);
			} catch(err) {
				console.error('request was not successfull');
			}
			console.log('Result:', result);
			return result;
		}
	};
}

/*global $:false, die:false, Request:false*/

/**
 * @module Controllers
 */

if(!app.adapter) {
app.adapter = {
    socket: null,
    url: 'ws://lion:12345',
    requests: [],
    pendingRequests: [],
    type: null,

    init: function () {
        this.type = 'polling';
        //this.socket = new PubSubWebsocket(this.url);
    },

    trigger: function () {
        var call = this.collect();
        if (call.count > 0) {
            this.send(call.result, call.count);
        }

        this.clearRequests();
    },

    signIn: function () {
        // this.socket.send('foo');
    },

    clearRequests: function () {
        var requests = app.adapter.requests;
        for (var requestIndex in requests) {
            if (requests.hasOwnProperty(requestIndex)) {
                app.adapter.pendingRequests.push(requests[requestIndex]);
            }
        }

        app.adapter.requests = [];
    },

    clearPendings: function () {
        var requests = app.adapter.pendingRequests;
        var pendingRequests = [];
        for (var requestIndex in requests) {
            var request = requests[requestIndex];
            if (requests.hasOwnProperty(requestIndex) && !request.finished) {
                pendingRequests.push(request);
            }
        }

        app.adapter.pendingRequests = pendingRequests;
    },

    income: function (evt) {
        // iterate through pendingRequests
        app.adapter.clearPendings();
        var requests = app.adapter.getRequests(evt.data, evt.uid);

        for (var requestIndex in requests) {
            if (requests.hasOwnProperty(requestIndex)) {
                var request = requests[requestIndex];
                this.pushRecord(request, evt);
                if(evt.status == 200 && (!evt.data.status || !_.isNumber(evt.data.status) || evt.data.status == 200)) {
                    this.handlePromise(request.promise, 'resolve');
                    this.handleCache(evt.data, request);
                    // Is improved handling of errorCallbacks, but breaks api
                    // if(request.errorCallback && (evt.data.success === false || evt.data.error === true)) {
                    //  request.errorCallback(evt.status, evt.data);
                    // } else 
                    if (request.callback) {
                        // Is improved handling of errorCallbacks, but breaks api
                        // if(evt.data.success === false || evt.data.error === true) {
                        //  console.error('An error occured, so please define an errorCallback!', evt.data);
                        // }
                        if(Config.Debug.debugMode) {
                            request.callback(evt.data, request);
                        } else {
                            try{ // Is needed when in an job an exception is thrown
                                request.callback(evt.data, request);
                            } catch(err) {
                                console.error(err);
                            }
                        }

                        request.finished = true;
                    } else{
                        console.log('requestcallback could not be found', request);
                    }
                } else if(_.isFunction(request.errorCallback)) {
                    this.handlePromise(request.promise, 'reject');
                    var result = null;
                    if(Config.Debug.debugMode) {
                        // @TODO improve params
                        result = request.errorCallback(evt.data.status || evt.data, result || evt.data, {}, request);
                    } else {
                        try{ // Is needed when in an job an exception is thrown
                            result = request.errorCallback(evt.data.status || evt.data, result || evt.data, {}, request);
                        } catch(err) {
                            console.error(err);
                        }
                    }
                    request.finished = true;
                    if(result !== false && evt.status == 401) {
                        runloop.clear();
                        app.app.build('ion-login', false, 'x');
                    }
                } else if(evt.status == 401 || evt.data.status == 401) {
                    runloop.clear();
                    app.app.build('ion-login', false, 'x');
                } else {
                    this.handlePromise(request.promise, 'reject');
                    // app.controllerHelper.trigger('alert', {message: 'translate:tools.request.error', type: 'error'});
                    console.log('requesterrorcallback could not be found', request);
                    // debugger;
                }
            }
        }
    },

    collect: function () {
        var result = {};
        var count  = 0;
        var requests = app.adapter.requests;
        for (var requestIndex in requests) {
            if (requests.hasOwnProperty(requestIndex)) {
                if(count >= 1) break;
                var request = requests[requestIndex];
                if (!request.device) {
                    request.device = app.app.stateManager.getDevice();
                }
                if (!request.ownWindow) {
                    count++;
                    if (!result[request.device]) {
                        result[request.device] = {};
                    }
                    if (!result[request.device][request.controller]) {
                        result[request.device][request.controller] = [];
                    }

                    result[request.device][request.controller].push(app.adapter.transform(request));
                } else {
                    var req = {};
                    req[request.device] = {};
                    req[request.device][request.controller] = [{a: request.action, p: request.payload}];
                    location.href = '/batch?data=' + JSON.stringify(req);
                }
            }
        }

        return {result: result, count: count};
    },

    transform: function (request) {
        return {
            a: request.action,
            ttl: 10,
            id: request.id,
            p: request.payload || {}
        };
    },
    checkValidity: function(opt, checkCallback) {
        var valid = true;
        if(!opt.action) {
            console.error('There was no controllerAction');
            valid = false;
        } else if(!opt.controller) {
            console.error('There was no controller defined');
            valid = false;
        } else if(!opt.callback && !opt.ownWindow) {
            console.error('There was no callback defined');
            valid = false;
        } else if(checkCallback) {
            if(!_.isString(opt.callback)) {
                console.error('The callback should be a string');
                valid = false;
            }
            if(!opt.errorCallback) {
                console.warn('You should define an errorCallback');
            } else if(!_.isString(opt.errorCallback)) {
                console.error('The errorCallback should be a string');
                valid = false;
            }
        }

        return valid;
    },
    //opt: {controller, action, payload, device, callback, errorCallback, payloadHandler, checksum}
    add: function (opt, preventWarning) {
        if(!preventWarning) {
            console.warn('adapter.add() is deprecated, please use controller.send() -> example at authentification-login');
        }
        if (opt) {
            if(!this.checkValidity(opt)) {

            } else if(opt.cache && this.hasCache(opt)) {
                var data = this.getCache(opt);
                runloop.once(new Job({ // Needed to fake async
                    type: 'execute',
                    callback: function() {
                        opt.callback(data, opt);
                    }
                }));

                return 'cache';
            } else {
                opt.id = Math.round(Math.random()*1000000);
                app.adapter.requests.push(opt);
                this.trigger();
                return opt.id;
            }
        } else {
            console.error('You forgot to add options to adapter');
        }
    },
    hashCache: function(opt) {
        
        return false;
    },
    subscribe: function (opt, controller) {
        // @TODO Add clearevents
        if (this.type === 'polling') {
            opt.type     = 'request';
            if(!opt.interval) {
                opt.interval = 5 * 20;
            }

            if(!opt.uid) {
                opt.uid = controller.uid;
            }
            if(!opt.callback) {
                opt.callback = app.controllerHelper.reloadHandler;
            }

            runloop.addJob(new Job(opt));
        }
        else if (this.type == 'ws') {
            app.adapter.socket.subscribe(opt.controller);
            var action = 'fetch';
            if(opt.action) {
                action = opt.action;
            }
            controller.view.events.push({action: action, type: 'ws_' + opt.controller});
        }
    },
    // app.adapter.unsubscribe({uid: this.uid, controller: 'commissioning', action: 'state', device: 'slot02-dsmr.subrack02.rack01'})
    unsubscribe: function (opt, supressLog) {
        var found = false;
        var job   = null;
        if(opt.uid){
            var jobs = app.runloop.findByUid(opt.uid);
            for(var i = 0; i < jobs.length; i++) {
                job = jobs[i];
                if(opt.controller == job.controller && opt.action == job.action) {
                    job.del = true;
                    found   = true;
                } else if(opt.controller == job.controller && !opt.action) {
                    job.del = true;
                    found   = true;
                } else if(!opt.controller) {
                    job.del = true;
                    found   = true;
                }
            }
        } else if(opt.controller && opt.action) {
            if(opt.device) {
                job = app.runloop.findJob(opt.device, opt.controller + '-' + opt.action);
                if(job) {
                    job.del = true;
                    found   = true;
                }
            } else {
                job = app.runloop.findJob('*', opt.controller + '-' + opt.action);
                if(job) {
                    job.del = true;
                    found   = true;
                }
            }
        } else {
            console.warn('Your options were invalid');
        }

        if(found && !supressLog) {
            console.log("unsubscribe:",opt);
        }

        return found;
    },
    socketIncome: function (topic, data) {
        app.controllerHelper.trigger('ws_' + topic, data);
    },

    send: function (data, count) {
        var sendData = JSON.stringify(data),
            type     = app.adapter.type;

        //if (type == 'ws') {
        //  if (!app.adapter.socket.send) {
        //      console.log('socket is not ready');
        //      return false;
        //  }
        //  var res = app.adapter.socket.send(data);
        //  if (!res) {
        //      console.log('could not send');
        //      return false;
        //  }
        //} else if (type == 'lp') {

        // } else {
        for(var device in data) {
            if(data.hasOwnProperty(device)) {
                for(var controller in data[device]) {
                    if(data[device].hasOwnProperty(controller)) {
                        // TODO Needs refactoring!
                        $.ajax({
                            type:        'POST',
                            url:         'controller/' + controller + '.php',
                            data:        sendData,
                            contentType: 'application/json; charset=utf-8',

                            success: function (result, status, xhr) {
                                app.adapter.xhrResp(this, result, status, xhr);
                            },

                            error: function (xhr, status) {
                                app.adapter.xhrRespErr(this, xhr, status);
                            }
                        });
                    }
                }
            }
        }

            return true;
        // }
    },

    xhrResp: function (self, result, status, xhr) {
        if(result === undefined) {
            throw "backend responded with empty result";
        }
        this.checkVersion(xhr);
        var requests = app.adapter.disperse(JSON.parse(self.data));
        if (requests.length === 1) {
            app.adapter.income({data: result, status: xhr.status, uid: requests[0].id}, xhr);
        }
        else {
            var results = app.adapter.disperse(result),
                found   = false;

            for (var resultIndex in results) {
                if (results.hasOwnProperty(resultIndex)) {
                    var resultObj = results[resultIndex];
                    if (resultObj.content) {
                        found = true;
                        var id = resultObj.id || requests[resultIndex].id; // needed because in an errorcase the server does not return an id
                        app.adapter.income({status: resultObj.status, data: _.clone(resultObj.content), uid: id});
                    }
                }
            }

            if (!found) {
                console.error('no result content');
            }
        }
    },

    xhrRespErr: function (self, xhr, status, sendData) {
        // TODO inform errorCallbacks
        var requests = app.adapter.disperse(JSON.parse(self.data));
        var result   = true;

        for (var i = 0; i < requests.length; i++) {
            var req = this.getRequests(requests[i], requests[i].id)[0];
            this.handlePromise(req.promise, 'reject');
            if (_.isFunction (req.errorCallback)) {
                var responseText = xhr.responseText;
                if (xhr.getResponseHeader('content-type') && xhr.getResponseHeader('content-type').search('application/json;') === 0) {
                    try {
                        responseText = JSON.parse(xhr.responseText);
                    } catch(err) {
                        console.log('responseText was no json');
                    }
                }
                result = req.errorCallback(xhr.status, responseText, xhr, req);
            } else{
                console.log('requesterrorcallback could not be found', req);
                // app.controllerHelper.trigger('alert', {message: 'translate:tools.request.error', type: 'error'});
            }
        }

        if (xhr.status === 401 && result !== false) {
            // TODO trigger event for loading
            runloop.clear();
            app.app.build('ion-login', false, 'x');
            return;
        }
    },
    checkVersion: function(xhr) {
        var
            cache          = app.app.cache,
            currentVersion = cache.getItem('version'),
            serverVersion  = xhr.getResponseHeader('x-version');

        if(cache.getItem('forceReload') == 'true') {
            cache.setItem('forceReload', 'false');
            window.location = '/';
            window.location.reload();
        }
        // if current version is old, clear cache and reload page
        if (!currentVersion) {
            cache.setItem('version', serverVersion);
            app.app.version = serverVersion;
        }
        else if (serverVersion && (currentVersion !== serverVersion)) {
            cache.clear();
            localStorage.clear();
            cache.setItem('forceReload', 'true'); // Don't ask why cache is checking if value is a string
            window.location.reload();
        }
    },
    getRequests: function (responses, uid){
        // ToDo this function needs to go away
        var pendingRequests = app.adapter.pendingRequests,
            result          = [];

        return [pendingRequests[0]]; // Hack for not aip-backend
        /*if (!(responses instanceof Array)) {
            responses = [responses];
        }

        for (var responseIndex in responses) {
            if (responses.hasOwnProperty(responseIndex)) {
                var response = responses[responseIndex];
                var found    = false;
                for (var pendingRequestIndex in pendingRequests) {
                    if (pendingRequests.hasOwnProperty(pendingRequestIndex)) {
                        var pendingRequest = pendingRequests[pendingRequestIndex];
                        if (!pendingRequest.done && pendingRequest.id == uid) {
                            result.push(pendingRequest);
                            found = true;
                            break;
                        }
                    }
                }
                if(!found) {
                    if(response.status !== 200) {
                        if(response.status == 401) {
                            app.app.build('ion-login', false, 'x');
                        }
                    }
                }
            }
        }

        if (result.length === 0) {
            console.error('no fitting requests were found');
        }

        return result;*/
    },

    disperse: function (data) {
        var result = [];
        for (var deviceIndex in data) {
            if (data.hasOwnProperty(deviceIndex)) {
                var device = data[deviceIndex];
                for (var controllerIndex in device) {
                    if (device.hasOwnProperty(controllerIndex)) {
                        var controller = device[controllerIndex];
                        for (var actionIndex in controller) {
                            if (controller.hasOwnProperty(actionIndex)) {
                                result.push(controller[actionIndex]);
                            }
                        }
                    }
                }
            }
        }

        return result;
    },
    recordAll: function(type) {
        this.record([type + '-*']);
    },
    record: function(types) {
        this.recordTypes = types;
        this.records = [];
    },
    getRecords: function() {
        for(var index in this.records) {
            if(this.records.hasOwnProperty(index)) {
                var record = this.records[index];
                var time = record.date.getHours() + ':' + record.date.getMinutes() + ':' + record.date.getSeconds();
                console.log(time + ' ' + record.request.controller + '-' + record.request.action, record.response, record.request.payload);
            }
        }
    },
    stopRecords: function() {
        this.recordTypes = null;
    },
    pushRecord: function(req, resp) {
        if(this.recordTypes) {
            for(var index in this.recordTypes) {
                if(this.recordTypes.hasOwnProperty(index)) {
                    var typeParts = this.recordTypes[index].split('-');
                    if(req.controller == typeParts[0] && (req.action == typeParts[1] || typeParts[1] == '*')) {
                        var record = {date: new Date(), response: resp, request: req};
                        this.records.push(record);
                        continue;
                    }
                }
            }
        }
    },
    handlePromise: function(promise, type) {
        if(promise) {
            try {
                if(type == 'resolve') {
                    promise.resolve(promise.handle);
                } else if (type == 'reject'){
                    promise.reject(promise.handle);
                } else{
                    console.error('Did not now type ', type);
                }
            } catch(err) {
                console.error('There was an exception on promisehandling', err);
            }
        }
    },
    getCacheKey: function(request) {
        return 'request.' + request.controller + '.' + request.action;
    },
    hasCache: function(request) {
        var key = this.getCacheKey(request);
        return app.app.cache.hasItem(key);
    },
    getCache: function(request) {
        var key  = this.getCacheKey(request);
        var data = app.app.cache.getItem(key);
        return JSON.parse(data);
    },
    handleCache: function(data, request) {
        if(request.cache) {
            var key = this.getCacheKey(request);
            app.app.cache.setItem(key, JSON.stringify(data));
        }
    }
};}

var app = app || {};

app.apiAdapter = {
    token: app.cookie.get({cname: 'usertoken'}),
    defaultToken: '73r253jcb1p3e423h3vptngr6qqpt',
    url: window.location.origin+'/api/ion-u',

    //API for new back-end

    /////////////////////////////////////////
    // Authorisation Handling
    ////////////////////////////////////////
    checkLogin: function(successCallback, errorCallback) {
        var url  = window.location.origin+'/auth/currentuser';
        $.ajax ({
            type: "GET",
            url: url,
            async: true,
            //json object to sent to the authentication url
            data: {}, 
            success: successCallback,
            error: errorCallback
        });
    },

    login: function(data, successCallback, errorCallback) {
        var url  = window.location.origin+'/auth/login';
        $.ajax ({
            type: "POST",
            url: url,
            dataType: 'json',
            //json object to sent to the authentication url
            data: data, 
            success: successCallback,
            error: errorCallback
        });
    },

    logout: function(successCallback, errorCallback) {
        var url  = window.location.origin+'/auth/logout';
        $.ajax ({
            type: "GET",
            url: url,
            dataType: 'json',
            //json object to sent to the authentication url
            data: {}, 
            success: successCallback,
            error: errorCallback
        });
    },

    getCurrentUser: function(successCallback, errorCallback) {
        var url  = window.location.origin+'/auth/currentuser';
        $.ajax ({
            type: "GET",
            url: url,
            async: true,
            //json object to sent to the authentication url
            data: {}, 
            success: successCallback,
            error: errorCallback
        });
    },



    /////////////////////////////////////////
    // Usermanagement Handling
    ////////////////////////////////////////
    getUserList: function(successCallback, errorCallback) {
        var url  = window.location.origin+'/auth/user?token='+this.defaultToken;
        $.ajax ({
            type: "GET",
            url: url,
            async: true,
            //json object to sent to the authentication url
            data: {}, 
            success: successCallback,
            error: errorCallback
        });
    },

    deleteUser: function(username, successCallback, errorCallback) {
        var url  = window.location.origin+'/auth/user/'+username+'?token='+this.defaultToken;
        $.ajax ({
            type: "DELETE",
            url: url,
            async: true,
            //json object to sent to the authentication url
            data: {}, 
            success: successCallback,
            error: errorCallback
        });
    },

    updateUser: function(obj, successCallback, errorCallback) {
        var url  = window.location.origin+'/auth/user/'+obj.username+'?token='+this.defaultToken;
        $.ajax ({
            type: "PUT",
            url: url,
            async: true,
            //json object to sent to the authentication url
            data: obj, 
            success: successCallback,
            error: errorCallback
        });
    },

    allowUser: function(obj, successCallback, errorCallback) {
        var url  = window.location.origin+'/auth/allow';
        $.ajax ({
            type: "POST",
            url: url,
            async: true,
            //json object to sent to the authentication url
            data: obj, 
            success: successCallback,
            error: errorCallback
        });
    },

    forbidUser: function(obj, successCallback, errorCallback) {
        var url  = window.location.origin+'/auth/forbid';
        $.ajax ({
            type: "POST",
            url: url,
            async: true,
            //json object to sent to the authentication url
            data: obj, 
            success: successCallback,
            error: errorCallback
        });
    },

    addUser: function(data, successCallback, errorCallback) {
        var url  = window.location.origin+'/auth/user?token='+this.defaultToken;
        $.ajax ({
            type: "POST",
            url: url,
            async: true,
            //json object to sent to the authentication url
            data: data, 
            success: successCallback,
            error: errorCallback
        });
    },


    /////////////////////////////////////////
    // ProjectManagement Handling
    ////////////////////////////////////////
    getProjectData: function(name, successCallback, errorCallback) {
        var url  = window.location.origin+'/api/project/'+name;
        $.ajax ({
            type: "GET",
            url: url,
            async: true,
            //json object to sent to the authentication url
            data: {}, 
            success: successCallback,
            error: errorCallback
        });

    },

    createProject: function(name, successCallback, errorCallback) {
        var url  = window.location.origin+'/api/'+name;
        $.ajax ({
            type: "PUT",
            url: url,
            async: true,
            //json object to sent to the authentication url
            data: {}, 
            success: successCallback,
            error: errorCallback
        });
    },

    alterProject: function(name, color, successCallback, errorCallback) {
        var url  = window.location.origin+'/api/'+name;
        $.ajax ({
            type: "PUT",
            url: url,
            async: true,
            //json object to sent to the authentication url
            data: {}, 
            success: successCallback,
            error: errorCallback
        });
    },

    deleteProject: function(name, successCallback, errorCallback) {
        var url  = window.location.origin+'/api/'+name;
        $.ajax ({
            type: "DELETE",
            url: url,
            async: true,
            //json object to sent to the authentication url
            data: {}, 
            success: successCallback,
            error: errorCallback
        });
    },


    /////////////////////////////////////////
    // Translation and Key Handling
    ////////////////////////////////////////
    putLocale: function(key, locale, data, cb, ecb) {
        var url  = this.url+'/translation/'+key+'/'+locale+'?token='+this.defaultToken;
        $.ajax ({
            type: "PUT",
            url: url,
            async: true,
            //json object to sent to the authentication url
            data: data, 
            success: cb,
            error: ecb,
        });
        //$.get("http://localhost:3000/api/ion-u", cb);
    },

    postData: function(cb) {
        var str  = window.location.origin;
        var url  = this.url+'';
        $.ajax ({
            type: "POST",
            url: url,
            dataType: 'json',
            async: true,
            //json object to sent to the authentication url
            data: {
            }, 
            success: cb
        });
        //$.get("http://localhost:3000/api/ion-u", cb);
    },

    deleteKey: function(key, locales, cb) {
        for(var i in locales) {
            var url  = this.url+'/translation/'+key+'/'+locales[i]+'?token='+this.defaultToken;
            $.ajax ({
                type: "DELETE",
                url: url,
                dataType: 'json',
                async: true,
                //json object to sent to the authentication url
                data: {
                }, 
                success: cb
            });
        }
        //$.get("http://localhost:3000/api/ion-u", cb);
    },

    getData: function(successCallback, errorCallback) {
        this.token = app.cookie.get({cname: 'usertoken'})
        var url    = this.url+'?token='+this.defaultToken;
        //$.get(url, successCallback, errorCallback);
        $.ajax ({
            type: "GET",
            url: url,
            async: true,
            //json object to sent to the authentication url
            data: {
            }, 
            success: successCallback,
            error: errorCallback
        });
    },


    /////////////////////////////////////////
    // Token Handling
    ////////////////////////////////////////
    generateAuthToken: function(successCallback) {
        var url  = window.location.origin+'/auth/token';
        $.get(url, successCallback);
    },


    /////////////////////////////////////////
    // File Handling
    ////////////////////////////////////////
    uploadFile: function(locale, fileData, successCallback, errorCallback) {
        var url  = this.url+'/file/'+locale+'?token='+this.defaultToken;
        $.ajax ({
            type: "PUT",
            url: url,
            dataType: 'json',
            //json object to sent to the authentication url
            data: fileData, 
            success: successCallback,
            error: errorCallback
        });
    },

};
/*global Persist:false, log:false, Debug:false*/
/*jshint smarttabs:true*/

/**
 * @module Library
 */

/**
 * cache class
 *
 * wrapper for html5 and gears caching
 *
 * @class Cache
 */
app.Cache = {
    cache: false,
    /**
     * initialize cache
     *
     * check for html5 storage implementation or gears support
     * and initialize the selected cache
     *
     * @method init
     */
    init: function () {
        if (Config.Debug.ignoreCache) {
            console.log('local storage or gears cache ignored for debugging!');
            return;
        }
        this.cache = new Persist.Store('CommScope ION');
    },

    /**
     * checks if html5-cache is active
     *
     * @method isActive
     * @return {Boolean}  true if html5-cache is active
     */
    isActive: function () {
        return typeof this.cache === 'object';
    },

    /**
     * add an item to the cache
     *
     * @method setItem
     * @param  {String} key    key to reference the stored value
     * @param  {String} value  value to store in the cache
     */
    setItem: function (key, value) {
        if (typeof key !== 'string' || typeof value !== 'string') {
            return false;
        }

        if (this.isActive()) {
            this.cache.set(key, value);
        }

        return true;
    },

    /**
     * check for item existence in the cache
     *
     * @method hasItem
     * @param  {String} key  key to search for
     * @return {Boolean}     true if an item is found
     */
    hasItem: function (key) {
        return this.getItem(key) !== false;
    },

    /**
     * gets an item from the cache
     *
     * @method getItem
     * @param  {String} key  key to search for
     * @return {String}      stored value, if found. otherwise false
     */
    getItem: function (key) {
        var waiting = true, result = false, cache = this.cache;

        if (this.isActive()) {
            var callback = function (ok, val) {
                if (ok && typeof val === 'string') {
                    result = val;
                }
                waiting = false;
            };

            // wait for the function to finish (asynchron to synchron)
            while (waiting) {
                cache.get(key, callback);
            }

            return result;
        }

        return false;
    },

    /**
     * removes an item from the cache
     *
     * @method removeItem
     * @param  {String}   key  key to search for
     * @return {Boolean}
     */
    removeItem: function (key) {
        if (typeof key !== 'string') {
            return false;
        }

        if (this.isActive()) {
            this.cache.remove(key);
        }

        return true;
    },

    clear: function () {
        if (this.isActive()) {
            this.cache.flush();
        }
    }
};

app.Controller = app.Controller || {};

app.Controller.Base = {
    __error: function (msg, evt, target) {
        // TODO default
        // app.app.error();
    },

    __success: function (msg, evt, target) {
        // TODO default
        // app.app.success();
    }
};

// app.Controller.Base = app._merge(app.Controller.Base);

/**
 * Basic constructor for controllers
 *
 * @param {[string]} [namespace] [module name followed by controller name and joined with a "-"]
 * @param {[object]} [object] [the controller code as an object]
 */

app.Controller = function (namespace, controller) {
	if(app.controllerHelper.list[namespace]) {
		// console.error('The controller ' + namespace + ' is already loaded! - robably there is another one with the same name');
		return;
	}

	controller = controller || {};
	app.controllerHelper.last = namespace;

	// TODO FIXME merge init methods?
	if(!app.app.cache) {
		app.app.cache = app.Cache;
	}
	app._merge(controller, app.Controller.Base, {
		locale: app.app.cache.getItem('curLocale'),
		_requests: [],
		_render: function (content, force, noRegs) {
			if(this._preventRender && !force) { // Should only be used, if realy needed (subscription pause)
				console.log('There was an attempt to render, but _preventRender was set');
			} else if(!content) {
				console.error('You forgot to deliver a content');
			}else if (this.content.checksum != content.checksum || !content.checksum || force === true) {
				if(app.controllerHelper.debugRender) debugger;
				content.template = content.template || this.content.template;
				content.module   = content.module || this.content.module;

				this._getKeeps();
				this.content       = content;
				if(!noRegs) {
					this._addReg();
				} else {
					this._regs = {};
				}
				var module         = content.module,
					result         = app.viewHelper.compileTemplates(module, _.clone(content)),
					templateResult = app.controllerHelper.transform(result.template),
					target         = this.view.obj('root');

				app.controllerHelper.remove(target);
				target.replaceWith(templateResult);
				this.uid = result.uid; // Updating the uid is not needed with shadowdom

				for(var index in runloop.jobs) {
					if(runloop.jobs.hasOwnProperty(index) && runloop.jobs[index].uid == this.uid) {
						runloop.jobs[index].uid = result.uid;
					}
				}

				this._templateResult = templateResult;



				this._notify();

				var todo = {controllerResult: content};

				this._setKeeps();

				for (var stackIndex in result.stack) {
					if (result.stack.hasOwnProperty(stackIndex) && !result.stack[stackIndex].noCreate) {
						var stack  = result.stack[stackIndex];
						if (result.stack[stackIndex].module) {
							todo.name = stack.module + '-' + stack.identifier;
						}
						else {
							todo.name = content.module + '-' + stack.identifier;
						}

						var identifier = stack.module;
						if (stack.module != stack.identifier) {
							identifier = stack.module + '-' + stack.identifier;
						}


						if(app.viewHelper.get(stack.uid, true).length > 0) {
							var newContent = _.clone(content);
							delete newContent.reload_every;
							app.controllerHelper.createAnon(identifier, todo, stack, newContent);
						} else if(app.controllerHelper.list[identifier] || app.viewHelper.list[identifier]){
							console.warn(identifier + ' had no representation in dom -> not instanciated.');
						}
					}
				}

				app.viewHelper.executeAnchors();
			}

			return this;
		},
		_rerender: function() {
			this._render(this.content, true, true);
		},
		_addReg: function() {
			for(var index in this._regs) {
				if(this._regs.hasOwnProperty(index)) {
					this._set(index, this._regs[index], true);
				}
			}
		},
		_reg: function(key, value) {
			if(!this._regs) {
				this._regs = {};
			}

			this._regs[key] = value;
			this._unreg(key, true); // When parent is set, children should not be registered
		},
		_unreg: function(key, onlyChilds) {
			if(this._regs)
				for(var index in this._regs) {
					if(this._regs.hasOwnProperty(index)) {
						var keyDot = key + '.';
						if((index == key  && !onlyChilds)|| index.search(keyDot) === 0) {
							delete this._regs[index];
						}
					}
				}

		},
		_getKeeps: function() {
			this._keeps = [];
			var self = this;
			this.view.obj('root').find('[data-keep]').each(function() {
				var obj   = $(this);
				var keep  = obj.data('keep').split(':');
				if(keep.length == 2) {
					var value = obj.attr(keep[0]);
					self._keeps.push({key: keep[1], value: value, type: keep[0]});
				}
			});
		},
		_setKeeps: function() {
			for(var i = 0; i < this._keeps.length; i++) {
				var keep = this._keeps[i];
				var obj = $('[data-keep="' + keep.type + ':' + keep.key + '"]');
				obj.attr(keep.type, keep.value);
			}
		},
		push: function(key, value, once) {
			var keyParts = key.split('.');
			var lastkey  = keyParts[keyParts.length - 1];
			var path     = this._getPath(keyParts);

			if(!path[lastkey]) {
				console.info(key + ' did not exist, so I created it for you');
				path[lastkey] = [];
			}

			if(!once || path[lastkey].indexOf(value) === -1) {
				path[lastkey].push(value);
				this._reg(key, path[lastkey]);
				if(app.viewHelper.dirtyHandling) {
					this.view._dirty = true;
				} else {
					this._render(this.content, true);
				}
				return true;
			} else {
				return false;
			}
			
		},
		pushOnce: function(key, value) {
			return this.push(key, value, true);
		},
		unset: function(key, value) {
			var keyParts = key.split('.');
			var lastkey  = keyParts[keyParts.length - 1];
			var path     = this._getPath(keyParts);

			if(!value) {
				this._unreg(key);
				if(path[lastkey] !== undefined) {
					delete path[lastkey];
					if(app.viewHelper.dirtyHandling) {
						this.view._dirty = true;
					} else {
						this._render(this.content, true);
					}
				}
			} else {
				if(path[lastkey][value] !== undefined) {
					delete path[lastkey][value];
					if(app.viewHelper.dirtyHandling) {
						this.view._dirty = true;
					} else {
						this._render(this.content, true);
					}
				}
			}

		},
		set: function(key, value) {
			return this._set(key, value);
		},
		_set: function(key, value, noRender) { // noRender is private, should only be used by regs

			if(value === undefined) {
				console.info('your value for ' + key + ' was undefined, better use null');
			}
			this._reg(key, value);
			var keyParts = key.split('.');
			var lastkey  = keyParts[keyParts.length - 1];
			var path     = this._getPath(keyParts);

			if(!_.isEqual(path[lastkey], value)) {
				path[lastkey] = value;
				if(!noRender) {
					if(app.viewHelper.dirtyHandling) {
						this.view._dirty = true;
					} else {
						this._render(this.content, true);
					}
					return true;
				}
			}

			return false;
		},
		get: function(key) {
			var keyParts = key.split('.');
			var lastkey  = keyParts[keyParts.length - 1];
			return this._getPath(keyParts)[lastkey];
		},
		setAll: function(content) {
			this._regs = {};
			this.content = content;
			this._rerender();
		},
		getAll: function() {
			return this.content;
		},
		_getPath: function(keyParts) {
			var content = this.content;
			for(var i = 0; i < keyParts.length; i++) {
				var part = keyParts[i];

				if(i == keyParts.length - 1) {
					return content; // sadly i cant return the property-value itself, reference would get lost
				}

				if(!content[part] && i + 1 < keyParts.length) { // @TODO Check for sideeffects -> === undefined was it before
					content[part] = {};
					content = content[part];
					console.info(keyParts.slice(0, i + 1).join('.') + ' did not exist, so I created it for you');
				} else {
					content = content[part];
				}
			}
		},
		_notify: function () {
			if (this.notify) {
				this.notify();
			}
			if (this.view && this.view.notify) {
				this.view.notify();
			}

			return this;
		},

		fetch: function (opt, errorCallback, target, promise) {
			if(!this.name) {
				throw 'controller.name needs to be set: controllerName-actionName';
			}
			var parts = this.name.split('-'),
				self  = this;
			if(this.model) {
				parts = [this.model.controller, this.model.action];
			}

			app.adapter.add({
				device: app.app.stateManager.getDevice(),
				controller: parts[0],
				action: parts[1],
				payload: opt,
				promise: promise,
				callback: function (res) {
					self._render(res);
				},
				errorCallback: errorCallback
			});

			return this;
		},
		triggerParents: function(eventName, payload) {
			var uids = app.viewHelper.getUids(this.view.obj('root'));
			var controllers = app.controllerHelper.get(uids);
			var evt      = {pseudo: true, type: eventName, data: payload};
			return app.viewHelper.handleEvent(evt, controllers);
		},
		triggerChildren: function(eventName, payload) {
			var children = this._getChildren();
			var evt      = {pseudo: true, type: eventName, data: payload};
			return app.viewHelper.handleEvent(evt, children);
		},
		triggerSiblings: function(eventName, payload) {
			var siblings = this._getSiblings();
			var evt      = {pseudo: true, type: eventName, data: payload};
			return app.viewHelper.handleEvent(evt, siblings);
		},
		_getChildren: function() {
			return this._getElements();
		},
		_getSiblings: function() {
			return this._getElements(true);
		},
		_getElements: function(siblings) {
			var result = [];
			var doms = null;
			if(siblings) {
				doms = this.view.obj('root').siblings('[data-uid]');
			} else {
				doms = this.view.obj('root').find('[data-uid]');
			}
			doms.each(function() {
				var controllers = app.controllerHelper.get($(this).data('uid'));
				for(var i = 0; i < controllers.length; i++) {
					result.push(controllers[i]);
				}
			});
			return result;
		},
		_reloadHandler: function (res, req) {
			this._render(res);
		},
		send: function(opt) {
			if(app.adapter.checkValidity(opt, true)) {
				opt.callbackName      = opt.callback;
				opt.errorCallbackName = opt.errorCallback;
				opt.callback          = app.controllerHelper.handleAdapterCallback;
				opt.errorCallback     = app.controllerHelper.handleErrorAdapterCallback;
				app.adapter.add(opt, true);
				this._requests        = _.clone(this._requests); // Dont ask my why, its the only element which is an reference
				this._requests.push(opt);
			}
		},
		subscribe: function(opt) {
			opt.subscribe = true;
			this.send(opt);
		}
	});

	if(!controller._serialize) { // @FIXME the child should not be overwritten by parent
		controller._serialize =  function() {
			return {
				content: this.content,
				uid: this.uid,
				namespace: this.namespace,
				regs: this._regs,
				events: this.view.events
			};
		};
	}

	app.__controllers = app.__controllers || {};
	app.__controllers[namespace] = controller;

	if (namespace != 'pseudo') {
		app.controllerHelper.add(namespace, controller);
	}

	return controller;
};

app.controllerHelper = {
    list: {},
    todo: {},
    preloaded: false,
    init: function () {
        this.anons = [];
    },

    add: function (namespace, object) {
        this.__prepare(namespace, object);
        this.list[namespace] = object;

        var parts = namespace.split('-');
        return this;
    },
    checkTodos: function() {
        for(var module in this.todo) {
            if(this.todo.hasOwnProperty(module)) {
                for(var i = 0; i < this.todo[module].length; i++) {
                    var todo = this.todo[module][i];
                    if(!todo.done && app.module.moduleFinished(module)) {
                        todo.done = true;
                        this.create(module, todo);
                    }

                }
            }
        }
    },
    get: function (uids, namespace, onlyAnons) {
        uids = _.isArray(uids) ? uids : [uids];
        var result = [];
        return this.iterate(app.controllerHelper.anons, uids, false, namespace);
    },
    getFromDom: function (selector, first) {
        var uid         = $(selector).closest('[data-uid]').data('uid');
        var controllers = this.get(uid);
        var index       = null;
        if(first) {
            index = 0;
        } else {
            index = controllers.length - 1;
        }

        return controllers[index];
    },
    getFromName: function (namespace, onlyANons) {
        return this.get('*', namespace, onlyANons);
    },
    getUids: function(controllers) {
        return this.getValue(controllers, 'uid');
    },
    serializeAll: function() {
        return this.serialize(this.get('*'));
    },
    serialize: function(controllers) {
        return this.getValue(controllers, '_serialize');
    },
    getValue: function(controllers, property, key) {
        var result = [];
        if(key) {
            result = {};
        }
        
        for(var index in controllers) {
            if(controllers.hasOwnProperty(index)) {
                var content = null;
                if(_.isFunction(controllers[index][property])) {
                    content = controllers[index][property]();
                } else {
                    content = controllers[index][property];
                }
                if(key) {
                    result[controllers[index][key]] = content;
                } else {
                    result.push(content);
                }
                
            }
        }

        return result;
    },
    iterate: function (space, uids, invert, namespace) {
        var result = [];
        for (var index in space) {
            if (space[index] && space[index].uid !== undefined) {
                if (uids[0] == '*' || (uids.indexOf(space[index].uid) !== -1 && !invert) || (uids.indexOf(space[index].uid) === -1 && invert)) {
                    if(!namespace || (namespace == space[index].namespace)) {
                        result.push(space[index]);
                    }
                }
                if (invert) {
                    app.adapter.unsubscribe({uid: space[index].uid});
                    if (space[index].destroy) {
                        space[index].destroy();
                    }
                    if (space[index].view && space[index].view.destroy) {
                        space[index].view.destroy();
                    }
                    delete space[index];
                }
            }
        }

        return result;
    },

    __prepare: function (namespace, controller) {
        if (controller) {
            controller.namespace = namespace;
            controller.trigger   = this.trigger;
        }
        return controller;
    },

    trigger: function (name, message) {
        return app.viewHelper.handleEvent({
            type:   name || 'noop',
            data:   message,
            pseudo: true,
            target: $('[data-uid]')[0]
        });
    },

    addTodo: function (object) {
        // ToDo handling of this needs refactoring --- ergant
        var module = object.modules[0];
        if(this.todo[module] === undefined) {
            this.todo[module] = [];
        }

        this.todo[module].push(object);
        this.checkTodos();
    },
    preprocess: function(namespace, todo) {
        var template = todo.template || todo.controllerResult.template.toLowerCase();
        var ident = namespace + '-' + this.transformName(template);
        if(this.list[ident] && this.list[ident].preprocess) {
            todo.controllerResult = this.list[ident].preprocess(todo.controllerResult);
        }
        return todo.controllerResult;
    },
    create: function (namespace, todo, cb) {
        // @TODO needs refactoring and move to Controller.render()

        todo.controllerResult = this.preprocess(namespace, todo);

        var template       = todo.template || todo.controllerResult.template.toLowerCase(),
            result         = app.viewHelper.compileTemplates(todo.module, _.clone(todo.controllerResult), _.clone(todo.controllerResult)),
            templateResult = this.transform(result.template),
            target         = todo.dom || $('[data-controller=' + todo.name + ']');
        app.controllerHelper.remove(target);

        var previousUid = null;
        if(todo.ignoreWrap) {
            if(todo.dom) { // Needed for keeping the uid
                //previousUid = vood.shadowdom.getUid(todo.dom);
            }
            target.replaceWith(templateResult);
            if(previousUid /*&& vood.shadowdom.active*/) {
                if(previousUid != result.uid) {
                    var obj = $(app.viewHelper.get(result.uid)[0]);
                    result.uid = previousUid;
                    obj.attr('data-uid', result.uid);
                }
            }
        } else {
            target.html(templateResult);
        }

        // @TODO all controllers should be anons - nothing should be in namespace anymore
        if (!app[namespace]) {
            if (this.list[namespace]) {
                app[namespace] = this.list[namespace];
            }
            else {
                app[namespace] = app.Controller('pseudo', {pseudo: true});
                // console.log(namespace + ' controller not found');
            }

            app[namespace].uid       = result.uid; // When the object is an anchor, it should keep his uid
            app[namespace].content   = todo.controllerResult;
            app[namespace].name      = _.clone(todo.name);
            app[namespace].namespace = namespace;
            app[namespace].view      = app.viewHelper.create(namespace);
            app[namespace]._templateResult = templateResult.template;


            if (app[namespace].view) {
                app[namespace].view.controller = app[namespace];
            }


            if (app[namespace].init) {
                app.safeTrigger(app[namespace], 'init', function(err) {
                    console.error('Init of controller ' + namespace + ' failed');
                    console.error(err.message);
                });
            }

        }
        else if(!todo.ignoreWrap){
            app[namespace].uid = _.clone(result.uid); // is this line realy needed? :X
        }


        this.createAnon(
            namespace + '-' + this.transformName(template),
            todo,
            result,
            todo.controllerResult
        );


        for (var stackIndex in result.stack) {
            if (result.stack.hasOwnProperty(stackIndex)) {
                var stack  = result.stack[stackIndex];
                var naming = stack.module + '-' + stack.identifier;
                if(app.viewHelper.get(stack.uid, true).length > 0) {
                    app.controllerHelper.createAnon(
                        stack.module + '-' + stack.identifier,
                        stack.content,
                        stack
                    );
                } else if(app.controllerHelper.list[naming] || app.viewHelper.list[naming]){
                    console.warn(naming + ' had no representation in dom -> not instanciated');
                }
            }
        }

        app.viewHelper.executeAnchors();

        if (_.isFunction (cb)) {
            cb(todo);
        }
        return app[namespace];
    },

    createAnon: function (ident, todo, renderResult, content) {
        var view       = app.viewHelper.create(ident),
            index      = renderResult.uid,
            controller = null;

        if (this.list[ident]) {
            controller = this.__prepare(ident, _.clone(this.list[ident]));

            index      = this.anons.push(controller);
            index--;
        }
        else {
            controller = app.Controller('pseudo', {ident: ident, pseudo: true});
            index      = this.anons.push(this.__prepare(ident, controller));
            index--;
            
            console.log(ident + ' controller not found');
        }

        controller.uid       = renderResult.uid;
        controller._templateResult = renderResult.template;
        controller.content   = todo.controllerResult;
        controller.name      = todo.name;
        controller.view      = view;

        if (content && content.reload_every) {
            // @TODO Will not work if maincontroller has in its init an set()
            this.addSubscription(this.anons[index], todo);
        }

        if (controller.view) {
            controller.view.controller = controller;
            if (this.anons[index].view.init) {
                app.safeTrigger(this.anons[index].view, 'init', function(err) {
                    console.error('Init of view ' + namespace + ' failed');
                    console.error(err.message);
                });
            }
        }

        if (this.anons[index].init) {
            // try {
                this.anons[index].init();
            // } catch(err) {
            //  console.error('Init of controller ' + ident + ' failed', err.message);
            // }
        }
    },
    addSubscription: function(controller, todo) {
        var content        = controller.content,
            clearEvents    = content.stop_reload_on ? content.stop_reload_on.split(' ') : null,
            parts          = todo.name.split('-'),
            controllerName = parts[0],
            actionName     = parts[1],
            device         = todo.device;

        if(controller.model) {
            controllerName = controller.model.controller;
            actionName     = controller.model.action;
        }

        try{
            controller._refresh = true;
            app.adapter.subscribe({
                device: todo.device,
                controller: controllerName,
                action: actionName,
                uid: controller.uid,
                callback: this.reloadHandler,
                clearEvents: clearEvents,
                interval: content.reload_every * 20
            }, controller);
        } catch(err){
            console.error('subscribing failed');
            console.log(err);
        }
    },
    reloadHandler: function (res, req) {
        var controllers = app.controllerHelper.get(req.job.uid);
        var found       = false;

        for (var i = controllers.length - 1; i >= 0; i--) {
            var controller = controllers[i];
            if (controller._refresh) {
                controller._render(res);
                found = true;
            }
        }

        if(!found) {
            console.error('There was no controller found to refresh', req.job);
            req.job.remove();
        }
    },

    transformName: function (template) {
        var transform = '',
            upper     = false;

        template = template.toLowerCase();
        for (var index in template) {
            if (template.hasOwnProperty(index)) {
                var character = template[index];
                if (character == '-') {
                    upper = true;
                } else if (character == '_') {
                    upper = true;
                }
                else if (upper) {
                    transform += character.toUpperCase();
                    upper = false;
                }
                else {
                    transform += character;
                }
            }
        }

        return transform;
    },

    transform: function (value) {
        var types = ['translate', 'date', 'time'];
        for(var index = 0; index < types.length; index++) {
            // ToDo remove this loop, its only a temporary fix, until server doesn't send translate: by itself anymore
            for(var v = 0; v < 2; v++) { // when translate:translate:foo.bar it works as well

                var pos = null,
                    key = types[index],
                    re = new RegExp(key + '\\:[\\w\\.\\_]+', 'g'),
                    founds = value.match(re);

                if (founds && founds.length > 0) {
                    for (var i = 0; i < founds.length; i++) {
                        var foundKey       = founds[i],
                            transformValue = null;

                        if(key == 'translate') {
                            transformValue = app.app.t(foundKey.replace(key + ':', ''));
                        } else if(key == 'date') {
                            transformValue = app.time.getDate(foundKey.replace(key + ':', ''));
                        } else if(key == 'time') {
                            transformValue = app.time.getTime(foundKey.replace(key + ':', ''));
                        }


                        value = value.replace(foundKey, transformValue);
                    }
                } else {
                    break;
                }
            }
        }
        return value;
    },
    updateTemplateUid: function(templateResult, previousUid, uid) {
        templateResult = templateResult.replace('data-uid="' + uid + '"', 'data-uid="' + previousUid + '"');
        return templateResult.replace('data-anchor="' + uid + '"', 'data-anchor="' + previousUid + '"');
    },
    updateCheck: function () {
        $('[class^="fill_"]').each(function () {
            var name = $(this).attr('class').replace('fill_', '');
            var payload = app.viewHelper.getAttributes($(this));
            $(this).attr({
                "class": '',
                "data-controller": name
            });

            app.module.load({
                name: name,
                translation: false,
                device: app.app.stateManager.getDevice(),
                payload: payload,
                dom: $(this)
            });
        });
    },
    garbageCollecter: function() {
        // ToDo don't use this function - experimental
        var uids = app.controllerHelper.getUids(app.controllerHelper.get('*', undefined, true));
        var garbage = [];
        for(var i = 0; i < uids.length; i++) {
            if(!app.viewHelper.get(uids[i])[0]) {
                garbage.push(uids[i]);
            }
        }

        if(garbage.length > 0) {
            console.log('Deleted garbage', garbage);
            for(var uidIndex = 0; uidIndex < garbage.length; uidIndex++) {
                app.adapter.unsubscribe({uid: garbage[uidIndex]});
            }
            app.controllerHelper.anons = app.controllerHelper.iterate(app.controllerHelper.anons, garbage, true);
        }
    },
    preloadAll: function() {
        // @TODO make it good - currently only experimental
        if(!this.preloaded) {
            this.preloaded = true;
            var modules = ['system', 'alarms', 'widget', 'maintenance', 'device'];
            this.preload(modules);
        }
    },
    preload: function(modules) {
        var current = modules.shift();
        if(current) {
            app.module.add({module: current, todo: modules, callback: function(res) {
                app.controllerHelper.preload(res.todo);
            }});
        }
    },
    remove: function (target, myself) {
        var uids = [];
        target.find('[data-uid]').each(function () {
            uids.push(window.parseInt($(this).attr('data-uid')));
        });

        if(myself && target.data('uid')) {
            uids.push(target.data('uid'));
        }

        if(uids.length > 0){
            for(var index = 0; index < uids.length; index++) {
                app.adapter.unsubscribe({uid: uids[index]}, true);
            }
            app.controllerHelper.anons = app.controllerHelper.iterate(app.controllerHelper.anons, uids, true);
        }
    },
    removeUids : function(uids) {
        for(var i = 0; i < uids.length; i++) {
            var uid = uids[i];
            if(this.anons[uid]) {
                if(this.anons[uid].destroy) {
                    this.anons[uid].destroy();
                }
                if(this.anons[uid].view.destroy) {
                    this.anons[uid].view.destroy();
                }
                app.adapter.unsubscribe({uid: this.anons[uid].uid});

                delete this.anons[uid];
            } else {
                console.info('Could not delete controller', uid);
            }
        }
    },
    activateRenderDebugging: function() {
        app.viewHelper.dirtyHandling = false;
        this.debugRender = true;
    },
    getRequestController: function(req) {
        var controllers = this.get('*');
        for(var i = 0; i < controllers.length; i++) {
            var controller = controllers[i];
            for(var requestIndex = 0; requestIndex < controller._requests.length; requestIndex++) {
                var request = controller._requests[requestIndex];
                if(request.id == req.id) {
                    return {controller: controller, request: request};
                }
            }
        }
    },
    removeFinished: function(obj, property) {
        var result = [];
        for(var index in obj[property]) {
            if(obj[property].hasOwnProperty(index) && !obj[property][index].finished) {
                result.push(obj[property][index]);
            }
        }

        obj[property] = result;
    },
    triggerAdapterCallback: function(type, result, request) {
        var found = this.getRequestController(request);
        if(found) {
            var callback = found.request[type];
            if(!callback) {
                console.error('There was no ' + type + ' defined');
            } else if(found.controller[callback]) {
                found.request.finished = true;
                found.controller[callback](result, request);
            } else {
                console.error('The function' + callback + ' is not defined at ' + controller.name);
            }
            this.removeFinished(found.controller, '_requests');
        } else {
            console.error('Could not find controller of request', result, request);
        }
    },
    handleAdapterCallback: function(result, request) {
        app.controllerHelper.triggerAdapterCallback('callbackName', result, request);
    },
    handleErrorAdapterCallback: function(code, result, xhr, request) {
        app.controllerHelper.triggerAdapterCallback('errorCallbackName', result, request);
    }
};

app.dataexport = {

    strDelimiter : ';',
    filterRows: [],

    getCurrentDateStr: function() {
        var today = new Date();
        var dd    = today.getDate();
        var mm    = today.getMonth()+1; //January is 0!
        var yyyy  = today.getFullYear();

        if(dd<10) { dd='0'+dd;}
        if(mm<10) { mm='0'+mm;}

        today = yyyy + '_' + mm + '_' + dd;

        return today;
    },

    addRow: function(csvContent, data) {
        if(data instanceof Array) {
            var str = data.join(this.strDelimiter) + '';
            var str2 = str.replace(/ /g, "%20");
            data = '"' + str2 + '"';
            data = data.replace(new RegExp(this.strDelimiter, "g"),'"'+this.strDelimiter+'"');
        } else {
            data = data + '';
            data = data.replace(/ /g, "%20");
        }
        csvContent += data + '%0A';
        return csvContent;
    },

    addRows: function(csvContent, data) {
        var self = this;
        data.forEach(function(infoArray, index){
            csvContent = self.addRow(csvContent, infoArray);
        });

        return csvContent;
    },

    addObjKeys: function(csvContent, data, filter, rename) {
        filter = filter || [];
        rename = rename || {};

        var keys  = [];
        var first = this.getFirst(data);

        if(first !== null) {
            for(var k in first) {
                if(_.contains(filter, k) || filter.length === 0 ) {
                    if(rename.hasOwnProperty(k)) {
                        k = rename[k];
                    }
                    keys.push(k);
                }
            }
            csvContent = this.addRow(csvContent, keys);
        }

        return csvContent;
    },

    addObjParams: function(csvContent, data, filter, prefix) {
        filter = filter || [];
        var value;

        for (var key in data) {
            var obj  = data[key];
            var row  = [];
            for (var prop in obj) {
                if(obj.hasOwnProperty(prop) && typeof(prop) !== 'function') {
                    if(_.contains(filter, prop) || filter.length === 0 ) {
                        value = obj[prop];
                        if(this.__checkIsFloat(value)) {
                            value = this.__fitFloatForExcel(value);
                        }

                        if(prefix && prefix[prop]) {
                            row.push(prefix[prop] + value);
                        } else {
                            row.push(value);
                        }
                    }
                }
            }

            csvContent = this.addRow(csvContent, row);
        }

        return csvContent;
    },

    getFirst: function(obj) {
        var first = null;
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop) && typeof(prop) !== 'function') {
                first = obj[prop];
                break;
            }
        }

        return first;
    },

    download:  function(id, name, csvContent) {
        csvContent = app.controllerHelper.transform(csvContent); // Is needed for translatekeys
        var downloadLink = document.getElementById('#'+id);

        if(downloadLink !== null) downloadLink.parentNode.removeChild(downloadLink);

        downloadLink = document.createElement('a');
        downloadLink.setAttribute("id", id);
        downloadLink.href        = 'data:attachment/csv,' + csvContent;
        downloadLink.target      = '_blank';
        downloadLink.download    = this.getCurrentDateStr() + '_' + name + '.csv';

        document.body.appendChild(downloadLink);
        downloadLink.click();
    },

    __checkIsFloat: function(value) {
        if(value !== null && value !== undefined) {
            if(!isNaN(value) && value.toString().indexOf('.') != -1) {
                return true;
            }
        }

        return false;
    },

    __fitFloatForExcel: function(value) {
        var strValue = value.toString();
        var floatValue = parseFloat(value);

        if(floatValue > 0.0) {
            if( (strValue.length - strValue.indexOf('.')) < 4) {                
                while((strValue.length - strValue.indexOf('.')) < 4) { strValue = strValue + '0';}
                return strValue;
            } else {
                return strValue;
            }
        } else {
            return strValue;
        }
    }
};
/*
 * ION-U web application
 *
 * Copyright (c) 2012, CommScope/webvariants
 */

/*global jQuery:false*/

/**
 * @module Library
 */

/**
 * Data Register
 *
 * This class keeps track of nodes and the controller actions that
 * should update them. So before making a request to the foo
 * controller, calling the bar action (i.e., call
 * Controller_Foo::barAction()), you can register a DOM node and
 * the path 'foo-bar', so that when the request is performed, the
 * DOM node is updated with the received content.
 *
 * @author robert@webvariants.de
 * @class  DataRegister
 */

app.DataRegister = {
    data: {},

    updateHandler: function (path) {
        console.warn('DataRegister::updateHandler will be used');

        var job = runloop.findJob('*', path);
        job.now = true;
    },

    add: function (id, path) {
        console.warn('DataRegister::add will be used');

        var data = this.data;

        path = path.toLowerCase();
        if (!(path in data)) {
            data[path] = [];
        }

        if ($.inArray(id, data[path]) === -1) {
            data[path].push(id);
        }
    },

    getNodes: function (path) {

        var data = this.data, i = 0, len;

        path = path.toLowerCase();
        if (path in data) {
            // find & remove non-existing nodes
            for (len = data[path].length; i < len; ++i) {
                if ($('.' + data[path][i]).length === 0) {
                    data[path].splice(i, 1);
                }
            }

            // return the existing rows
            console.warn('DataRegister::getNodes was used - with result');
            return data[path];
        }

        console.warn('DataRegister::getNodes was used - no result');

        return [];
    },

    payloadHandler: function (job) {
        console.warn('DataRegister::payloadHandler will be used');

        var payload = {},
            path    = app.DataRegister.data[this.controller + '-' + this.action];

        if (path) {
            var module = $('.' + path[0]);
            if (module.length > 0) {
                module.each(function () {
                    $.each(this.attributes, function (index, attribute) {
                        var name = attribute.name;
                        if (name.indexOf('data-') === 0) {
                            name = name.replace('data-','');
                            payload[name]  = attribute.value;
                        }
                    });
                });
            }
        }

        return payload;
    },

    setParam: function (path, key, value) {
        console.warn('DataRegister::setParam will be used');

        // id will be used in the future, currently there is only path
        var module = this.data[path];
        if (module) {
            var obj = $('.' +module[0]);
            obj.attr('data-' + key, value);
        }

        this.updateHandler(path); // Remove if its in reloader
    },

    getParam: function (path, key) {
        console.warn('DataRegister::getParam will be used');

        // id will be used in the future, currently there is only path
        var module = this.data[path];
        if (module) {
            var obj = $('.' +module[0]);
            obj.attr('data-' + key, value);
        }
    }
};

app = app || {};

app.locales = {
    "Afrikaans": "af_af", 
    "Albanian": "sq_sq",
    "Arabic (Algeria)": "ar_dz",
    "Arabic (Bahrain)": "ar_bh",
    "Arabic (Egypt)": "ar_eg",
    "Arabic (Iraq)": "ar_iq",
    "Arabic (Jordan)": "ar_jo",
    "Arabic (Kuwait)": "ar_kw",
    "Arabic (Lebanon)": "ar_lb",
    "Arabic (libya)": "ar_ly",
    "Arabic (Morocco)": "ar_ma",
    "Arabic (Oman)": "ar_om",
    "Arabic (Qatar)": "ar_qa",
    "Arabic (Saudi Arabia)": "ar_sa",
    "Arabic (Syria)": "ar_sy",
    "Arabic (Tunisia)": "ar_tn",
    "Arabic (U.A.E.)": "ar_ae",
    "Arabic (Yemen)": "ar_ye",
    "Arabic": "ar_ar",
    "Armenian": "hy_hy",
    "Assamese": "as_as",
    "Azeri (Cyrillic)": "az_cy",
    "Azeri (Latin)": "az_la",
    "Basque": "eu_eu",
    "Belarusian": "be_be",
    "Bengali": "bn_bn",
    "Bulgarian": "bg_bg",
    "Catalan": "ca_ca",
    "Chinese (China)": "zh_cn",
    "Chinese (Hong Kong SAR)": "zh_hk",
    "Chinese (Macau SAR)": "zh_mo",
    "Chinese (Singapore)": "zh_sg",
    "Chinese (Taiwan)": "zh_tw",
    "Chinese": "zh-zh",
    "Croatian": "hr_hr",
    "Chech": "cs_cs",
    "Danish": "da_da",
    "Divehi": "div_div",
    "Dutch (Belgium)": "nl_be",
    "Dutch (Netherlands)": "nl",
    "English (Australia)": "en_au",
    "English (Belize)": "en_bz",
    "English (Canada)": "en_ca",
    "English (Caribbean)": "en",
    "English (Ireland)": "en_ie",
    "English (Jamaica)": "en_jm",
    "English (New Zealand)": "en_nz",
    "English (Philippines)": "en_ph",
    "English (South Africa)": "en_za",
    "English (Trinidad)": "en_tt",
    //"English (United Kingdom)": "en_gb",
    "English (United States)": "en_us",
    "English (Zimbabwe)": "en_zw",
    "English": "en_gb",
    "Estonian": "et_et",
    "Faeroese": "fo_fo",
    "Farsi": "fa_fa",
    "Finnish": "fi_fi",
    "French (Belgium)": "fr_be",
    "French (Canada)": "fr_ca",
    //"French (France)": "fr_fr",
    "French": "fr_fr",
    "French (Luxembourg)": "fr_lu",
    "French (Monaco)": "fr_mc",
    "French (Switzerland)": "fr_ch",
    "FYRO Macedonian": "mk_mk",
    "Gaelic": "gd_gd",
    "Georgian": "ka_ka",
    "German (Austria)": "de_at",
    //"German (Germany)": "de_de",
    "German": "de_de",
    "German (Liechtenstein)": "de_li",
    "German (lexumbourg)": "de_lu",
    "German (Switzerland)": "de_ch",
    "Greek": "el_el",
    "Gujarati": "gu_gu",
    "Hebrew": "he_he",
    "Hindi": "hi_hi",
    "Hungarian": "hu_hu",
    "Icelandic": "is_is",
    "Indonesian": "id_id",
    //"Italian (Italy)": "it_it",
    "Italian": "it_it",
    "Italian (Switzerland)": "it_ch",
    "Japanese": "ja_ja",
    "Kannada": "kn_kn",
    "Kazakh": "kk_kk",
    "Konkani": "kok_kok",
    "Korean": "ko_ko",
    "Kyrgyz": "kz_kz",
    "Latvian": "lv_lv",
    "Lithuanian": "lt_lt",
    "Malay (Brunei)": "ms_br",
    "Malay (Malaysia)": "ms_ma",
    "Malayalam": "ml_ml",
    "Maltese": "mt_mt",
    "Marathi": "mr_mr",
    "Mongolian (Cyrillic)": "mn_mn",
    "Nepali (India)": "ne_ne",
    "Norwegian (Bokmal)": "nb_no",
    "Norwegian (Bokmal)": "no_no",
    "Norwegian (Nynorsk)": "nn_no",
    "Oriya": "or_or",
    "Polish": "pl_pl",
    "Portuguese (Brazil)": "pt_br",
    //"Portuguese (Portugal)": "pt",
    "Portuguese": "pt_pt",
    "Punjabi": "pa_pa",
    "Rhaeto_Romanic": "rm",
    "Romanian (Moldova)": "ro_md",
    "Romanian": "ro_ro",
    "Russian (Moldova)": "ru_md",
    "Russian": "ru_eu",
    "Sanskrit": "sa_sa",
    "Serbian (Cyrillic)": "sr_cy",
    "Serbian (Latin)": "sr_la",
    "Slovak": "sk_sk",
    "Slovenian": "ls_ls",
    "Sorbian": "sb_sb",
    "Spanish (Argentina)": "es_ar",
    "Spanish (Bolivia)": "es_bo",
    "Spanish (Chile)": "es_cl",
    "Spanish (Colombia)": "es_co",
    "Spanish (Costa Rica)": "es_cr",
    "Spanish (Dominican Republic)": "es_do",
    "Spanish (Ecuador)": "es_ec",
    "Spanish (El Salvador)": "es_sv",
    "Spanish (Guatemala)": "es_gt",
    "Spanish (Honduras)": "es_hn",
    "Spanish (International Sort)": "es",
    "Spanish (Mexico)": "es_mx",
    "Spanish (Nicaragua)": "es_ni",
    "Spanish (Panama)": "es_pa",
    "Spanish (Paraguay)": "es_py",
    "Spanish (Peru)": "es_pe",
    "Spanish (Puerto Rico)": "es_pr",
    "Spanish (Traditional Sort)": "es",
    "Spanish (United States)": "es_us",
    "Spanish (Uruguay)": "es_uy",
    "Spanish (Venezuela)": "es_ve",
    "Sutu": "sx_sx",
    "Swahili": "sw_sw",
    "Swedish (Finland)": "sv_fi",
    "Swedish": "sv_sv",
    "Syriac": "syr_syr",
    "Tamil": "ta_ta",
    "Tatar": "tt_tt",
    "Telugu": "te_te",
    "Thai": "th_th",
    "Tsonga": "ts_ts",
    "Tswana": "tn_tn",
    "Turkish": "tr_tr",
    "Ukrainian": "uk_uk",
    "Urdu": "ur_ur",
    "Uzbek (Cyrillic)": "uz_cy",
    "Uzbek (Latin)": "uz_la",
    "Vietnamese": "vi_vi",
    "Xhosa": "xh_xh",
    "Yiddish": "yi_yi",
    "Zulu": "zu_zu"
};
app = app || {}

app.meta = {
    pageTitle: 'Commscope - Language Portal',
    userManagement: true,
    editName: true,
    editPassword: true,
    editRole: false,
    addRole: false,
    projectManagement: false,
    addProject: false,
    development: true,
    title: function() {
        $('head title').text(this.pageTitle);
    },
    logs: function() {
        if (!this.development) {
            console = console || {};
            console.log = console.error = console.info = console.debug = console.warn = console.trace = console.dir = console.dirxml = console.group = console.groupEnd = console.time = console.timeEnd = console.assert = console.profile = function() {};
        }
    },
    predefinedRoles: ["admin", "user"],
    exportofusermanagement: true,
    importoftranslationfiles: true,
    exportoftranslationfiles: true
};
/*global $:false, die:false, Request:false*/

/**
 * @module Controllers
 */

app.module = {
    data:            [],
    modules:         [],
    finishedModules: [],
    active:          false,
    load: function (opt) {
        opt.id = Math.round(Math.random()*1000000);
        app.module.data.push(opt);
        this.triggerController(opt);
    },

    add: function (opt) {
        if(this.active) {

            // TODO add loading of multiple modules
            opt.id               = Math.round(Math.random()*1000000);
            opt.modules          = [opt.module];
            opt.pseudo           = true;
            opt.name             = opt.module + '-' + opt.template;
            opt.controllerResult = {template: opt.module, module: opt.module};
            app.module.data.push(opt);
            if (this.toLoadModules(opt.modules).length !== 0) {
                this.loadModule(opt);
            } else if(!this.moduleFinished(opt.module)) {
                this.loadTemplate(opt);
            } else if(_.isFunction (opt.callback)) {
                opt.callback(opt);
            }
        } else {
            opt.callback(opt);
        }
    },

    searchModules: function (data) {
        var modules = [];
        for (var index in data) {
            if (data.hasOwnProperty(index)) {
                if (index === 'module') {
                    modules.push(data[index]);
                }
                else if (_.isObject(data[index])) {
                    modules = _.union(modules, this.searchModules(data[index]));
                }
            }
        }

        return modules;
    },

    success: function (data, request) {
        var id  = this.payload.id,
            opt = app.module.getData(id);

        if (!opt) {
            console.error('module could not be found');
        }

        app.module.modules.push(opt.module);
        app.module.removeData(id);

        var controllerUsed = false,
            files          = data.files;

        for (var fileType in files) {
            if (files.hasOwnProperty(fileType)) {
                var types = files[fileType];
                var files2load = [];
                for (var type in types) {
                    if (types.hasOwnProperty(type)) {
                        var fileList = types[type];
                        for (var fileIndex in fileList) {
                            if (fileList.hasOwnProperty(fileIndex)) {
                                if (type === 'controller') {
                                    controllerUsed = true;
                                }
                                if (type === 'views') {
                                    continue;
                                }
                                files2load.push(fileList[fileIndex]);
                            }
                        }
                        
                    }
                }

                app.module.loadFile(fileType, files2load, opt);
            }
        }

        if (controllerUsed) {
            if (!opt.pseudo) {
                app.controllerHelper.addTodo(opt);
            }
        }
        else {
            app.module.finishedModules.push(opt.module);

            app.controllerHelper.create(opt.module, opt);
            // app.controllerHelper.trigger('module.loadstop', {name: opt.name});
            if (_.isFunction (opt.callback)) {
                opt.callback(opt);
            }
        }
    },

    error: function (status, response, xhr) {
        console.error('Module.js: ', response);
        var opt = app.module.getData(this.payload.id);
        if(opt) { // ToDo investigate why opt is sometimes empty (possible memoryleak)
            app.module.removeData(opt.id);
        }
    },

    controllerSuccess: function (result, request) {
        var id  = request.payload.id,
            opt = app.module.getData(id);

        if(opt) {
            opt.controllerResult = result;
            opt.name = request.controller + '-' + request.action;
            opt.device = request.device;

            if (result.module) {
                opt.modules = app.module.searchModules(result);
                opt.module = result.module;
                if (app.module.toLoadModules(opt.modules).length > 0) {
                    app.module.loadModule(opt);
                } else if(!app.module.moduleFinished(opt.modules[0])) {
                    app.module.loadTemplate(opt);
                } else{
                    app.controllerHelper.create(opt.module, opt);
                    if(app.module.moduleFinished(opt.module)) {
                        // app.controllerHelper.trigger('module.loadstop', {name: opt.name});
                        if (_.isFunction (opt.callback)) {
                            opt.callback(opt);
                        }
                    }
                }
            }
            else {
                console.error(opt.name + ' needs the key module');
                app.module.removeData(opt.id);
                // app.controllerHelper.trigger('module.loadstop', {name: opt.name});

            }
        } else {
            console.error('an module could not be found - probably doubled request and one got droped');
        }
    },
    moduleFinished: function(module) {
        return _.contains(this.finishedModules, module);
    },
    toLoadModules: function (module) {
        var mods = [];
        for (var moduleIndex in module) {
            if (module.hasOwnProperty(moduleIndex)) {
                var found = false;
                for (var index in this.modules) {
                    if (this.modules.hasOwnProperty(index) && this.modules[index] === module[moduleIndex]) {
                        found = true;
                    }
                }

                if (!found) {
                    mods.push(module[moduleIndex]);
                }
            }
        }
        return mods;
    },

    triggerController: function (opt) {
        var nameParts = opt.name.split('-');
        var payload   = opt.payload || {};
        payload.module = opt.module;
        payload.name   = opt.name;
        payload.device = opt.device;
        payload.id     = opt.id;

        app.adapter.add({
            controller: nameParts[0],
            action: nameParts[1],
            device: opt.device,
            payload: payload,
            callback: this.controllerSuccess,
            errorCallback: this.error
        }, true);
    },

    loadTemplate: function (opt) {
        var templatePath = 'templates/' + opt.modules[0];
        $.ajax({
            url: templatePath,
            dataType: "script",
            data: {id: opt.id},

            error: function (handler, message, err) {
                console.error('template/view loading failed:', message, err);
            }
        });
    },

    loadModule: function (opt) {
        var modules = this.toLoadModules(opt.modules);
        // @FIXME Seems buggy to myself - but is currently working
        if (modules.length === 0) {
            if(!opt.pseudo) {
                app.controllerHelper.create(opt.module, opt);
            }
            // app.controllerHelper.trigger('module.loadstop', {name: opt.name});
            if (_.isFunction (opt.callback)) {
                opt.callback(opt);
            }
        } else if(!this.moduleFinished(modules[0])) {
            this.modules.push(modules[0]);
            this.loadTemplate(opt);
        } else {
            // app.controllerHelper.trigger('module.loadstop', {name: opt.name});
            if(_.isFunction (opt.callback)) {
                opt.callback();
            }
        }
    },

    loadFile: function (type, path, opt) {
        app.app.includeAssets(type.toUpperCase(), path, function () {
            if (type === 'js') {
                var modules = [];
                for (var i = 0; i < path.length; i++) {
                    var module = path[i].split('/')[1];
                    if(!app.module.moduleFinished(module)) {
                        app.module.finishedModules.push(module);
                    }

                    if ($.inArray(module, modules) === -1 && app.controllerHelper.todo[module]) {
                        modules.push(module);
                        if(!opt.pseudo) {
                            for(var index = 0; index < app.controllerHelper.todo[module].length; index++) {
                                app.controllerHelper.checkTodos();
                            }
                        }
                    }
                }
                // app.controllerHelper.trigger('module.loadstop', {name: opt.name});

                if (_.isFunction (opt.callback)) {
                    opt.callback(opt);
                }
            }
        },
        true);
    },

    removeData: function (id) {
        var removed = false,
            data    = [],
            list    = app.module.data;

        for (var index in list) {
            if (list.hasOwnProperty(index) && list[index].id != id) {
                data.push(list[index]);
            }
            else {
                removed = true;
            }
        }

        if (!removed) {
            console.error('the removable data for module could not be found');
        }

        app.module.data = data;

        return removed;
    },

    getData: function (id) {
        var obj  = null,
            list = app.module.data;

        for (var index in list) {
            if (list.hasOwnProperty(index) && list[index].id === id) {
                obj = list[index];
                break;
            }
        }

        return obj;
    },

    todoExists: function (name) {
        for (var index in this.data) {
            if (this.data.hasOwnProperty(index) && this.data[index].name === name) {
                return true;
            }
        }

        return false;
    },

    templateLoaded: function (id) {
        var opt = app.module.getData(id);
        if (!opt) {
            console.error('fitting module for loaded template could not be found');
        }
        else {
            app.adapter.add({
                controller: 'module',
                action: 'load',
                device: 'x',
                payload: {
                    module: opt.modules[0], // TODO transmit array
                    name: opt.name,
                    device: opt.device,
                    id: opt.id
                },

                callback: this.success,
                errorCallback: this.error
            }, true);
        }
    }
};

/*
 * ION-U web application
 *
 * Copyright (c) 2012, CommScope/webvariants
 */

/*global jQuery:false, window:false, Debug:false, Request:false, ion:false*/
/*jshint smarttabs:true, forin:false*/ // <- we only iterate through objects we control, so no need for hasOwnProperty()

/**
 * @module Library
 * @author carlo@webvariants.de
 */

/**
 * @class Reloader
 */

// TODO Refactor!

var Job = function (opt) {
	this.remove = function () {
		this.del = true;
	};

	_.extend(this, {
		type           : null,
		callback       : null,
		errorCallback  : null,
		interval       : 0,
		iteration      : null,
		pause          : false,
		clearEvents    : null,
		checksum       : null,
		payloadHandler : null,
		now            : false,
		"del"          : false // flag to mark something to delete i
	}, opt || {});
};

var runloop = {
	currentDevice: null,
	iteration: 0,
	timeInterval: 50,
	pauseValue: false,
	isPerforming: false,
	pseudoDevice: 'x',
	jobs: [],

	start: function () {
		if (!Config.Debug.deactivateReload) {
			runloop.triggerLoop();
		}
	},

	getRunJobs: function () {
		var result = {
			jobs: [],
			runJobs: []
		};

		for (var jobIndex in runloop.jobs) {
			if (runloop.jobs.hasOwnProperty(jobIndex)) {
				var job = runloop.jobs[jobIndex];
				if (job.del || job.iteration < runloop.iteration) {
					continue;
				}

				result.runJobs.push(job);
				if (job.iteration == runloop.iteration && !job.pause) {
					job.now = false;
					runloop.jobs[jobIndex].iteration = runloop.iteration + job.interval;
					result.jobs.push(job);
				}
				else if (job.now) {
					job.now = false;
					result.jobs.push(job);
				}
			}
		}
		return result;
	},

	loop: function () {
		if (!runloop.isPaused()) {
			runloop.updateQueue();
			runloop.isPerforming = false;
			var jobRes = runloop.getRunJobs();
			runloop.jobs = jobRes.runJobs;
			var jobs = jobRes.jobs;

			runloop.iteration++;

			if (jobs.length > 0) {
				var request = null;
				var requestCount = 0;
				var jobCount = 0;

				var cb = function (count) {
					if (count) {
						jobCount += count;
					} else {
						jobCount++;
					}

					if (requestCount == jobCount ) {
						runloop.triggerLoop();
					}
				};

				for (var jobIndex in jobs) {
					if (jobs.hasOwnProperty(jobIndex)) {
						var job = jobs[jobIndex];
						if (job.type == 'request') {
							var payload = {};
							if (job.payloadHandler && typeof(job.payloadHandler) == 'function') {
								payload = job.payloadHandler();
								if(payload === false) {
									continue;
								}
							}
							else if (job.payload) {
								payload = job.payload;
							}

							app.adapter.add({
								controller: job.controller,
								action: job.action,
								payload: payload,
								device: job.device,
								callback: job.callback,
								errorCallback: job.errorCallback,
								checksum: job.checksum,
								job: job
							}, true);

							requestCount++;
						}
						else if (job.type == 'execute') {
							if(Config.Debug.debugMode) {
								job.callback(cb, job);
							} else {
								try{ // Is needed when in an job an exception is thrown
									job.callback(cb, job);
								} catch(err) {
									console.error(err);
								}
							}
						}

						if(job.once) {
							job.remove();
						}
					}
				}

				if (request) {
					request.finishCb = function () {
						cb(requestCount);
					};

					request.exec();
				}
				else {
					runloop.triggerLoop();
				}
			}
			else {
				runloop.triggerLoop();
			}
		}
	},

	remove: function (device, identifier) {
		var found   = false,
			newJobs = [];

		for (var jobIndex in runloop.jobs) {
			if (runloop.jobs.hasOwnProperty(jobIndex)) {
				var job = runloop.jobs[jobIndex],
					jobIdentifier = job.controller + '-' + job.action;

				if (!(jobIdentifier === identifier && job.device === device)) {
					newJobs.push(job);
				}
				else {
					found = true;
				}
			}
		}

		if (found) {
			runloop.jobs = newJobs;
		}

		return found;
	},

	updateQueue: function () {
		for (var jobIndex in runloop.jobs) {
			if (runloop.jobs.hasOwnProperty(jobIndex)) {
				var job = runloop.jobs[jobIndex];
				if (job.device != runloop.pseudoDevice) {
					// TODO check implementation and refactor class
					// set name to app.runloop or move the functionality to the app
					// console.warn('use dataRegister', 'job.device != runloop.pseudoDevice');
					var identifier = job.controller + '-' + job.action;
					if (job.type != 'execute' && app.viewHelper.get(job.uid).length === 0) {
						console.log(job);
						job.del = true;
					}
				}
			}
		}
	},

	triggerLoop: function () {
		// isPerforming is a safety flag that setTimeout isn't triggered twice
		if (!runloop.isPaused() && !runloop.isPerforming) {
			runloop.isPerforming = true;

			// setTimeout is used instead of interval, because an iteration can take some time
			// we don't want troublemaker, right?
			window.setTimeout(runloop.loop, runloop.timeInterval);
		}
	},

	pause: function (device, identifier) {
		if (!identifier) {
			runloop.isPerforming = false;
			runloop.pauseValue = true;
		}
		else {
			var job = runloop.findJob(device, identifier);
			if (job) {
				job.pause = true;
			}
		}
	},

	isPaused: function (device, identifier) {
		if (!identifier) {
			return runloop.pauseValue;
		}
		else {
			var job = runloop.findJob(device, identifier);
			if (job) {
				return job.pause;
			}
		}
	},

	findJob: function (device, identifier) {
		device = device || runloop.pseudoDevice;
		for (var jobIndex in runloop.jobs) {
			if (runloop.jobs.hasOwnProperty(jobIndex)) {
				var job           = runloop.jobs[jobIndex],
					jobIdentifier = job.controller + '-' + job.action;

				if (jobIdentifier === identifier && (job.device === device || device === '*')) {
					return job;
				}
			}
		}

		return null;
	},
	findByUid: function(uid) {
		var res = [];
		for (var jobIndex in runloop.jobs) {
			if (runloop.jobs.hasOwnProperty(jobIndex)) {
				var job           = runloop.jobs[jobIndex];
				if(uid == job.uid) {
					res.push(job);
				}
			}
		}

		return res;
	},
	setChecksum: function (checksum, device, identifier) {
		if (!identifier || typeof(checksum) != 'string') {
			return false;
		}
		else {
			var job = runloop.findJob(device, identifier);
			if (job) {
				job.checksum = checksum;
				return checksum;
			}
		}
	},

	findIteration: function (interval, later) {
		var iteration = runloop.iteration + 1;
		if(later) {
			iteration = runloop.iteration + interval;
		} else {
			// the plus one is for safety reasons,
			for (var jobIndex in runloop.jobs) {
				var runJob = runloop.jobs[jobIndex];
				if (interval == runJob.interval && runloop.iteration <= runJob.iteration) {
					if (runJob.iteration == runloop.iteration) {
						iteration = runJob.iteration + interval;
					}
					else {
						iteration = runJob.iteration;
					}
				}
			}
		}

		return iteration;
	},

	play: function (device, identifier) {
		var done = false;

		if (!identifier) {
			runloop.pauseValue = false;
			runloop.triggerLoop();
			done = true;
		}
		else {
			var job = runloop.findJob(device, identifier);
			if (job) {
				job.pause = false;
				job.iteration = runloop.findIteration(job.interval);
				done = true;
			}
		}

		return done;
	},

	addJob: function (job) {
		var added  = false,
			runJob = runloop.findJob(job.device, job.controller + '-' + job.action);

		if (!runJob){
			job.iteration = runloop.findIteration(job.interval, job.once);

			// if (!job.device) {
			// 	Reloader.pseudoDevice;
			// }

			runloop.jobs.push(job);
			added = true;
		}
		else if (runJob.pause && runJob.iteration + runJob.interval > runloop.iteration){
			runJob.pause = false;
			runJob.iteration = runloop.findIteration(job.interval, job.once);
			added = true;
			runJob.uid = job.uid;
		}

		return added;
	},
	once: function(job) {
		job.once = true;
		if(!job.interval) {
			job.interval = 1;
		}
		return this.addJob(job);
	},
	clear: function () {
		// we only want to delete the request-jobs (Reloader consited only of https.Server(opts, requestListener);)
		for (var jobIndex in runloop.jobs) {
			if (runloop.jobs.hasOwnProperty(jobIndex)) {
				var job = runloop.jobs[jobIndex];
				if (job.type == 'request') {
					job.del = true;
				}
			}
		}
	},

	clearEvent: function (event) {
		var newJobs = [];
		for (var jobIndex in runloop.jobs) {
			if (runloop.jobs.hasOwnProperty(jobIndex)) {
				var job = runloop.jobs[jobIndex];
				if ($.inArray(event.type, job.clearEvents) === -1) {
					newJobs.push(job);
				}
			}
		}

		runloop.jobs = newJobs;
	}
};

app.runloop = runloop;

/*
 * ION-U web application
 *
 * Copyright (c) 2012, CommScope/webvariants
 */

/*global ion:false, window:false, location:false, document:false, jQuery:false*/
/*jshint smarttabs:true*/

/**
 * @module Library
 */

// TODO make it obsolete

app.stateManager = {
	getControllerArray: function() {
		return app.controllerHelper.getFromName('home-statemanager');
	},
	getController: function() {
		var controller = this.getControllerArray();
		if(controller.length != 1) {
			throw 'The statemanager controller could not be found';
		}
		return controller[0];
	},
	setDevice: function(device) {
		this.getController().setDevice(device);
	},

	setMainPath: function(path) {
		this.getController().setMainPath(path);
	},

	setSubPath: function(path) {
		this.getController().setSubPath(path);
	},

	setParam: function(key, value) {
		this.getController().setParam(key, value);
	},

	removeParam: function(key) {
		this.getController().removeParam(key);
	},
	getDevice: function() {
		return this.getController().getDevice();
	},

	getMainPath: function() {
		return this.getController().getMainPath();
	},

	getSubPath: function() {
		return this.getController().getSubPath();
	},
	getParam: function(key) {
		return this.getController().getParam(key);
	},
	getParams: function(key) {
		return this.getController().getParams();
	},
	getDeviceRole: function() {
		return this.getController().getDeviceRole();
	}
};

app.time = {
	zone: 'America/New_York',
	init: function() {
		var self = this;
		app.adapter.add({device: 'x', controller: 'setup', action: 'date', callback: function(res) {
			self.setTimezone(res.tzname);
		}}, true);
	},
	setTimezone: function(name) {
		this.zone   = name;
		this.offset = false;
		localStorage.setItem('timezone', name);
	},
	getTimezone: function() {
		var item = localStorage.getItem('timezone');
		if(item) {
			this.zone = item;
		}
		return this.zone;
	},
	
	getDate: function(timestamp, forceAmerica, clear) {
		var tz = this.getTimezone();
		if(!tz) { // If timezone is not set, momentjs throws exception
			console.warn('Timezone is not set!');
			return moment(timestamp,"X").format("DD.MM.YYYY");
		} else if(tz.indexOf("Europe")===0){
			return moment(timestamp,"X").tz(this.zone).format("DD.MM.YYYY");
		}else{
			return moment(timestamp,"X").tz(this.zone).format("MM/DD/YYYY");
		}
	},

	getTime: function(timestamp, detail, clear) {
		detail = (detail !== undefined) ? detail : false;
		var res = "";
		if(!this.zone) { // If timezone is not set, momentjs throws exception
			console.warn('Timezone is not set!');
			res = moment(timestamp,"X").format("HH:mm:ss");
		} else if (detail) {
			res = moment(timestamp,"X").tz(this.zone).format("HH:mm:ss");
		} else {
			res = moment(timestamp,"X").tz(this.zone).format("HH:mm");
		}
		return res;
	
	},

	/**
	 * requiered format: "30-05-2014 10:47:43"
	 */
	getTimestamp: function(timestring) {
		var res = 0;
		if (timestring === undefined || timestring === ""){
			res = moment().format("X");
		} else {
			res =moment.tz(timestring,"DD-MM-YYYY HH:mm:ss",this.zone).unix();
		}
		return res;
	},

	__buildTimeStr: function(year, month, day, hours, minutes, seconds) {
		//requiered format in moment.js : "30-05-2014 10:47:43"
		var timeStr = '';

		var HH = this.long(parseInt(hours,10));
		var mm = this.long(parseInt(minutes,10));
		var ss = this.long(parseInt(seconds,10));

		timeStr = day+'-'+month+'-'+year+' '+HH+':'+mm+':'+ss;

		return timeStr;
	},


	long: function(value) {
		var valueString = String(value);
		if(valueString.length === 1) {
			valueString = '0' + valueString;
		}

		return valueString;
	},
};

// app.time.init();


app.view = app.view || {};

app.view.Base = app._merge({


}, app.view.Button, app.view.Widget);
// add default functionality here


app.view = function (namespace, mixin, view) {
    if(app.viewHelper.list[namespace]) {
        // console.error('The view ' + namespace + ' is already loaded! - probably there is another one with the same name');
        return;
    }

    var mixins = [];
    if(!view) {
        view = mixin;

    } else {
        if(_.isArray(mixin)) {
            mixins = mixin;
        } else {
            mixins.push(mixin);
        }
    }

    app.viewHelper.last = namespace;
    view = view || {};

    // TODO FIXME merge init methods?
    view = app._merge(view, app.view.Base, {
        events: [],

        namespace: namespace,
        template: view,
        getContent: function(key) {
            this.controller.get(key);
        },
        setContent: function(key, value) {
            this.controller.set(key, value);
        },
        trigger: function (event, payload) {
            return this.controller.trigger(event, payload);
        },
        triggerParents: function (event, payload) {
            return this.controller.triggerParents(event, payload);
        },
        triggerSiblings: function (event, payload) {
            return this.controller.triggerSiblings(event, payload);
        },
        triggerChildren: function (event, payload) {
            return this.controller.triggerChildren(event, payload);
        },
        getAnchor: function() {
            return $(this.__selector(this.controller.uid, '[data-anchor]'));
        },
        _handleState: function(opt) {
            var anchor = this.getAnchor();
            if(anchor.length === 0) {
                console.error('state could not be handled, because anchor was not defined');
                return false;
            } else {
                if(!this.achor) {
                    this.anchor = {};
                }
                for(var index in opt) {
                    if(opt.hasOwnProperty(index)) {
                        this.anchor[index] = opt[index];
                    }
                }
                var uid = anchor.attr('data-anchor');

                app.viewHelper.createAnchor({uid: uid});
                return true;
            }

        },
        __selector: function (uid, key, data) {
            if(!_.isString(key)) {
                throw "You have to give me a string!";
            }
            var selector = 'body [data-uid="' + uid + '"] ';
            selector += key === 'root' ? '' : key;
            selector = this._addData(selector, data);
            return selector;
        },
        _addData: function(selector, data) {
            if(data) {
                selector += '[';
                for(var index in data) {
                    if(data.hasOwnProperty(index)) {
                        selector += 'data-' + index + '="' + data[index] + '" ';
                    }
                }
                selector += ']';
            }

            return selector;
        },
        get: function (key, attr) {
            if(!this[key]) {
                console.error('the VIEW does not have ' + key + ' - did you want to do controller.get?');
                return undefined;
            } else {
                var obj = $(this.__selector(this.controller.uid, this[key]));
                if(obj.length === 0) {
                    console.info(key + ' was mapping to nothing');
                } else if(attr == 'content') {
                    return obj.html();
                } else {
                    return obj.attr(attr || 'value');
                }
            }
        },

        set: function (key, value, attr) {
            if(!this[key]) {
                console.error('the VIEW does not have ' + key + ' - did you want to do controller.set?');
            } else {
                $(this.__selector(this.controller.uid, this[key])).attr(attr || 'value', value);
            }
            
            return this;
        },

        obj: function (key, data) {
            key = key === 'root' ? 'root' : this[key];
            return $(this.__selector(this.controller.uid, key, data));
        }
    });

    for(var i = 0; i < mixins.length; i++) {
        if(mixins[i]) {
            view = app._merge(view, mixins[i]);
        } else {
            console.error(namespace + ' there mixin ' + i + ' is undefined | either you need to put it in assets.php or you misspelled it');
        }
    }

    app.__views = app.__views || {};
    app.__views[namespace] = view;

    if (namespace === 'pseudo') {
        view.pseudo = true;
    }
    else {
        app.viewHelper.add(namespace, view);
    }

    return view;
};


app.viewHelper = {
    list: {},
    increment: 1, // Needs to start at 1, for not handling type safety 0/undefined
    anchors: [],
    templatePrefix: 'src/components/', // dont ask my why grunt-jade does that
    init: function() {
        $('body').on('click dblclick submit change slide focusout mouseover mouseout slideend mousemove mouseup mousedown keyup keydown drag dragstart dragover scroll', function(evt) {
                app.viewHelper.handleEvent(evt);
        });

        $(window).on('hashchange', function() {
            app.controllerHelper.trigger('hashchange');
        });
    },
    add: function (namespace, view) {
        this.list[namespace] = view;
    },
    create: function (namespace) {
        // ToDo improve memory - only clone if view is already used once
        var view = _.clone(this.list[namespace]);

        if (view) {
            // view.name = name;
            // view.addEvents(namespace);

            // if (view.init) {
            // view.init();
            // }

            // view.root = $('.' +name);

            // view.trigger();
//namespace instead of name
            // var ele = $('[data-controller=' + name + ']')[0];
            // app.app.renderCallback(ele, name);

            // view.init();
        }
        else {
            if(namespace.search('-') != -1) {
                console.log(namespace + ' view not found');
            }
            view = app.view('pseudo', {});
        }

        return view;
    },
    addAnchor: function(job) {
        this.anchors.push(job);
    },
    executeAnchors: function() {
        for(var i = 0; i < this.anchors.length; i++) {
            if(!this.anchors[i].done) {
                this.anchors[i].done = true;
                this.createAnchor(this.anchors[i]);
            }
        }

        this.anchors = [];
    },
    createAnchor: function(job) {
        var ele         = $('[data-anchor=' + window.parseInt(job.uid)+ ']');
        if(ele.length > 0) { // does it still exist?
            var parent      = ele.parent().closest('[data-uid]');
            var parentId    = window.parseInt(parent.attr('data-uid'));
            var controllers = app.controllerHelper.get(parentId);
            if(!controllers.length && job.uid != 1) {
                console.error('Anchor could not find its parent-controller');
                console.info('Does Parent maybe have two elements at top layer?');
                return;
            }
            var anchor      = {uid: job.uid, parent: parentId};

            var content     = null;
            if(job.content) {
                content = _.clone(job.content); // @FIXME results in problems when children changes something, and the parent rerenders
            } else {
                content = _.clone(app.controllerHelper.get(parentId)[0].content);
            }

            delete content.template;
            if(job.content) delete job.content.template;

            if(job.module && job.template) {
                anchor.module = job.module;
                anchor.template = job.template;
            } else {
                for(var i = controllers.length; i > 0; i--) {
                    var controller = controllers[i - 1];
                    var view       = controller.view;
                    if(view.anchor !== undefined) {
                        anchor.module   = view.anchor.module || controller.name.split('-')[0];
                        anchor.template = view.anchor.template;
                        break;
                    }
                }
            }

            app.module.add({module: anchor.module, dom: ele, template: anchor.template, callback: app.viewHelper.handleAnchor, anchor: anchor, content: content});
        }
    },
    handleAnchor: function() {
        var namespace   = this.module;
        var transformed = app.controllerHelper.transformName(this.template);
        if(namespace != transformed) {
            namespace += '-' + transformed;
        }
        var todo      = {module: this.module, name: namespace, dom: this.dom, ignoreWrap: true};
        var controller = app.controllerHelper.list[namespace];
        var isContent  = false;
        if(todo.dom.parent('.deviceRole').length == 1) {
            isContent = true;
        }

        if(controller && controller.model) {
            var model = app.controllerHelper.list[namespace].model;
            todo.controllerResult = {template: this.template, module: this.module};

            app.adapter.add({
                device: model.device,
                controller: model.controller,
                action: model.action,
                payload: model.payload,
                cache: model.cache,
                callback: function (res) {
                    _.merge(todo.controllerResult, res);
                    todo.name = model.controller + '-' + model.action;
                    if(Config.Debug.debugMode) {
                        app.controllerHelper.create(todo.controllerResult.module, todo, app.viewHelper.refAnchor);
                    } else {
                        try{ // Is needed when in creating controller an exception is thrown
                            app.controllerHelper.create(todo.controllerResult.module, todo, app.viewHelper.refAnchor);
                        } catch(err) {
                            console.error(err);

                            console.info('If you dont want to have it catched, make config.php DEBUG = false');
                            app.controllerHelper.trigger('alert', {message: 'Showing this view is sadly not possible ' + this.template, type: 'error'});
                        }
                    }

                    if(isContent) {
                        app.controllerHelper.trigger('loadend.anchor.content', {error: false});
                    }
                },
                errorCallback: function() {
                    if(isContent) {
                        app.controllerHelper.trigger('loadend.anchor.content', {error: true});
                    }
                    app.controllerHelper.trigger('alert', {message: 'An error while requesting ' + todo.name, type: 'error'});
                    console.error('Model request failed: ' + namespace);
                }
            }, true);
        } else {
            todo.controllerResult          = this.content || {};
            todo.controllerResult.template = this.template;
            todo.controllerResult.module   = this.module;
            if(Config.Debug.debugMode) {
                app.controllerHelper.create(this.module, todo, app.viewHelper.refAnchor);
            } else {
                try{ // Is needed when in creating controller an exception is thrown
                    app.controllerHelper.create(this.module, todo, app.viewHelper.refAnchor);
                } catch(err) {
                    console.error(err);
                    console.info('If you dont want to have it catched, make config.php DEBUG = false');
                    app.controllerHelper.trigger('alert', {message: 'Showing this view is sadly not possible ' + this.template, type: 'error'});
                }
            }
            if(isContent) {
                app.controllerHelper.trigger('loadend.anchor.content', {error: false});
            }
        }
    },
    get: function(uids, hideEmpty) {
        uids = _.isArray(uids) ? uids : [uids];

        var doms = [];
        for(var i = 0; i < uids.length; i++) {
            var dom = $('body [data-uid=' + uids[i] + ']')[0];
            if(!hideEmpty || dom)
                doms.push(dom);
        }
        return doms;
    },
    refAnchor: function(todo) {
        var ref = todo.dom.children().attr('data-uid');
        todo.dom.attr('data-ref', ref);
    },
    mergeGlobal: function(module, controllerResult, value) {
        var merge = {};

        _.extend(merge, controllerResult, value);
        // root module should be taken, if it has no own
        if(!value.module) {
            merge.module = module;
        }

        for(var mergeIndex in merge) {
            if(merge.hasOwnProperty(mergeIndex)) {
                if(merge[mergeIndex] && merge[mergeIndex].template && !value[mergeIndex]) {
                    merge[mergeIndex] = null;
                }
            }
        }

        return merge;
    },

    compileTemplateWrap: function (module, controllerResult) {
        // ToDo method needs refactoring
        var identifier  = app.controllerHelper.transformName(controllerResult.template),
                returnValue = this.compileTemplates(module, controllerResult, controllerResult);

        if (controllerResult.module) {
            module = controllerResult.module;
        }

        if(controllerResult.reload_every) {
            delete controllerResult.reload_every;
        }

        returnValue.stack.push({
            module: module,
            identifier: identifier,
            uid: returnValue.uid,
            content: {controllerResult: controllerResult}
        });

        return {
            template: returnValue.template,
            stack: returnValue.stack,
        };
    },

    compileTemplates: function (module, controllerResult) {
        // ToDo method needs refactoring
        var stack = [];
        for (var index in controllerResult) {
            if (controllerResult.hasOwnProperty(index) && index != '_') {
                var value = controllerResult[index];
                if (value && value.template) {
                    var merge = this.mergeGlobal(module, controllerResult, value);

                    var returnValue = this.compileTemplateWrap(module, merge);
                    controllerResult[index] = returnValue.template;
                    for (var stackIndex in returnValue.stack) {
                        if (returnValue.stack.hasOwnProperty(stackIndex) && returnValue.stack[stackIndex]) {
                            var stackValue = returnValue.stack[stackIndex];
                            stack.push(stackValue);
                        }
                    }
                }
            }
        }

        var result = '';
        var templateName = '';

        if (controllerResult) {
            templateName = this.templatePrefix + module + '/' + controllerResult.template.toLowerCase();
            if(controllerResult.module) {
                templateName = this.templatePrefix + controllerResult.module + '/' + controllerResult.template.toLowerCase();
            }

            if (JST[templateName]) {
                // try {
                    controllerResult.viewHelper = app.viewHelper;
                    controllerResult._ = _;

                    controllerResult.stateManager = {};
                    if(app.stateManager.getControllerArray().length == 1) {
                        controllerResult.stateManager.deviceRole = app.stateManager.getDeviceRole();
                        controllerResult.stateManager.device     = app.stateManager.getDevice();
                        var params = app.stateManager.getParams();
                        for(var key in params) {
                            if(params.hasOwnProperty(key)) {
                                controllerResult.stateManager[key] = params[key];
                            }
                        }
                    }

                    result = JST[templateName](controllerResult);
                // } catch (err) {
                //  console.error('executing ' + templateName + ' failed', err);
                // }
            } else {
                console.error('missing template: ' + templateName);
            }
        } else {
            console.error('no controllerResult');
        }

        var uid = app.viewHelper.increment++;

        return {
            template: result.insert(
                result.search('>'),
                ' data-uid="'+ uid +'" data-module="'+ module +'" data-template="'+ templateName + '"'
            ),
            uid: uid,
            stack: stack
        };
    },

    getUids: function(target) {
        var elements = target.parents('[data-uid]'),
            uids     = [];

        if (target.attr('data-uid')){
            elements.push(target[0]);
        }
        elements.each(function() {
            uids.push(parseInt($(this).attr('data-uid'), 10));
        });
        return uids;
    },

    getAttributes: function(target) {
        var result     = {},
            attributes = target[0].attributes;

        if(target.attr('id')) {
            result.id = target.attr('id');
        }

        for (var index in attributes) {
            if (attributes.hasOwnProperty(index)) {
                var name  = attributes[index].name,
                    value = attributes[index].value;

                if(name && name.search('data-') === 0) {
                    result[name.replace(/data-/, '')] = value;
                }
            }
        }

        return result;
    },

    checkForEvent: function(controller, evt, target) {
        if (controller.view && controller.view.events) {
            for(var index in controller.view.events) {
                var currentTarget = $(target);
                if(controller.view.events.hasOwnProperty(index)) {

                    var event = controller.view.events[index];

                    if(!event.type) {
                        console.error('Event definition does not have property type ' + controller.namespace, event);
                    }


                    if(event.type == evt.type ) {
                        if(target.parents(event.selector).length > 0) {
                            currentTarget = $(target.parents(event.selector)[0]);
                        }

                        if(currentTarget.is(event.selector) || evt.pseudo) {
                            var data = null;
                            if(evt.pseudo) {
                                data = evt.data;
                                currentTarget = controller.view.obj('root');
                            } else {
                                data = this.getAttributes(currentTarget);
                            }

                            var res = null;
                            var handled   = false;
                            if(event.namespace && app[event.namespace][event.action]){
                                res = app[event.namespace][event.action](data, evt, currentTarget);
                            }else {
                                var defered = new jQuery.Deferred();
                                if(!event.action) {
                                    console.error('Event definition does not have property action ' + controller.namespace, event);
                                }
                                if(_.isFunction(controller.view[event.action]) || _.isFunction(controller[event.action])) {
                                    this.triggerExtra(event, evt, currentTarget, defered);
                                }
                                if(_.isFunction(controller.view[event.action])) {
                                    handled = true;
                                    res = controller.view[event.action](data, evt, currentTarget, defered);
                                }
                                if(_.isFunction(controller[event.action])) {
                                    handled = true;
                                    res = controller[event.action](data, evt, currentTarget, defered);
                                }

                                if(!handled) {
                                    console.error('Could not find action ' + event.action, event);
                                }
                            }

                            if(res !== null && res !== undefined) {
                                return res;
                            } else if(evt.pseudo && handled) {
                                return true;
                            }
                        }
                    }
                }
            }
        }

        return null;
    },
    triggerCustomevents: function(evt, controllers) {
        var newEvent = null;
        if(evt.type == 'keyup') {
            if(evt.which == 13) {
                newEvent = _.clone(evt);
                newEvent.type = 'enter';
                this.handleEvent(newEvent, controllers);
                app.controllerHelper.trigger('enterKey');
                // stopPagination / preventDefault gets lost
            } else if(evt.which == 27) {
                app.controllerHelper.trigger('escapeKey');
            }
        }
    },
    triggerExtra: function(event, evt, target, promise) {
        var defaults = ['action', 'selector', 'namespace', 'type'];
        for(var index in event) {
            if(event.hasOwnProperty(index)) {
                if(!_.contains(defaults, index)) {
                    var handle = {target: target, event: evt, definition: event, type: event[index], promise: promise};
                    promise.handle = handle;
                    app.controllerHelper.trigger(index, handle);
                }
            }
        }
    },
    handleEvent: function(evt, controllers) {
        // TODO use dispatch
        app.viewHelper.triggerCustomevents(evt, controllers);
        var target = $(evt.target),
            uids   = null,
            search = null,
            found  = false;

        uids = evt.pseudo ? '*' : app.viewHelper.getUids(target);

        if(!controllers) {
            controllers = app.controllerHelper.get(uids);
        }

        for (var index = controllers.length - 1; index >= 0; index--) {
            search = app.viewHelper.checkForEvent(controllers[index], evt, target);
            if (search !== null) {
                found = true;
                if(search === false) {
                    break;
                }
            }
        }

        if (found) {
            if (!evt.pseudo) {
                if(_.isFunction(evt.stopPropagation)) {
                    evt.stopPropagation();
                }
                if(_.isFunction(evt.preventDefault)) {
                    evt.preventDefault();
                }
                return search;
            } else {
                return controllers;
            }
        } else {
            if (evt.pseudo) {
                console.info('There couldnt be found a eventdefinition', evt);
            }
            return controllers;
        }
    },
    activateDirty: function() {
        this.dirtyHandling = true;
        runloop.addJob(new Job({
            interval: 1,
            type: 'execute',
            callback: app.viewHelper.checkDirty
        }));
    },
    checkDirty: function() {
        var controllers = app.controllerHelper.get('*');
        for(var i = 0; i < controllers.length; i++) {
            var controller = controllers[i];
            if(controller.view._dirty) {
                controller.view._dirty = false;
                controller._render(controller.content, true);
            }
        }
    },
    addTemplates: function(result) {
        window.JST = {};
        for(var index in result) {
                if(result.hasOwnProperty(index)) {
                        var filename = 'templates/' + index;
                        var options = {filename: filename, compileDebug: false};
                        var included = this.addTemplateIncludes(result, index);
                        JST[filename] = jade.compile(included, options);
                }
        }
    },
    addTemplateIncludes: function(templates, current) {
        var lines   = templates[current].split('\n');
        var result  = "";
        var keyword = 'include';
        for(var i = 0; i < lines.length; i++) {
            var pos = lines[i].search(keyword);
            if(pos != -1) {
                var path = lines[i].substr(pos + keyword.length + 1, lines.length + 1);
                if(current != path) {
                    if(templates[path]) {
                        result += templates[path];
                    } else {
                        console.error('Template ' + path + ' does not exist');
                    }
                } else {
                    console.error('You were trying to include yourself');
                }
            } else {
                result += lines[i] + '\n';
            }
        }

        templates[current] = result;
            if(result.search(keyword) == -1) {
                return result;
            } else { // Needed if inside the included files are includes
                // @TODO test if it works
                return this.addTemplateIncludes(templates, current);
            }
    }
};
app.Controller('content-globalsearch', {

    init: function() {
        this.set('resultList', []);
        this.set('languages', app.languages);
        this.set('defaultLanguage', app.defaultLanguage);

        var searchValue = app.cookie.get({cname: 'globalSearchValue'});
        var searchType  = app.cookie.get({cname: 'globalSearchType'});

        if(searchValue && searchValue !== NaN && searchValue !== "NaN" && searchValue.length > 0) {
            this.set('searchValue', searchValue);
        } else {
            this.set('searchValue', '');
        }

        if(searchType && searchType !== NaN && searchType !== "NaN" && searchType.length > 0) {
            this.__fillResultList(searchValue, searchType);
        }
    },


    ///////////////////////////////////////////////////////////////////
    // collecting the ids of all changed translations
    //////////////////////////////////////////////////////////////////
    changedTranslationsCollector: function(data, evt, target) {
        var id              = data.target;
        var translations    = app.allTranslations;
        var defaultLanguage = app.defaultLanguage;
        var string          = target.val();
        var comparison      = null;
        var changedTrans    = app.changedTranslations || [];

        for(var i in translations) {
            if(i == id) {
                comparison = translations[i].texts[defaultLanguage.id];
                
                if(string != comparison) {
                    changedTrans.push(id);
                    translations[i].texts[defaultLanguage.id] = string;
                    app.changedTranslations = changedTrans;
                    app.translations = translations;
                    this.trigger('showSaveButtonBar', {});
                } else {
                    for(var x in changedTrans) {
                        var index = changedTrans[x].indexOf(id);
                        if(index >= 0) {
                            changedTrans.splice(index, 1);
                        }
                    }
                    if(changedTrans.length == 0) this.trigger('hideSaveButtonBar');
                    app.changedTranslations = changedTrans;
                }
            }
        }
    },

    checkTranslation: function(data, evt, target) {
        var parent       = target.closest('dd');
        var checked      = true;
        var id           = parseInt(data.target);
        var key          = parseInt(data.key);
        var trans        = app.allTranslations; 
        var languages    = app.languages;
        var changedTrans = app.changedTranslations || [];

        parent.toggleClass('checked');
        
        if(target.hasClass('checked')) {
            checked = false;
        }
        
        for(var i in trans) {
            if(i == id) {
                for(var j in languages) {
                    if(key == languages[j].id) {
                        trans[i].checks[languages[j].id] = checked;
                    }
                }
            }
        }

        changedTrans.push(id);
        app.changedTranslations = changedTrans;
        this.trigger('showSaveButtonBar', {});
    },


    ///////////////////////////////////////////////////
    // Search part triggered on keyup in search field
    //////////////////////////////////////////////////
    startGlobalSearch: function(data, evt, target) {
        var search = $('#global-search-filter').val();

        $('#clear-search-filter').show();
        if(search) {
            if(evt.which == 13) {
                var index = $('.global-search-autocomplete-value.selected').attr('title');
                if(index && index != undefined) {search = index;}
                this.__fillResultList(search, 'all');
            } else if(evt.which != 38 && evt.which != 40) {
                this.__generateGlobalSearchAutocomplete(search);
                $('#clear-search-filter').show();
            }
        }
    },

    __generateGlobalSearchAutocomplete: function(search) {
        var translations           = app.allTranslations;
        var defaultLanguage        = app.defaultLanguage;
        var counter                = 0;
        var autocompleteTransArray = [];
        var autocompleteKeyArray   = [];

        for(var i in translations) {
            if(counter < 10) {
                var exists = false;
                var str    = translations[i].texts[defaultLanguage.id];
                var key    = translations[i].namespace+'.'+translations[i].name;

                for(var i in autocompleteTransArray) {
                    var compare = autocompleteTransArray[i];
                    var index = compare.indexOf(str);
                    if(index >= 0) {
                        exists = true;
                    }
                }

                if(str && str.startsWith(search) && !exists) {
                    autocompleteTransArray[counter] = str;
                    ++counter;
                } else if(key && key.startsWith(search)) {
                    autocompleteKeyArray[counter] = key;
                    ++counter;
                } else if(str && str.indexOf(search) > 0 && !exists) {
                    autocompleteTransArray[counter] = str;
                    ++counter;
                } else if(key && key.indexOf(search) > 0) {
                    autocompleteKeyArray[counter] = key;
                    ++counter;
                }
            }
        }

        /*var options = {
          keys: ['defaultText', "key"],
          includeScore: true,
          threshold: 0.0,
          location: 0,
          distance: 100
        };
        var f = new Fuse(translations, options);
        var result = f.search(search);
        console.log(result);*/

        this.__buildGlobalAutocompleteDropDown(autocompleteTransArray, autocompleteKeyArray);
    },

    __buildGlobalAutocompleteDropDown: function(transarray, keyarray) {
        this.clearSearchAutocomplete();
        this.searchResultCounter = 0;
        var trans = '<div class="global-autocomplete-section-header"><b>Translations</b></div>';
        for(var i in transarray) {
            trans += "<div class='global-search-autocomplete-value string' title='"+transarray[i]+"' data-id='"+this.searchResultCounter+"'>"+transarray[i]+"</div>";
            this.searchResultCounter++
        }
        $('.global-search-autocomplete-panel').append(trans);
        var key = '<div class="global-autocomplete-section-header"><b>Keys</b></div>';
        for(var i in keyarray) {
            key += "<div class='global-search-autocomplete-value key' title='"+keyarray[i]+"' data-id='"+this.searchResultCounter+"'>"+keyarray[i]+"</div>";
            this.searchResultCounter++;
        }
        $('.global-search-autocomplete-panel').append(key);
    },

    navigateSearchResults: function(data, evt, target) {
        if(evt.keyCode == 38 || evt.keyCode == 40) {
            var pos               = target.selectionStart;
            target.value          = (evt.keyCode == 38?1:-1)+parseInt(target.value,10);        
            target.selectionStart = pos; 
            target.selectionEnd   = pos;

            var dir               = 'down';

            if(evt.keyCode == 38) {dir = 'up';}

            this.__navigateResults(dir);
            evt.preventDefault();
        }
    },

    __navigateResults: function(dir) {
        var index = $('.global-search-autocomplete-value.selected').attr('data-id');
        $('.global-search-autocomplete-value').removeClass('selected');

        if(index && index != undefined) {
            index = parseInt(index);
            if(index < this.searchResultCounter && index >= 0) {
                if(dir == 'down') {++index;} else {--index;}
                $('.global-search-autocomplete-value[data-id="'+index+'"]').addClass('selected');
            }
            
        } else {
             if(dir == 'down') {index = 0;} else {index = this.searchResultCounter-1;}
             console.log(index);
            $('.global-search-autocomplete-value[data-id="'+index+'"]').addClass('selected');
        }
    }, 

    selectValueFromAutocomplete: function(data, evt, target) {
        var text  = target.text();
        var value = 'string';

        if(target.hasClass('key')) {
            value = 'key';
        }
        this.__fillResultList(text, value);
    },

    clearSearch: function() {
        this.set('searchValue', '');
        this.set('resultList', []);
        app.cookie.set({cname: 'globalSearchValue', content: ''});
        app.cookie.set({cname: 'globalSearchType', content: ''});
    },

    clearSearchAutocomplete: function() {
        $('.global-search-autocomplete-panel').empty();
    },

    __fillResultList: function(search, value) {
        var translations    = app.allTranslations;
        var defaultLanguage = app.defaultLanguage;
        var resultList      = [];
        var counter         = 0;

        for(var x in translations) {
            var str    = translations[x].texts[defaultLanguage.id];
            var key    = translations[x].namespace+'.'+translations[x].name;


            if(search.startsWith(':')) {
                var id = parseInt(search.split(':')[1], 10);
                var isInt = this.isInt(id);
                if(x == (id-1)) {
                    resultList[counter] = translations[id-1];
                    ++counter;
                }
            } else {
                if(value == 'string') {
                    if(str && str.indexOf(search) >= 0) {
                        resultList[counter] = translations[x];
                        ++counter;
                    }
                } else if(value == 'key') {
                    if(key && key.indexOf(search) >= 0) {
                        resultList[counter] = translations[x];
                        ++counter;
                    }

                } else if (value = 'all') {
                    if(str && str.indexOf(search) >= 0) {
                        resultList[counter] = translations[x];
                        ++counter;
                    }
                    if(key && key.indexOf(search) >= 0) {
                        resultList[counter] = translations[x];
                        ++counter;
                    }
                }
            }

        }

        app.cookie.set({cname: 'globalSearchValue', content: search});
        app.cookie.set({cname: 'globalSearchType', content: value});
        this.set('searchValue', search);
        this.set('resultList', resultList);
    },

    isInt: function(n) {
       return n % 1 === 0;
    },

    setLanguages: function(opt) {
        var languages = opt.languages;
        app.languages = languages;

        this.setSelectedLanguages();
    },

    setSelectedLanguages: function() {
        var languages     = app.languages;
        var selectedArray = [];
        var counter       = 0;

        for(var i in languages) {
            if(languages[i].selected) {
                selectedArray.push(i);
                counter++;
            }
        }

        var str = selectedArray.join(',');

        app.selectedLanguages = str;
        app.cookie.set({cname: 'selectedLanguages', content: str});

        this.__hideShowTranslations();
    },

    setGlobalDefaultLanguage: function() {
        this.set('defaultLanguage', app.defaultLanguage);
    },


    ////////////////////////////////////////////////////////////////
    // Display Dialogue according to clicked panel
    ///////////////////////////////////////////////////////////////
    showDialogue: function(data, evt, target) {
        var id = data.id;

        var defaultLanguage = app.defaultLanguage;
        var translations    = app.allTranslations;
        var languages       = app.languages;
        var count           = app.count;

        this.trigger('showOverlay', {
            index: parseInt(id),
            defaultLanguage: defaultLanguage,
            translations: translations,
            languages: languages,
            count: count
        });
    },


    ///////////////////////////////////////////////////////////////////
    // Save or Discard changes
    //////////////////////////////////////////////////////////////////
    saveTranslations: function() {
        this.trigger('saveData', {});
        //this.trigger('updateDom');
    },

    discardTranslations: function() {
        app.changedTranslations = [];
        this.trigger('hideSaveButtonBar');
    },

    ///////////////////////////////////////////////////////////////////
    // Save or Discard changes
    //////////////////////////////////////////////////////////////////
    showStandardDialogue: function(opt) {
        this.set('standardMessage', opt.message);
        this.set('standardDialog', true);
        this.set('showDialog', true);
    },


    __hideShowTranslations: function() {
        var selectedLanguages = app.selectedLanguages;
        var languageArray     = selectedLanguages.split(',');

        $('.item-panel').each(function() {
            var self          = $(this);
            var translations  = self.find('.translation-field');

            translations.each(function() {
                var trans     = $(this);
                var key       = trans.attr('data-target');

                trans.addClass('hidden');
                for(var i in languageArray) {
                    if(languageArray[i] == key) {
                        if(trans.hasClass('hidden')) {
                            trans.removeClass('hidden');
                        }
                    }
                }
            });
        });
    },
});
app.Controller('content-wrapper', {
    init: function() {
        var self = this;
        app.apiAdapter.getCurrentUser(function(res, message) {
            res = JSON.parse(res);
            if(res.role === 'admin') {
                self.set('admin', true);
                self.__initHashCheck();
            }
            self.set('currentUser', res.name);
        }, function(res, message) {
            console.error('currentUser', res, message);
        });
        app.apiAdapter.getData(function(res) {
            self.__getCookieData(res);
        }, function(res, message) {
            if(message == 'error') {
                if(res.status == 404 && res.responseText == 'no such project') {
                    app.apiAdapter.createProject('ion-u', function(r, m) {
                        console.log('createProject', r, m);
                        self.init();
                    }, function(res, message) {
                        console.error('createProject', r, m);
                    });
                }
            }
        });
    },

    updateView: function() {
        var self = this;

        app.apiAdapter.getData(function(res) {
            self.init();
            self.trigger('updateThis');
        });
    },


    ////////////////////////////////////
    // Handle hashchange
    ///////////////////////////////////
    __initHashCheck: function() {
        var hash = window.location.hash;
        if(hash === '#usermanagement') {
            if(app.meta.userManagement === true && this.get('admin') === true) this.set('usermanagementopen', true);
        }
    },

    checkHash: function() {
        var hash = window.location.hash;
        if(hash === '#usermanagement') {
            if(app.meta.userManagement === true && this.get('admin') === true) $('#usermanagement-container').addClass('open');
        } else {
            $('#usermanagement-container').removeClass('open');
        }
    },


    ////////////////////////////////////////////////////////////////////////////////
    // Collect all the cookie data and set ion values as well as rendering the dom
    ///////////////////////////////////////////////////////////////////////////////
    __getCookieData: function(res) {
        var cookiesEnabled     = navigator.cookieEnabled;
        if(!cookiesEnabled) {
            console.log('no cookies enabled');
        }
        var defaultLanguageKey = app.cookie.get({cname: 'defaultLanguageKey'});
        var selectedLanguages  = app.cookie.get({cname: 'selectedLanguages'});
        var locale             = app.cookie.get({cname: 'locale'});
        var selectedLocale     = app.cookie.get({cname: 'selectedLocale'});
        var resolution         = parseInt(app.cookie.get({cname: 'resolution'}));
        var page               = parseInt(app.cookie.get({cname: 'currentPage'}));
        var languages          = app.languages;
        

        // Getting the selectedLanguages value for dom panels 
        if(selectedLanguages && selectedLanguages !== NaN && selectedLanguages !== "NaN") {
            app.selectedLanguages = selectedLanguages;
        } else {
            app.selectedLanguages = 'en_gb';
            app.cookie.set({cname: 'selectedLanguages', content: app.selectedLanguages});
        }

        // Getting the defaultLanguage value for dom panels 
        if(locale && locale !== NaN && locale !== "NaN") {
            app.locale        = locale;
        } else {
            app.locale        = 'en_gb';
        }

        // Getting the defaultLanguage value for dom panels 
        if(selectedLocale && selectedLocale !== NaN && selectedLocale !== "NaN") {
            app.selectedLocale         = selectedLocale;
            this.set('selectedLocale', selectedLocale);
        } else {
            app.selectedLocale         = 'en_gb';
            this.set('selectedLocale', 'en_gb');
        }

        // Getting the defaultLanguage value for dom panels 
        if(resolution && resolution !== NaN) {
            app.resolution = resolution;
            this.set('resolution', resolution);
        } else {
            app.resolution = 250;
            this.set('resolution', 250);
        }

        // Getting the defaultLanguage value for dom panels 
        if(page && page !== NaN) {
            app.currentPage = page;
            this.set('currentPage', page);
        } else {
            app.currentPage = 0;
            this.set('currentPage', 0);
        }

        var selected = app.selectedLanguages.split(',');
        for(var i in languages) {
            var checked = false;
            for(var j in selected) {
                if(selected[j] == i) {
                    checked = true;
                }
            }
            languages[i].selected = checked;
        }
        app.languages = languages;

        app.project         = res;
        app.projectname     = res.pid;
        app.defaultLocale   = res.defaultlocale;
        app.languages       = res.locales;

        app.count           = Object.size(res.translations);

        app.allTranslations = this.__enrichTranslations(res.translations);

        this.set('locales', this.mapLocales(res.locales));

        this.set('project', res.pid);
        this.set('translations', this.__enrichTranslations(res.translations));
        this.set('defaultLocale', res.defaultlocale);
    },

    __enrichTranslations: function(res) {
        var counter      = 0;
        var translations = _.cloneDeep(res);
        var selectedItem = app.cookie.get({cname: 'selectedItem'});
        
        for(var i in translations) {
            translations[i].id       = counter;
            translations[i].selected = false;
            counter++;
        }

        return translations;
    },


    //////////////////////////////////////////////////////
    // Get and set all data necessary for dom rendering
    /////////////////////////////////////////////////////
    mapLocales: function(locales) {
        var localesObj   = app.locales;
        var localesArray = [];

        for(var i in locales) {
            locale          = {};
            locale.id       = parseInt(i); 
            locale.key      = locales[i];
            locale.selected = false;

            for(var j in localesObj) {
                if(locales[i] == localesObj[j]) {
                    locale.title = j;
                }
            }
            localesArray.push(locale);
        }

        app.locales = localesArray;

        return app.locales;
    },

});
app.Controller('items-activityindicator', {

    /*init: function() {
        this.set('loading', false);
    },*/

    toggleLoading: function(opt) {
        this.set('loading', opt.flag);
    }

});
app.Controller('items-addpanel', {
    approveKey: function() {
        var translations = app.allTranslations;
        var key          = this.view.obj('keyInput');
        var translation  = this.view.obj('translationInput');

        if(key.val() === '') {
            key.val('').addClass('error');
            key.attr('placeholder', 'Pleas add a key.');
        } else if(translation.val() === '') {
            translation.val('').addClass('error');
            translation.attr('placeholder', 'Pleas add a key.');
        } else if(translations[key.val()] !== undefined) {
            key.val('').addClass('error');
            key.attr('placeholder', 'Key already exists.');
        } else {
            this.__addKey();
        }
    },

    __addKey: function(data, evt, target) {
        var key   = this.view.obj('keyInput');
        var value = this.view.obj('translationInput');
        var self  = this;

        app.apiAdapter.putLocale(key.val(), 'en_gb', value.val(), function(res, msg) {
            console.log('__addKey', res, msg);
            text = "Translation successfully added!";
            self.trigger('showNotification', {text: text, type: 'success', time: 5});
            self.trigger('updateView');
            self.view.closeAddPanel();
        }, function(res, msg) {
            console.error('__addKey', res, msg);
            text = "Translation could not be set: "+msg;
            self.trigger('showNotification', {text: text, type: 'error', time: 5});
        });
    },
});
app.Controller('items-item', {

    init: function() {
        var itemVisible       = app.cookie.get({cname: 'itemVisible'});

        if(itemVisible && itemVisible !== NaN && itemVisible !== "NaN" && itemVisible.length > 0 && itemVisible == 'true') {
            this.getItemId();
        }
    },

    toggleShowItem: function(payload) {
        if(payload.show === true) {
            this.__showItem(payload);
        } else if(payload.show === false) {
            this.closeItemView();
        }
    },

    getItemId: function() {
        var itemId = app.cookie.get({cname: 'selectedItem'});

        if(itemId && itemId !== NaN && itemId !== "NaN" && itemId.length > 0) {
            var id = itemId;
            this.__showItem({index: id});
        }
    },

    closeItemView: function() {
        //this.set('displayItem', false);
        $('#item').removeClass('opening isOpened').addClass('closing');
        var self = this;
        setTimeout(function() {
            self.set('displayItem', false);
        }, 300);
        this.changed = false;
        app.cookie.set({cname: 'itemVisible', content: ''});
    },


    ///////////////////////////////////////////////////////////////////
    // load all the data for desired translation
    //////////////////////////////////////////////////////////////////
    __showItem: function(options) {
        var id = parseInt(options.index);
        this.__itemData(id);
        //this.set('showItem', true);
        var self = this;
        setTimeout(function() {
            $('#item').removeClass('isClosed').addClass('opening');
        }, 100);
        setTimeout(function() {
            self.set('displayItem', true);
        }, 300);

        app.cookie.set({cname: 'selectedItem', content: id});
        app.cookie.set({cname: 'itemVisible', content: true});
    },

    __itemData: function(id) {
        var selectedLocale = app.selectedLocale;
        var locales        = app.locales;
        var translations   = app.allTranslations;
        var languages      = app.languages;


        for(var i in translations) {
            if(translations[i].id == id) {
                var key = i;
                var defaultText = translations[i].mapping[selectedLocale];

                this.__fillOpenedLanguages();

                //this.__iterateSelectedLanguages();
                this.set('key', i);
                this.set('index', id);
                this.set('count', translations.length);
                this.set('languages', languages);
                this.set('defaultText', defaultText);
                //this.set('selectedText', defaultText);
                this.set('translation', translations[i]);
                this.set('footerindex', id+1);
                this.set('selectedLocale', selectedLocale);
                this.set('defaultLocaleId', app.defaultLocale);
                this.set('selectedLocaleId', selectedLocale);
                this.set('count', app.count);
                this.set('locales', app.locales);
                //this.set('selectedLanguage', app.defaultLanguageKey);
                //this.set('selectedLanguages', app.selectedLanguages);
                //this.set('defaultLanguageTitle', defaultLanguage.name);
                //this.set('selectedLanguageTitle', defaultLanguage.name);
            }
        }
    },

    __fillOpenedLanguages: function() {
        var languages = app.selectedLanguages.split(',');
        app.openedLanguages = languages;
        if(app.openedLanguages.length == 0) {
            app.openedLanguages.push(app.defaultLocale);
        }
        this.set('selectedLanguages', app.openedLanguages);
    },

    __setSelectedLanguages: function(data) {
        var lang      = data.target;
        var counter   = 0;
        var languages = this.get('selectedLanguages');
        
        var index = languages.indexOf(lang);

        if(index >= 0) {
            languages.splice(index, 1);
        } else {
            languages.push(data.target);
        }
        var string          = languages.join(',');
        app.openedLanguages = languages;

        app.cookie.set({cname: 'selectedLanguages', content: string});
        this.set('selectedLanguages', languages);
    },

    toggleLocale: function(opt) {
        var languages = app.languages;
        var id        = this.get('index');

        for(var i in languages) {
            if(opt.key == languages[i]) {
                app.defaultLanguage    = languages[i];
                app.defaultLanguageKey = i;
                app.selectedLocale     = languages[i];
                this.set('selectedLocale', languages[i]);
                this.__itemData(parseInt(id));
                this.set('selectedLanguages', app.openedLanguages);
            }
        }
    },


    ///////////////////////////////////////////////////////////////////
    // load next or previous translation
    //////////////////////////////////////////////////////////////////
    navigate: function(data) {
        var direction          = parseInt(data.id);
        var selectedLocale     = this.get('selectedLocale');
        var translations       = app.allTranslations;
        var languages          = this.get('languages');
        var defaultLanguageId  = this.get('defaultLanguageId');
        var selectedLanguageId = this.get('selectedLanguageId');

        for(var i in translations) {
            if(translations[i].id == direction) {
                var key         = i;
                var defaultText = translations[i].mapping[selectedLocale];
                //var selectedText = translations[i].texts[selectedLanguageId];

                this.set('key', key);
                this.set('defaultText', defaultText);
                //this.set('selectedText', selectedText);
                this.set('footerindex', direction+1);
                this.set('index', direction);
                this.set('translation', translations[i]);

                app.cookie.set({cname: 'selectedItem', content: direction});
                this.trigger('updatePage', {id: direction});
                this.trigger('scrollToNavigatedItem');
            }
        }
    },


    ///////////////////////////////////////////////////////////////////
    // collecting the ids of all changed translations
    //////////////////////////////////////////////////////////////////
    updateTranslationOnFocusout: function(data, evt, target) {
        var key             = this.get('key');
        var selectedLocale  = this.get('selectedLocale');
        var locale          = data.target;
        var translations    = _.cloneDeep(app.allTranslations);
        var defaultLanguage = app.defaultLanguage;
        var string          = target.val();

        for(var i in translations) {
            if(i == key) {
                translations[i].mapping[locale] = string;
            }
            if(locale == selectedLocale) {
                this.view.obj('defaultText').text(string);
            }
        }
        app.allTranslations = translations;
        app.apiAdapter.putLocale(key, locale, string, function(res) {
        })
    },

    checkedTranslation: function(data, evt, target) {
        var id                = parseInt(data.target);
        var trans             = app.allTranslations;
        var lang              = app.languages;
        var changedTrans      = app.changedTranslations || [];
        var checked           = this.get('checked');
        var defaultLanguageId = this.get('defaultLanguageId');

        for(var i in trans) {
            if(trans[i].identifier == id) {
                for(var j in lang) {
                    if(lang[j].id == defaultLanguageId) {
                        trans[i].checks[lang[j].id] = !checked;
                    }
                }
            }
        }

        changedTrans.push(id);
        app.changedTranslations = changedTrans;
        app.allTranslations     = trans;
        this.set('checked', !checked);
    },

    ///////////////////////////////////////////////////////////////////
    // Save or Discard changes
    //////////////////////////////////////////////////////////////////
    saveTranslations: function() {
        this.trigger('saveData', {});
        //this.trigger('updateDom');
    },

    discardTranslations: function() {
        this.closeOverlay();
    },

    saveChanges: function() {
        this.saveTranslations();
        this.trigger('updateThis', { login: false });
    },

    discardChanges: function() {
        this.discardTranslations();
        this.trigger('handleLog', { login: false });
    },

    ///////////////////////////////////////////////////////////////////
    // Save or Discard changes
    //////////////////////////////////////////////////////////////////
    showStandardDialogue: function(opt) {
        this.set('standardMessage', opt.message);
        this.set('standardDialog', true);
        this.set('showDialog', true);
    },
});
app.Controller('items-list', {
    update: false,

    init: function() {
        this.trigger('toggleLoading', {flag: true});

        this.filterTranslations();
        this.__scrollToSelected();
        this.trigger('toggleLoading', {flag: false});
    },

    updateThis: function() {
        this.set('update', !this.update);
        this.filterTranslations();
        this.update = !this.update;
    },

    toggleLocale: function(opt) {
        var languages       = app.languages;

        for(var i in languages) {
            if(opt.key == languages[i]) {
                this.set('selectedLocale', languages[i]);
                this.__scrollToSelected();
            }
        }
    },


    /////////////////////////////////////////////////////////////////
    // Creating string of all selected languages to save in cookie
    ////////////////////////////////////////////////////////////////
    setSelectedLanguages: function() {
        var languages     = app.languages;
        var selectedArray = [];
        var counter       = 0;

        for(var i in languages) {
            if(languages[i].selected) {
                selectedArray.push(i);
                counter++;
            }
        }

        var str = selectedArray.join(',');

        app.selectedLanguages = str;
        app.cookie.set({cname: 'selectedLanguages', content: str});
    },


    ///////////////////////////////////////////////////////////////
    // Setting of global variables called by differnet controller
    //////////////////////////////////////////////////////////////
    setLanguages: function(opt) {
        var languages = opt.languages;
        app.languages = languages;

        this.setSelectedLanguages();
    },

    setItems: function(opt) {
        app.translations = opt.translations || app.allTranslations;
        app.languages    = opt.languages    || app.languages;
    },


    ////////////////////////////////////////////////////////////////
    // Creating array of all translations that fit the filter data
    ///////////////////////////////////////////////////////////////
    filterTranslations: function() {
        var translationsArray          = [];
        var filteredTranslationsObject = {};
        var filter                     = app.cookie.get({cname: 'globalSearchValue'});
        var translations               = app.allTranslations;
        var localeId                   = app.selectedLocale;
        var length                     = Object.size(translations);

        if(filter && filter != '' && filter != null && filter != undefined) {
            var counter = 0;
            
            for(var i in translations) {
                var key    = i;
                var str    = translations[i].mapping[localeId];
                var exists = false;


                if(key && key.startsWith(filter)) {
                    filteredTranslationsObject[key] = translations[i];
                } else if(key && key.indexOf(filter) > 0) {
                    filteredTranslationsObject[key] = translations[i];
                } else if(str && str.startsWith(filter)) {
                    filteredTranslationsObject[key] = translations[i];
                } else if(str && str.indexOf(filter) > 0) {
                    filteredTranslationsObject[key] = translations[i];
                }
                counter++;

                if(counter == length) {
                    app.filteredTranslationsObject = filteredTranslationsObject;

                    this.__paginateTranslations(filteredTranslationsObject);
                }
            }

        } else {
            app.filteredTranslationsObject = translations;
            this.__paginateTranslations(translations);
            if(Object.size(translations) == 0) {
                this.set('pagedTranslationsLength', 0);
            }
        }
    },

    __paginateTranslations: function(translations) {
        var resolution        = this.get('resolution');
        var page              = this.get('currentPage');
        var pagedTranslations = {};
        var size              = Object.size(translations);
        var counter           = 0;
        var pager             = [];
        var min               = page === 0 ? 0 : resolution*page;
        var max               = resolution*(page+1);

        var maxNumberOfPages  = Math.ceil(size/resolution);

        for(var i = 1; i <= maxNumberOfPages; i++) pager.push(i);

        if(size < resolution) {
            resolution = size;
            min = 0
            max = Object.size(app.allTranslations);
        } else if(max > size) {
            max = size;
            resolution = max - min;
        }

        for(var t in translations) {
            if(translations[t].id >= min && translations[t].id < max) {
                pagedTranslations[t] = translations[t];
                counter++;
            }

            if(counter == resolution) {
                app.pagedTranslations = pagedTranslations;
                app.pager             = pager;

                this.set('pagedTranslations', pagedTranslations);
                this.set('pager', pager);
                    
                if(Object.size(translations) == 1) {
                    this.showSelectedItem({id: translations[t].id});
                }

                return;
            }
        }
    },

    changePage: function(data, evt, target) {
        var id   = data.target;
        var page = this.get('currentPage');
        var newPage;

        if(id == 'previous') {
            newPage = page-1;
        } else if(id == 'next') {
            newPage = page+1;
        } else {
            id = parseInt(id);
            if(page !== id) {
                newPage = id;
            }
        }

        if(page !== newPage && newPage !== NaN && newPage !== undefined && newPage !== null) {
            app.cookie.set({cname: 'currentPage', content: newPage});
            app.currentPage = newPage;
            this.set('currentPage', newPage);
            this.__paginateTranslations(app.filteredTranslationsObject);
        }
    },

    __updatePage: function(payload) {
        if(payload.id) {
            var resolution = this.get('resolution');
            var page       = parseInt(payload.id/resolution);

            if(page !== app.currentPage) this.changePage({target: page});
        }
    },


    ////////////////////////////////////////////////////////////////
    // Display Dialogue according to clicked panel
    ///////////////////////////////////////////////////////////////
    showSelectedItem: function(data, evt, target) {
        var id              = parseInt(data.id);

        var defaultLanguage = app.defaultLanguage;
        var translations    = app.allTranslations;
        var languages       = app.languages;
        var count           = app.count;

        this.trigger('toggleShowItem', {
            show: true,
            index: id,
            defaultLanguage: defaultLanguage,
            translations: translations,
            languages: languages,
            count: count
        });

        for(var i in translations) {
            translations[i].selected = false;
            if(translations[i].id == id) {
                translations[i].selected = true;
            }
        }

        app.allTranslations = translations;

        $('dl').removeClass('selected');
        $('dl[data-id="'+id+'"]').addClass('selected');
    },

    __scrollToSelected: function() {
        var selectedItem = app.cookie.get({cname: 'selectedItem'});

        if(selectedItem && selectedItem !== NaN && selectedItem !== "NaN" && selectedItem.length > 0) {
            $('.item-panel dl').removeClass('selected');
            setTimeout(function() {
                var id = parseInt(selectedItem);
                for(var i in app.allTranslations) {
                    if(app.allTranslations[i].id == id) app.allTranslations[i].selected = true;
                }
                $('#item-list').scrollTop($('.item-panel[data-id="'+id+'"]').position().top - 40);
                $('.item-panel[data-id="'+id+'"] dl').addClass('selected');
            }, 500);
        }
    },


    ///////////////////////////////////////////////////////////////////
    // delete item
    //////////////////////////////////////////////////////////////////
    deleteItem: function(data, evt, target) {
        var self         = this;
        var translations = app.allTranslations;
        var locales      = [];
        this.view.toggleDelete({id: data.target});

        for(var i in translations) {
            if(i == data.target) {
                var mapping = translations[i].mapping;
                for(var x in mapping) {
                    locales.push(x);
                }
            }
        }
        app.apiAdapter.deleteKey(data.target, locales, function(res) {
            if(res === true) {
                target.closest('.item-panel').animate({
                    opacity: 0.25,
                    left: "+=50",
                    height: "toggle"
                }, 200, function() {
                    this.remove();
                });
            }
        })
    },

    importInitFile: function() {
        var fileInput = this.view.obj("input");
        var newFile   = fileInput.prop('files')[0];
        var filename  = newFile.name;
        var filetype;
        if (filename.substr(-4) == '.json') {
            filetype = 'json';
            filename = filename.slice(0,-4);
        }
        var textType = /.json/;
        var existant = false;
        var files    = this.get('files') || [];
        var text, i, file;
        for (i in files) {
            file = files[i];
            if (file.name==filename) {
                existant = true;
            }
        }
        
        if (newFile.type.match(textType)) {
            this.readInitFile(files, newFile);
        } else if (filetype=='json') {
            var self = this;
            var options = {
                title:   'Import URF',
                message: 'Please enter the password to decrypt the file:',
                input:   'password',
                cancel:  'Cancel',
                ok:      'Import',
                callback: function(result) {
                    if (result===false) return;
                    /*var password = result.input;
                    if (password) {
                        self.readInitFile(files, newFile, password);
                    } else {
                        text = 'You must enter a password to decrypt this file!';
                        this.trigger('setResponseContentDialog', text);
                    }*/
                    console.log(result);
                }
            };
            //this.trigger('showContentDialog', options);
        } else {
            text = "This file type is not supported!";
            this.trigger('showNotification', {text: text, type: 'danger', time: 5});
        }

        return false;
    },

    readInitFile: function (files, newFile, password) {
        var self     = this;
        var existant = false;
        var text, filename;
        var reader   = new FileReader();
        this.view.obj('noDataOverlay').removeClass('hidden');
        reader.onload = function(e) {
            var file = {};
            if (password) {
                // Dycrypt with user-password
                file.name = newFile.name.substr(0, newFile.name.length-4);
                file.data = app.crypter.aesDecrypt(reader.result, password);
            } else {
                file.name = newFile.name;
                file.data = reader.result;
            }

            if (file.data) {
                app.apiAdapter.uploadFile(file.name.split('.json')[0], file.data, function(res, msg) {
                    text = "File correctly loaded!";
                    self.trigger('showNotification', {text: text, type: 'success', time: 5});
                    self.trigger('updateView');
                    self.view.obj('noDataOverlay').addClass('hidden');
                }, function(res, msg) {
                    console.error(res, msg);
                    text = "File not uploaded: "+msg;
                    self.trigger('showNotification', {text: text, type: 'error', time: 5});
                })
            } else {
                text = 'Import failed. Your file seems to not have the correct data.';
                //self.trigger('setResponseContentDialog', text);
            }
        };
        reader.readAsText(newFile);
    },

});
app.Controller('login-login', {

    loginOnKeyup: function(data, evt, target) {
        if(evt.which == 13) {
            this.login();
        } else {
            this.view.obj('username').removeClass('error');
            this.view.obj('password').removeClass('error');
        }
    },

    login: function() {
        var username = this.view.obj('username').val();
        var password = this.view.obj('password').val();

        if (username === '') {
            this.view.obj('username').addClass('error');
            this.view.obj('username').attr('placeholder', 'Username is missing');
        } else if (password === '') {
            this.view.obj('password').addClass('error');
            this.view.obj('username').attr('placeholder', 'Password is missing');
        } else {
            this.checkLogin(username, password);
        }
    },

    checkLogin: function(username, password) {
        var self = this;
        var data = {username: username, password: password};

        app.apiAdapter.login(
            data, 
            function(jqXHR, exception) {
                console.log('checkLogin', jqXHR, exception);
                if((exception && exception == 'success') || jqXHR.status == 200) {
                    self.trigger('toggleLoggedIn', {flag: true});
                    app.cookie.set({cname: 'user', content: 'commscope'});
                    app.cookie.set({cname: 'logged_in', content: 1});
                    app.cookie.set({cname: 'usertoken', content: '73r253jcb1p3e423h3vptngr6qqpt'});
                }
            },
            function(jqXHR, exception) {
                console.error('checkLogin', jqXHR, exception);
                if((exception && exception == 'success') || jqXHR.status == 200) {
                    self.trigger('toggleLoggedIn', {flag: true});
                    app.cookie.set({cname: 'user', content: 'commscope'});
                    app.cookie.set({cname: 'logged_in', content: 1});
                    app.cookie.set({cname: 'usertoken', content: '73r253jcb1p3e423h3vptngr6qqpt'});
                } else {
                    self.view.obj('root').find('.error-message').removeClass('hidden');
                }
            }
        );
    },
});
/*
    List of all available app.* variables for global use

    app.tree                       = array, to instantiate the tree view
    app.state                      = string, of saved states on server for creating stateArray
    app.stateArray                 = array, of all saved states on server

    app.languages                  = array, all available languages
    app.translations               = array, all translations in the language portal
    app.allTranslations            = array, all translations in the language portal globally hold for reset purposes
    app.defaultLanguage            = array, currently set default language
    app.defaultLanguageKey         = string, currently set default language key

    app.filter                     = string, of currently filtered key value
    app.selectedLangauges          = string, of all selected languages seperated by ',' to save in cookie 
    app.changedTranslations        = array, with all changed translations that need to be updated on save
    app.filteredTranslationsObject = array, with all filtered translations. Being used for dynamic dom creation and scrollbar

    app.count                      = int, count of all loaded translations
    app.minimum                    = int, id of the first visible and loaded translation, also used for scrollbar
    app.maximum                    = int, id of the last visible and loaded translation, also used for scrollbar
    app.oldMinimum                 = int, previous id of the first visible and loaded translation, also used for scrollbar
    app.oldMaximum                 = int, previous id of the last visible and loaded translation, also used for scrollbar
*/

app.Controller('main-main', {
    init: function() {
        this.globalSearch = false;
        this.__checkLogin();
        app.meta.title();
        app.meta.logs();
    },

    __checkLogin: function() {
        var self     = this;
        var user     = app.cookie.get({cname: 'user'});
        var loggedin = parseInt(app.cookie.get({cname: 'logged_in'}));
        var value    = false;

        if(loggedin && loggedin !== undefined && loggedin !== null && loggedin == 1) {
            this.apiLoggedInCheck();
        } else {
            this.trigger('toggleLoggedIn', {flag: false});
            app.apiAdapter.logout(function(res, message) {
                app.cookie.delete({cname: 'user'});
                app.cookie.delete({cname: 'logged_in'});
                app.cookie.delete({cname: 'usertoken'});
                self.toggleLoggedIn({flag: false});
            }, function(res, message) {
                console.log('logout out failed:', res, message);
            });
        }
    },

    apiLoggedInCheck: function() {
        var self = this;
        app.apiAdapter.checkLogin(
            function(jqXHR, exception) {
                if((exception && exception == 'success') || jqXHR.status == 200) {
                    self.trigger('toggleLoggedIn', {flag: true});
                    app.cookie.set({cname: 'user', content: 'commscope'});
                    app.cookie.set({cname: 'logged_in', content: 1, exdays: 0.25});
                    app.cookie.set({cname: 'usertoken', content: '73r253jcb1p3e423h3vptngr6qqpt'});
                }
            },
            function(jqXHR, exception) {
                console.error('apiLoggedInCheck', jqXHR, exception);
                if((exception && exception == 'success') || jqXHR.status == 200) {
                    self.trigger('toggleLoggedIn', {flag: true});
                    app.cookie.set({cname: 'user', content: 'commscope'});
                    app.cookie.set({cname: 'logged_in', content: 1, exdays: 0.25});
                    app.cookie.set({cname: 'usertoken', content: '73r253jcb1p3e423h3vptngr6qqpt'});
                } else {
                    self.__logout();
                }
            }
        );
    },

    __logout: function() {
        var self = this;

        app.apiAdapter.logout(function(res, message) {
            app.cookie.delete({cname: 'user'});
            app.cookie.delete({cname: 'logged_in'});
            app.cookie.delete({cname: 'usertoken'});
            self.toggleLoggedIn({flag: false});
        }, function(res, message) {
            console.log('logout out failed:', res, message);
        });
    },

    toggleLoggedIn: function(payload) {
        this.set('loggedIn', payload.flag);
    },


    ////////////////////////////////////
    // Handle log in and log out
    ///////////////////////////////////

    toggleSidebar: function() {
        this.trigger('openSidebar');
    },

   /* handleWaitloader: function(opt) {
        this.set('waitloader', opt.show);
    },*/


    /////////////////////////////
    // Adapter calls
    ////////////////////////////
    setGlobalState: function() {
        var json = {};
        var str  = window.location.href;
        var url  = str.substring(0,str.indexOf('#'))+'api/setstate';
        var hash = null;

        var dlang = 'en-gb',
            l     = app.selectedLanguages,
            open  = app.filter,
            tab   = app.tab;

        hash = '#cur=tree&dlang='+dlang+'&lang='+l+'&open='+open+'&tab='+tab;

        json['state'] = hash;

        app.apiAdapter.saveViewState({
            data: json,
            url: url,
            callback: function(res) {
                console.log('__getData', res);
            }
        });
    },

    saveData: function(payload) {
        var self = this;

        var data         = app.changedTranslations || [],
            translations = app.allTranslations || [],
            changes      = {},
            str          = window.location.href,
            url          = str.substring(0,str.indexOf('#'))+'api/update';

        for (var i = data.length - 1; i >= 0; i--) {
            obj = translations[data[i]];
            obj = {namespace: obj.namespace, name:obj.name, description: obj.description, texts: obj.texts, checks: obj.checks};
            changes[obj.namespace+'.'+obj.name] = obj;
        }
        changes = JSON.stringify(changes)

        app.apiAdapter.postData({
            data: changes,
            url: url,
            callback: function(res) {
                for(var i in app.allTranslations) {
                    var count = 0;
                    var done  = true;

                    for(var x in app.languages) {
                        count++;
                        if(app.allTranslations[i].texts[app.languages[x].id] === undefined || app.allTranslations[i].texts[app.languages[x].id] === '') {
                            done = false;
                        }

                        if(count == app.languagesCounter) {
                            app.allTranslations[i].done = done;
                        }
                    }
                }
                if(payload) payload.value;
            }
        });
    },
});
app.Controller('notification-notification', {
	
	showNotification: function (payload) {
		if (!payload.text) return;
		clearTimeout(this.timeout);
		this.alertClass = 'alert-' + payload.type;
		//this.set('options', { alertClass: this.alertClass + ' shown'});
		//this.set('message', payload.text);
		$('.notification').addClass(this.alertClass + ' shown');
		$('.notification .message').text(payload.text);
		if (payload.time) {
			var time = payload.time*1000;
			var self = this;
			this.timeout = setTimeout(function() {
				self.closeNotification();
			}, time);
		}
	},
	
	closeNotification: function () {
		// remove class 'shown' from alertClass
		$('.notification').removeClass(this.alertClass + ' shown');
		$('.notification .message').text('');
		//this.set('options', { alertClass: this.alertClass });
	}
});

app.Controller('search-search', {
    update: false,

    init: function() {
        this.set('clean', false);
        this.set('defaultLanguage', this.get('defaultLanguage'));

        app.allTranslations = this.get('translations');

        var searchValue = app.cookie.get({cname: 'globalSearchValue'});
        var searchType  = app.cookie.get({cname: 'globalSearchType'});
        var locale      = app.cookie.get({cname: 'selectedLocale'});

        if(searchValue && searchValue !== NaN && searchValue !== "NaN" && searchValue.length > 0) {
            app.filter = searchValue;
            this.set('searchValue', searchValue);
        } else {
            this.set('searchValue', '');
        }

        if(locale && locale !== NaN && locale !== "NaN" && locale.length > 0) {
            app.selectedLocale = locale;
            this.set('localeId', locale);
        } else {
            app.selectedLocale = 'en_gb';
            this.set('localeId', 'en_gb');
        }

        this.__mapLocale();
    },

    updateThis: function() {
        this.set('update', !this.update);
        this.update = !this.update;
    },


    ///////////////////////////////////////////////////////////////////
    // collecting the ids of all changed translations
    //////////////////////////////////////////////////////////////////
    mapLocale: function(value) {
        var cur     = this.get('locale');
        var locales = this.get('locales');
        var exists  = false, counter = 0;

        if(cur.toLowerCase() !== value.toLowerCase()) {
            for(var i in locales) {
                if(locales[i].title.toLowerCase()==value.toLowerCase()) {
                    this.changeLocale({target: locales[i].key});
                    exists = true;
                    this.trigger('filterTranslations', {});
                }
                counter++;
                if(counter == locales.length && !exists) {
                    this.trigger('showNotification', {text: "Locale doesn't exists", time: 3});
                }
            }
        }
    },

    __mapLocale: function() {
        var id      = this.get('localeId');
        var locales = this.get('locales');

        for(var i in locales) {
            if(locales[i].key == id) {
                locales[i].selected = true;
                this.set('locale', locales[i].title);
            }
        }
    },

    changeLocale: function(data, evt, target) {
        var locale  = data.target;
        var cur     = this.get('locale');
        var locales = this.get('locales');

        if(cur !== locale) {
            for(var i in locales) {
                locales[i].selected = false;
                if(locales[i].key==locale) {
                    locales[i].selected = true;
                    this.set('locale', locales[i].title);
                    app.cookie.set({cname: 'selectedLocale', content: locale});
                    this.triggerSiblings('toggleLocale', {key: locale});
                    app.selectedLocale = locale;
                }
            }
        }
    },


    ///////////////////////////////////////////////////
    // Search part triggered on keyup in search field
    //////////////////////////////////////////////////
    startGlobalSearch: function(data, evt, target) {
        var search = $('#global-search-filter').val();

        $('#clear-search-filter').removeClass('hidden');
        if(search && search != '' && search !== null) {
            if(evt.which == 13) {
                var index = $('.global-search-autocomplete-value.selected').attr('title');
                if(index && index != undefined) {search = index;}
                this.__fillResultList(search, 'all');
            } else if(evt.which != 38 && evt.which != 40) {
                if(search.length >= 3) {
                    this.__generateGlobalSearchAutocomplete(search);
                } else {
                    this.clearSearchAutocomplete();
                }
                $('#clear-search-filter').removeClass('hidden');
            }
        } else {
            this.clearSearchAutocomplete();
        }
    },

    __generateGlobalSearchAutocomplete: function(search) {
        var translations           = app.allTranslations;
        var selectedLocale        = app.selectedLocale;
        var counter                = 0;
        var autocompleteTransArray = [];
        var autocompleteKeyArray   = [];

        for(var i in translations) {
            if(counter < 10) {
                var exists = false;
                var str    = translations[i].mapping[selectedLocale];
                var key    = i;

                for(var i in autocompleteTransArray) {
                    var compare = autocompleteTransArray[i];
                    var index = compare.indexOf(str);
                    if(index >= 0) {
                        exists = true;
                    }
                }

                for(var x in autocompleteKeyArray) {
                    var compareX = autocompleteKeyArray[x];
                    var indexX = compareX.indexOf(str);
                    if(indexX >= 0) {
                        exists = true;
                    }
                }

                if(str && str.startsWith(search)) {
                    autocompleteTransArray[counter] = str;
                    ++counter;
                } else if(key && key.startsWith(search)) {
                    autocompleteKeyArray[counter] = key;
                    ++counter;
                } else if(str && str.indexOf(search) > 0) {
                    autocompleteTransArray[counter] = str;
                    ++counter;
                } else if(key && key.indexOf(search) > 0) {
                    autocompleteKeyArray[counter] = key;
                    ++counter;
                }
            }
        }

        /*for(var i in translations) {
            if(counter < 10) {
                var exists = false;
                var key    = i;

                if(key && key.startsWith(search)) {
                    autocompleteKeyArray[counter] = key;
                    ++counter;
                }
            }
        }

        for(var i in translations) {
            if(counter < 10) {
                var exists = false;
                var str    = translations[i].mapping[selectedLocale];
                var key    = i;

                for(var i in autocompleteTransArray) {
                    var compare = autocompleteTransArray[i];
                    var index = compare.indexOf(str);
                    if(index >= 0) {
                        exists = true;
                    }
                }

                if(str && str.indexOf(search) > 0 && !exists) {
                    autocompleteTransArray[counter] = str;
                    ++counter;
                }
            }
        }

        for(var i in translations) {
            if(counter < 10) {
                var exists = false;
                var str    = translations[i].mapping[selectedLocale];
                var key    = i;

                for(var i in autocompleteTransArray) {
                    var compare = autocompleteTransArray[i];
                    var index = compare.indexOf(str);
                    if(index >= 0) {
                        exists = true;
                    }
                }

                if(key && key.indexOf(search) > 0) {
                    autocompleteKeyArray[counter] = key;
                    ++counter;
                }
            }
        }*/

        this.__buildGlobalAutocompleteDropDown(autocompleteTransArray, autocompleteKeyArray);
    },

    __buildGlobalAutocompleteDropDown: function(transarray, keyarray) {
        if(transarray.length > 0 || keyarray.length > 0) {
            this.clearSearchAutocomplete();
            this.searchResultCounter = 0;
            var trans = '<div class="global-autocomplete-section-header"><b>Translations</b></div>';
            for(var i in transarray) {
                trans += "<div class='global-search-autocomplete-value string' title='"+transarray[i]+"' data-id='"+this.searchResultCounter+"'>"+transarray[i]+"</div>";
                this.searchResultCounter++
            }
            $('.global-search-autocomplete-panel').append(trans);
            var key = '<div class="global-autocomplete-section-header"><b>Keys</b></div>';
            for(var i in keyarray) {
                key += "<div class='global-search-autocomplete-value key' title='"+keyarray[i]+"' data-id='"+this.searchResultCounter+"'>"+keyarray[i]+"</div>";
                this.searchResultCounter++;
            }
            $('.global-search-autocomplete-panel').append(key);
        } else {
            this.clearSearchAutocomplete();
        }
    },

    navigateSearchResults: function(data, evt, target) {
        if(evt.keyCode == 38 || evt.keyCode == 40) {
            var pos               = target.selectionStart;
            target.value          = (evt.keyCode == 38?1:-1)+parseInt(target.value,10);        
            target.selectionStart = pos; 
            target.selectionEnd   = pos;

            var dir               = 'down';

            if(evt.keyCode == 38) {dir = 'up';}

            this.__navigateResults(dir);
            evt.preventDefault();
        }
        this.view.closeDropdown();
    },

    __navigateResults: function(dir) {
        var index = $('.global-search-autocomplete-value.selected').attr('data-id');
        $('.global-search-autocomplete-value').removeClass('selected');

        if(index && index != undefined) {
            index = parseInt(index);
            if(index < this.searchResultCounter && index >= 0) {
                if(dir == 'down') {++index;} else {--index;}
                $('.global-search-autocomplete-value[data-id="'+index+'"]').addClass('selected');
            }
            
        } else {
             if(dir == 'down') {index = 0;} else {index = this.searchResultCounter-1;}
            $('.global-search-autocomplete-value[data-id="'+index+'"]').addClass('selected');
        }
    }, 

    selectValueFromAutocomplete: function(data, evt, target) {
        var text  = target.text();
        var value = 'string';

        if(target.hasClass('key')) {
            value = 'key';
        }
        this.__fillResultList(text, value);
    },

    clearSearch: function() {
        this.set('searchValue', '');
        this.set('clean', !this.get('clean'));
        app.filter = '';
        app.cookie.set({cname: 'globalSearchValue', content: ''});
        app.cookie.set({cname: 'globalSearchType', content: ''});
        app.cookie.set({cname: 'filter', content: ''});
        this.triggerSiblings('filterTranslations', {});
    },

    clearSearchAutocomplete: function() {
        $('.global-search-autocomplete-panel').empty();
    },

    __handleSearchValue: function(search) {
        if(search.startsWith('add:')) {
            //locale and key
            type = search.split(':')[1];
            content = search.split(':')[2];

            if(type == 'key') {
                key = search.split(':')[2];
                trans = search.split(':')[3];


                var keyArray = key.split('.')
                var name = keyArray[keyArray.length-1]


                var namespaceArray = key.split('.');
                namespaceArray.pop();
                var namespace = null;
                if(namespaceArray.length > 1) {
                    namespace = namespaceArray.join('.');
                } else {
                    namespace = namespaceArray[0];
                }

                var newArrayValue = {
                    _attributes: app.allTranslations[0]._attributes,
                    _pk: app.allTranslations[0]._pk,
                    name: name,
                    namespace: namespace,
                    description: '',
                    checks: {},
                    texts: {}
                };

                for(var l in app.languages) {
                    if(l == 'en_gb') {
                        newArrayValue.checks[app.languages[l].id] = true;
                    } else {
                        newArrayValue.checks[app.languages[l].id] = false;
                    }
                }

                for(var l in app.languages) {
                    if(l == 'en_gb') {
                        newArrayValue.texts[app.languages[l].id] = trans;
                    } else {
                        newArrayValue.texts[app.languages[l].id] = '';
                    }
                }

                app.allTranslations.push(newArrayValue);

                this.trigger('saveData', {value: this.trigger('showNotification', {text: 'Key successfully added', type: 'success', time: 3})});
            }

            return;

        } else if(search.startsWith('delete:')) {
            //for locale and key
            type = search.split(':')[1];
            content = search.split(':')[2];

        } else if(search.startsWith('change:')) {
            //for locale and key
            type = search.split(':')[1];
            content = search.split(':')[2];

            if(type == 'locale') {
                this.mapLocale(content);
            } else {
                this.trigger('showNotification', {text: "Action not allowed", type: 'danger', time: 3});
            }

        } else if(search.startsWith('beginsWith:')) {
            content = search.split(':')[1];
            app.filter = content;
            this.triggerSiblings('filterTranslations', {type: 'startsWith'});

        } else if(search.startsWith('endsWith:')) {
            content = search.split(':')[1];
            app.filter = content;
            this.triggerSiblings('filterTranslations', {type: 'endsWith'});

        } else if(search.startsWith(':') || search.startsWith('id:')) {
            var id = parseInt(search.split(':')[1], 10);
            var isInt = this.isInt(id);
            if(x == (id-1)) {
            
            }

        } else {
            if(value == 'string' || value == 'key' || value == 'all') {
            }
        }
    },

    __fillResultList: function(search, value) {
        var translations    = app.allTranslations;
        var defaultLanguage = app.defaultLanguage;
        var resultList      = [];
        var counter         = 0;
        var type, content, key, trans;

        app.filter = search;
        console.log('__fillResultList', search);

        app.cookie.set({cname: 'globalSearchValue', content: search});
        app.cookie.set({cname: 'globalSearchType', content: value});
        this.triggerParents('filterTranslationsHelper', {});
        this.set('searchValue', search);

    },

    isInt: function(n) {
       return n % 1 === 0;
    },

    setGlobalDefaultLanguage: function() {
        this.set('defaultLanguage', this.get('defaultLanguage'));
    },

    ///////////////////////////////////////////////////////////////////
    // Save or Discard changes
    //////////////////////////////////////////////////////////////////
    showStandardDialogue: function(opt) {
        this.set('standardMessage', opt.message);
        this.set('standardDialog', true);
        this.set('showDialog', true);
    },
});
app.Controller('sidebar-sidebar', {
    init: function() {
        var locale      = app.cookie.get({cname: 'selectedLocale'});

        if(locale && locale !== NaN && locale !== "NaN" && locale.length > 0) {
            app.selectedLocale = locale;
            this.set('localeId', locale);
        } else {
            app.selectedLocale = 'en_gb';
            this.set('localeId', 'en_gb');
        }
    },

    handleLogout: function() {
        var self = this;
        app.apiAdapter.logout( 
            function(jqXHR, exception) {
                if(jqXHR.status == 200) {
                    self.trigger('toggleLoggedIn', {flag: false});
                    app.cookie.delete({cname: 'user'});
                    app.cookie.delete({cname: 'logged_in'});
                    app.cookie.delete({cname: 'usertoken'});
                } else if(jqXHR.status == 200){
                    self.set('loginfail', true);
                }
            },
            function(jqXHR, exception) {
                if(jqXHR.status == 200) {
                    self.trigger('toggleLoggedIn', {flag: false});
                    app.cookie.delete({cname: 'user'});
                    app.cookie.delete({cname: 'logged_in'});
                    app.cookie.delete({cname: 'usertoken'});
                } else if(jqXHR.status == 200){
                    self.set('loginfail', true);
                }
            }
        );
    },

    generateAuthToken: function() {
        var self = this;
        app.apiAdapter.generateAuthToken(function(res) {
            res = JSON.parse(res);
            if(res.token) {
                app.usertoken = res.token;
                app.cookie.set({cname: 'usertoken', content: res.token});
                self.view.obj('authToken').text(res.token);
            }
        });
    },

    showAddPanelKey: function() {
        this.trigger('openAddPanel', {type: 'key'});
        this.view.closeMenu();
    },

    importFile: function() {
        var fileInput = this.view.obj("input");
        var newFile   = fileInput.prop('files')[0];
        var filename  = newFile.name;
        var filetype;
        if (filename.substr(-4) == '.json') {
            filetype = 'json';
            filename = filename.slice(0,-4);
        }
        var textType = /.json/;
        var existant = false;
        var files    = this.get('files') || [];
        var text, i, file;
        for (i in files) {
            file = files[i];
            if (file.name==filename) {
                existant = true;
            }
        }
        
        if (newFile.type.match(textType)) {
            this.readFile(files, newFile);
        } else if (filetype=='json') {
            var self = this;
            var options = {
                title:   'Import URF',
                message: 'Please enter the password to decrypt the file:',
                input:   'password',
                cancel:  'Cancel',
                ok:      'Import',
                callback: function(result) {
                    if (result===false) return;
                    /*var password = result.input;
                    if (password) {
                        self.readFile(files, newFile, password);
                    } else {
                        text = 'You must enter a password to decrypt this file!';
                        this.trigger('setResponseContentDialog', text);
                    }*/
                    console.log(result);
                }
            };
            //this.trigger('showContentDialog', options);
        } else {
            text = "This file type is not supported!";
            this.trigger('showNotification', {text: text, type: 'danger', time: 5});
        }

        return false;
    },

    readFile: function (files, newFile, password) {
        var self     = this;
        var existant = false;
        var text, filename;
        var reader   = new FileReader();
        reader.onload = function(e) {
            var file = {};
            if (password) {
                // Dycrypt with user-password
                file.name = newFile.name.substr(0, newFile.name.length-4);
                file.data = app.crypter.aesDecrypt(reader.result, password);
            } else {
                file.name = newFile.name;
                file.data = reader.result;
            }

            if (file.data) {
                app.apiAdapter.uploadFile(file.name.split('.json')[0], file.data, function(res, msg) {
                    text = "File correctly loaded!";
                    self.trigger('showNotification', {text: text, type: 'success', time: 5});
                    self.trigger('updateView');
                }, function(res, msg) {
                    console.error(res, msg);
                    text = "File not uploaded: "+msg;
                    self.trigger('showNotification', {text: text, type: 'error', time: 5});
                })
            } else {
                text = 'Import failed. Your file seems to not have the correct data.';
                //self.trigger('setResponseContentDialog', text);
            }
        };
        reader.readAsText(newFile);
    },
});
app.Controller('usermanagement-usermanagement', {
    
    init: function() {
        var self = this;
        app.apiAdapter.getUserList(function(res, message) {
            res = JSON.parse(res);
            self.__mapUsers(res);
            self.__mapProjects(res);
        }, function(res, message) {
            console.error('getUserList', res, message);
        });
    },

    closeUsermanagement: function() {
        window.location.hash = '';
    },


    __mapUsers: function(res) {
        var users   = res;
        var roles   = [];
        var counter = 0;
        var size    = Object.size(res);
        var userExists = false;

        for(var u in res) {
            if(roles.indexOf(res[u].role) == -1) {
                roles.push(res[u].role);
            }
            if(res[u].role == 'user') {
                userExists = true;
            }

            counter++;

            if(counter == size) {
                this.set('users', users);
                this.set('roles', roles);
                this.set('userExists', userExists);
                this.set('projectManagement', app.meta.projectManagement);
                this.set('addRoleEnabled', app.meta.addRole);
                this.set('addRoleEnabled', app.meta.addRole);
                this.set('exportofusermanagement', app.meta.exportOfUserManagement);
            }
        }
    },

    __mapProjects: function() {

    },

    ////////////////////////////////
    // User Related Part
    ///////////////////////////////
    toggleUserEditing: function(data, evt, target) {
        var card = target.closest('.usermanagement-card');
        
        target.find('.glyphicon').toggleClass('glyphicon-pencil glyphicon-ok');
        target.toggleClass('approve-user-button edit-user-button');

        if(card.hasClass('open')) {
            card.removeClass('open');
            card.find('.username-title').show();
            card.find('.username-input-field').hide();
        } else {
            card.addClass('open');
            card.find('.username-title').hide();
            card.find('.username-input-field').show();
        }
    },

    approveExistingUser: function(data, evt, target) {
        var self  = this;
        var role  = data.target;
        var name  = target.closest('.usermanagement-card').find('.username-input-field');
        var pwd   = target.closest('.usermanagement-card').find('.password-input-field');

        var valid = this.__checkUserInput(data, evt, target);

        if(valid === true) {
            var obj = {username: name.val(), password: pwd.val(), role: role};
            app.apiAdapter.updateUser(obj, function(res, msg) {
                console.log('changeUser', res, msg);
                text = 'User "'+name.val()+'" successfully updated.';
                self.trigger('showNotification', {text: text, type: 'success', time: 5});
            }, function(res, msg) {
                console.error('changeUser', res, msg);
                text = "User data could not be updated: "+msg;
                self.trigger('showNotification', {text: text, type: 'error', time: 5});
            });
        }
    },

    approveNewUser: function(data, evt, target) {
        var self  = this;
        var role  = data.target;
        var name  = target.closest('.usermanagement-card').find('.username-input-field');
        var pwd   = target.closest('.usermanagement-card').find('.password-input-field');

        var valid = this.__checkUserInput(data, evt, target);

        if(valid === true) {
            var obj = {username: name.val(), password: pwd.val(), role: role};
            app.apiAdapter.addUser(obj, function(res, msg) {
                console.log('addUser', res, msg);
                text = 'User "'+name.val()+'" successfully added to '+role;
                self.trigger('showNotification', {text: text, type: 'success', time: 5});
                target.closest('.usermanagement-card').remove();
                self.view.__generateNewCard(name.val(), role);
            }, function(res, msg) {
                console.error('addUser', res, msg);
                text = "User could not be saved: "+msg;
                self.trigger('showNotification', {text: text, type: 'error', time: 5});
            });
        }
    },

    __checkUserInput: function(data, evt, target) {
        var users = this.get('users');
        var name  = target.closest('.usermanagement-card').find('.username-input-field');
        var pwd   = target.closest('.usermanagement-card').find('.password-input-field');
        var check = false;

        if(name.val() === '') {
            name.val('');
            name.attr('placeholder', 'Please add username');
            name.addClass('error');
        } else if(pwd.val() === '') {
            pwd.val('');
            pwd.attr('placeholder', 'Please add a password');
            pwd.addClass('error');
        } else if(pwd.val().length < 5) {
            pwd.val('');
            pwd.attr('placeholder', 'Minimum 5 characters');
            pwd.addClass('error');
        } else if(users[name] !== undefined) {
            text = "Username is already in use.";
            this.trigger('showNotification', {text: text, type: 'error', time: 5});
        } else {
            check = true;
        }

        return check;
    },

    rolesChanged: function() {
        var self      = this;
        var lists     = $('.usermanagement-list[data-type="role"]');
        var userArray = _.cloneDeep(this.get('users'));

        lists.each(function() {
            var list  = $(this);
            var role  = list.attr('data-target');
            var cards = list.find('.usermanagement-card');

            cards.each(function() {
                var card = $(this);
                var id   = card.attr('data-target');

                if(userArray[id].role !== role) {
                    userArray[id].role = role;
                    self.username      = id;
                    self.password      = null;
                    self.role          = role;

                    //self.__updateUser();
                }

            });
        });
    },
    
    __updateUser: function(data, evt, target) {
        var obj = {
            username: this.username,
            password: this.password,
            role: this.role
        };

        app.apiAdapter.updateUser(
            obj,
            function(res, message) {
                console.log('__updateUser', res, message);
            },
            function(res, message) {
                console.error('__updateUser', res, message);
            }
        );
    },
    
    __allowUser: function(data, evt, target) {
        var obj = {
            username: this.username,
            project: this.project
        };

        app.apiAdapter.updateUser(
            obj,
            function(res, message) {
                console.log('__allowUser', res, message);
            },
            function(res, message) {
                console.error('__allowUser', res, message);
            }
        );
    },
    
    deleteUser: function(data, evt, target) {
        var self = this;

        app.apiAdapter.deleteUser(
            data.target,
            function(res, message) {
                text = 'User "'+data.target+'" has been successfully deleted.';
                self.trigger('showNotification', {text: text, type: 'success', time: 5});
                target.closest('.usermanagement-card').remove();
                console.log('deleteUser', res, message);
            },
            function(res, message) {
                text = 'An error occured while deleting user "'+data.target+'"'+msg;
                self.trigger('showNotification', {text: text, type: 'error', time: 5});
                console.error('deleteUser', res, message);
            }
        );
    },



    ////////////////////////////////
    // Project Related Part
    ///////////////////////////////
    addProject: function(data, evt, target) {
        var name = target.val();

        app.apiAdapter.createProject(name, function(res, msg) {
            console.log('createProject success', res, msg);
        }, function(res, msg) {
            console.error('createProject error', res, msg);
        })
    },

    toggleProjectEditing: function(data, evt, target) {
    },
    
    handleProjectInputArea: function(username, password) {
        var edit_user = this.get('edit_user');
        var selectedRole = this.get('selectedRole');
        var roleid = this.getRole('id', selectedRole);
        
        if(this.checkUser(username)) {
            if (edit_user) {
                if (password === ""){
                    this.updateUser(edit_user, username, this.getUser('', edit_user).password, roleid);
                    this.set('selectedRole', this.getRole('name'));
                    return;
                }
            }
            else {
                if(this.checkPwd(password)) {
                    this.addUser(username, password, roleid);
                    this.set('selectedRole', this.getRole('name'));
                    return;
                } 
            }
        }
        console.error("Save failed!");
    },
    
    checkProject: function(username) {
        var message = "";
        var edit_user = this.get('edit_user');

        if (username === "") {
            message = "Please enter a username";
        }
        else if (username.length <= 3) {
            message = "Username must have at least 4 characters";
        }
        else if (edit_user!=username && this.itemExists(username, 'users')) { 
            message = "Username is already taken";
        }

        if (message) {
            $('#user_name').addClass('danger');
            this.trigger('showNotification', { text: message, type: 'danger', time: 5 });
            return false;
        } 
        else return true;
    },
    
    updateProject: function(data, evt, target) {
    },
    
    deleteProject: function(data, evt, target) {
    },
});

app.view('content-globalsearch', {
    events: [
        {
            selector: '#global-search-filter',
            type: 'keyup',
            action: 'startGlobalSearch'
        },
        {
            selector: '#global-search-filter',
            type: 'keydown',
            action: 'navigateSearchResults'
        },
        {
            selector: '#clear-search-filter',
            type: 'click',
            action: 'clearSearch'
        },
        {
            selector: '.global-search-autocomplete-panel .global-search-autocomplete-value',
            type: 'click',
            action: 'selectValueFromAutocomplete'
        },
        {
            selector: '.header-panel',
            type: 'click',
            action: 'showDialogue'
        },
        {
            selector: '.translations-panel-inputfield',
            type: 'focusout',
            action: 'changedTranslationsCollector'
        },
        {
            selector: 'span.glyphicon-ok',
            type: 'click',
            action: 'checkTranslation'
        },

        //////////////////////////
        // Event Listener
        //////////////////////////
        {
            type: 'setLanguages',
            action: 'setLanguages'
        },
        {
            type: 'setGlobalDefaultLanguage',
            action: 'setGlobalDefaultLanguage'
        },
    ],

});
app.view('content-wrapper', {
    events: [
        {
            type: 'hashchange',
            action: 'checkHash'
        },
        {
            type: 'showItem',
            action: 'showItem'
        },
        {
            type: 'changeLocale',
            action: 'changeLocale'
        },
        {
            type: 'filterBySearch',
            action: 'filterBySearch'
        },
        {
            type: 'scrollToNavigatedItem',
            action: 'scrollToNavigatedItem'
        },
        {
            type: 'updateView',
            action: 'updateView'
        },
        {
            type: 'toggleShowItemHelper',
            action: '__toggleShowItemHelper'
        },
        {
            type: 'filterTranslationsHelper',
            action: '__filterTranslationsHelper'
        }
    ],

    init: function() {
    },

    changeLocale: function(opt) {
        this.trigger('toggleLocale', opt);
    },

    filterBySearch: function(payload) {
        this.trigger('filterTranslations', payload)
    },

    scrollToNavigatedItem: function() {
        this.trigger('scrollToSelected')
    },

    __toggleShowItemHelper: function(payload) {
        this.trigger('toggleShowItem', payload);
    },

    __filterTranslationsHelper: function(payload) {
        console.log('filterTranslations');
        this.trigger('filterTranslations', payload);
    }

});
app.view('header-header', {
    events: [
        {
            selector: '#mainMenu li',
            type: 'click',
            action: 'handleMenu'
        },
        /*{
            selector: 'span.logout',
            type: 'click',
            action: 'handleLogout'
        },*/

        {
            selector: '#helper-menu',
            type: 'click',
            action: 'openMenu'
        },
        {
            type: 'handleMenu',
            action: 'handleMenu'
        },
    ],

    init: function() {
    },

    openMenu: function() {
        this.trigger('toggleMenu', {value: true});
    }

});
app.view('items-activityindicator', {
    events: [
        {
            type: 'toggleLoading',
            action: 'toggleLoading'
        },
    ],
});
app.view('items-addpanel', {
    events: [
        {
            action: 'approveKey',
            type: 'click',
            selector: '#approve-add-key-button'
        }, 
        {
            action: 'approveLoclae',
            type: 'click',
            selector: '#approve-add-locale-button'
        }, 
        {
            action: 'closeAddPanel',
            type: 'click',
            selector: '#add-panel-cancel-button'
        }, 

        {
            type: 'openAddPanel',
            action:'openAddPanel'
        }
    ],

    keyInput: '#add-key-input',
    translationInput: '#add-translation-input',
    localeInput: '#add-locale-input',
    addKeyPanel: '#add-key-panel',
    addLocalePanel: '#add-locale-panel',

    openAddPanel: function(obj) {
        this.type = obj.type;
        this.obj('addKeyPanel').addClass('hidden');
        this.obj('addLocalePanel').addClass('hidden');

        if(obj.type == 'key') {
            this.obj('root').addClass('open');
            this.obj('addKeyPanel').removeClass('hidden');
        } else if(obj.type == 'locale') {
            this.obj('root').addClass('open');
            this.obj('addLocalePanel').removeClass('hidden');
        }
    },

    closeAddPanel: function(obj) {
        this.obj('root').removeClass('open');
        this.obj('addKeyPanel').addClass('hidden');
        this.obj('addLocalePanel').addClass('hidden');
        this.obj('keyInput').val('');
        this.obj('translationInput').val('');
        this.obj('localeInput').val('');
    }

});
app.view('items-item', {
    events: [
        {
            selector: '#item-close',
            type: 'click',
            action: 'closeItem'
        },
        {
            selector: '.btn-success',
            type: 'click',
            action: 'toggleSuccess'
        },
        {
            selector: '#item-navigation button',
            type: 'click',
            action: 'navigate'
        },
        {
            selector: '#item-save',
            type: 'click',
            action: 'saveTranslations'
        },
        {
            selector: '#item-save-changes',
            type: 'click',
            action: 'saveChanges'
        },
        {
            selector: '#item-discard',
            type: 'click',
            action: 'discardTranslations'
        },
        {
            selector: '#item-discard-changes',
            type: 'click',
            action: 'discardChanges'
        },
        {
            selector: '#item-check',
            type: 'click',
            action: 'checkedTranslation'
        },
        {
            selector: '.item-translation',
            type: 'focusout',
            action: 'updateTranslationOnFocusout'
        },
        {
            selector: '.checkbox',
            type: 'click',
            action: 'change-selected-language'
        },
        {
            selector: '.item-language-selector',
            type: 'click',
            action: 'toggleSelectedItems'
        },

        //////////////////////////////////////
        // Event Listener
        /////////////////////////////////////
        {
            type: 'showitem',
            action: '__showitem'
        },
        {
            type: 'showStandardDialogue',
            action: 'showStandardDialogue'
        },
        {
            type: 'toggleShowItem',
            action: 'toggleShowItem'
        },
        {
            type: 'toggleLocale',
            action: 'toggleLocale'
        },
    ],

    defaultText: '#item-default-field',

    closeItem: function() {
        this.controller.toggleShowItem({show: false});
    },

    toggleSuccess: function(data) {
        $('.btn-success').toggleClass('checked');
        this.trigger('toggleOk');
    },

    toggleSelectedItems: function(data, evt, target) {
        target.closest('#item-default-language').find('textarea').toggleClass('hidden');
        this.controller.__setSelectedLanguages(data);
    },

});
app.view('items-list', {
    events: [
        {
            selector: 'span.glyphicon-ok',
            type: 'click',
            action: 'checkTranslation'
        },
        {
            selector: 'span.glyphicon-pencil',
            type: 'click',
            action: 'clickEdit'
        },
        {
            selector: '.panel-container',
            type: 'scroll',
            action: '__determineScrollPosition'
        },
        {
            selector: '.header-panel',
            type: 'click',
            action: 'showSelectedItem'
        },
        {
            selector: '.translations-panel-inputfield',
            type: 'focusout',
            action: 'changedTranslationsCollector'
        },
        {
            selector: '.item-delete-panel',
            type: 'click',
            action: 'toggleDelete'
        },
        {
            selector: '.item-confirm-delete-panel',
            type: 'click',
            action: 'deleteItem'
        },
        {
            selector: '.pager-list-item',
            type: 'click',
            action: 'changePage'
        },
        {
            action: 'importInitFile',
            type: 'change',
            selector: '#import-init-file'
        }, 

        //////////////////////////
        // Event Listener
        //////////////////////////
        {
            type: 'setLanguages',
            action: 'setLanguages'
        },
        {
            type: 'discardChanges',
            action: 'discardChanges'
        },
        {
            type: 'changeDefaultLanguage',
            action: 'changeDefaultLanguage'
        },
        {
            type: 'setItems',
            action: 'setItems'
        },
        {
            type: 'filterTranslations',
            action: 'filterTranslations'
        },
        {
            type: 'renderDom',
            action: 'renderDom'
        },
        {
            type: 'updateDom',
            action: 'updateDom'
        },
        {
            type: 'toggleLocale',
            action: 'toggleLocale'
        },
        {
            type: 'scrollToSelected',
            action: '__scrollToSelected'
        },
        {
            type: 'updatePage',
            action: '__updatePage'
        },
        {
            type: 'updateThis',
            action: 'updateThis'
        },
    ],

    input: '#import-init-file',
    snappingPoint: '.snapping-dot',
    noDataOverlay: '.no-data-overlay',

    toggleDelete: function(data, evt, target) {
        var id = data.id;
        var dl = $('.item-panel dl[data-value="'+id+'"]');
        if(dl.hasClass('deleting')) {
            dl.removeClass('deleting');
        } else {
            dl.addClass('deleting');
        }

        var icon = $('.item-panel dl[data-value="'+id+'"] .item-delete-panel .icon');
        if(icon.hasClass('glyphicon-trash')) {
            icon.removeClass('glyphicon-trash').addClass('glyphicon-remove');
        } else {
            icon.removeClass('glyphicon-remove').addClass('glyphicon-trash');
        }
    },
});
app.view('login-login', {
    username: '#loginname',
    password: '#password',

    events: [
        {
            selector: '.login-button',
            type: 'click',
            action: 'login'
        },
        /*{
            selector: 'input',
            type: 'keyup',
            action: 'loginOnKeyup'
        },*/
        {
            type: 'enterKey',
            action: 'login'
        }
    ],

    init: function() {
    }
});
app.view('main-main', {
    events: [
        {
            type: 'handleLog',
            action: 'handleLog'
        },
        {
            type: 'handleWaitloader',
            action: 'handleWaitloader'
        },
        {
            type: 'filterItems',
            action: 'filterItems'
        },
        {
            type: 'setItems',
            action: 'setItems'
        },
        {
            type: 'saveData',
            action: 'saveData'
        },
        {
            type: 'setGlobalState',
            action: 'setGlobalState'
        },
        {
            type: 'showGlobalSearch',
            action: 'showGlobalSearch'
        },
        {
            type: 'toggleMenu',
            action: 'toggleSidebar'
        },
        {
            type: 'triggerLocaleChanging',
            action: 'triggerLocaleChanging'
        },
        {
            type: 'toggleLoading',
            action: 'toggleLoading'
        },
        {
            type: 'toggleLoggedIn',
            action: 'toggleLoggedIn'
        },
    ],

    triggerLocaleChanging: function(payload) {
        this.trigger('triggerLocaleChange', payload);
    },

    toggleLoading: function(payload) {
        var indicator = $('.activity-indicator-overlay');
        if(payload.flag === true) indicator.addClass('loading');
        else indicator.removeClass('loading');
    },
});
app.view('notification-notification', {
	events: [ 
		{
			action: 'closeNotification',
			type: 'click',
			selector: '.notification .close',
		},
		{
			action: 'showNotification',
			type: 'showNotification'
		},
		{
			action: 'closeNotification',
			type: 'closeNotification'
		}
	],
});

app.view('search-search', {
    events: [
        {
            selector: '#global-search-filter',
            type: 'keyup',
            action: 'startGlobalSearch'
        },
        {
            selector: '#global-search-filter',
            type: 'keydown',
            action: 'navigateSearchResults'
        },
        {
            selector: '#clear-search-filter',
            type: 'click',
            action: 'clearSearch'
        },
        {
            selector: '.global-search-autocomplete-panel .global-search-autocomplete-value',
            type: 'click',
            action: 'selectValueFromAutocomplete'
        },
        {
            selector: "*:not(#locale-selector)",
            type: "click",
            action: "closeDropdown"
        },
        {
            selector: "*:not(.input-field-group)",
            type: "click",
            action: "clearSearchAutocomplete"
        },
        {
            selector: "#locale-selector",
            type: "click",
            action: "toggleDropdown"
        },
        {
            selector: "li.locale",
            type: "click",
            action: "changeLocale"
        },

        //////////////////////////
        // Event Listener
        //////////////////////////
        {
            type: 'setLanguages',
            action: 'setLanguages'
        },
        {
            type: 'setGlobalDefaultLanguage',
            action: 'setGlobalDefaultLanguage'
        },
        {
            type: 'triggerLocaleChange',
            action: 'changeLocale'
        },
        {
            type: 'updateThis',
            action: 'updateThis'
        },
    ],

    toggleDropdown: function() {
        this.showSelect = true;
        $('#locale-selector .dropdown-menu').toggle();
        $('.locale-selector-btn-group').toggleClass('open');
    },
    
    closeDropdown: function() {
        if (!this.showSelect) {
            $('#locale-selector .dropdown-menu').hide();
            $('.locale-selector-btn-group').removeClass('open');
        }
        this.showSelect = false;
    },
});
app.view('sidebar-sidebar', {
    events: [
        {
            selector: '.close-button',
            type: 'click',
            action: 'closeMenu'
        },
        {
            selector: '#left-sidebar-container',
            type: 'click',
            action: 'closeMenu'
        },
        {
            selector: '#logout-button',
            type: 'click',
            action: 'handleLogout'
        },
        {
            selector: "*:not(.locale-sidebar-selector)",
            type: "click",
            action: "closeDropdown"
        },
        {
            selector: ".locale-sidebar-selector",
            type: "click",
            action: "toggleDropdown"
        },
        {
            selector: "li.locale",
            type: "click",
            action: "changeLocale"
        },
        {
            selector: "#add-key-button",
            type: "click",
            action: "showAddPanelKey"
        },
        {
            action: 'importFile',
            type: 'change',
            selector: '#import-file'
        }, 
        {
            action: 'openUserManagement',
            type: 'click',
            selector: '#user-management-button'
        }, 
        {
            action: 'generateAuthToken',
            type: 'click',
            selector: '#generate-auth-token-button'
        }, 

        {
            type: 'openSidebar',
            action:'openSidebar'
        }
    ],

    input: '#import-file',

    authToken: '.auth-token',

    openUserManagement: function() {
        this.closeMenu();
        window.location.hash = 'usermanagement';
    },

    openSidebar: function(payload) {
        $('#menu-container').addClass('open');
    },

    closeMenu: function(payload) {
        $('#menu-container').removeClass('open');
    },

    toggleDropdown: function() {
        this.showSelect = true;
        $('.locale-sidebar-selector .dropdown-menu').toggle();
        $('.locale-selector-btn-group').toggleClass('open');
    },

    changeLocale: function(data, evt, target) {
        this.trigger('triggerLocaleChanging', {target: data.target});
        target.closest('ul').find('li').removeClass('hidden');
        target.addClass('hidden');
        target.closest('.locale-dropdown').find('.locale-title').text(target.text());
    },
    
    closeDropdown: function() {
        if (!this.showSelect) {
            $('.locale-sidebar-selector .dropdown-menu').hide();
            $('.locale-selector-btn-group').removeClass('open');
        }
        this.showSelect = false;
    }
});
app.view('usermanagement-usermanagement', {
    events: [
    // GENERAL
        {
            selector: ".remove-new-card-button",
            type: "click",
            action: "removeNewCard"
        },
        {
            selector: "input",
            type: "keyup",
            action: "keyUpOnInput"
        },
        {
            selector: ".go-back-wrapper",
            type: "click",
            action: "closeUsermanagement"
        },

    // USER
        {
            selector: ".add-new-card",
            type: "click",
            action: "addCard"
        },
        {
            selector: ".edit-user-button",
            type: "click",
            action: "toggleUserEditing"
        },
        {
            selector: ".delete-user-button",
            type: "click",
            action: "deleteUser"
        },
        {
            selector: ".approve-new-card-button",
            type: "click",
            action: "approveNewUser"
        },
        {
            selector: ".approve-user-button",
            type: "click",
            action: "approveExistingUser"
        },

    // Project
        {
            selector: ".edituser",
            type: "click",
            action: "addProject"
        },
        {
            selector: ".edituser",
            type: "click",
            action: "toggleProjectEditing"
        },
        {
            selector: ".edituser",
            type: "click",
            action: "handleProjectInputArea"
        },
        {
            selector: ".edituser",
            type: "click",
            action: "updateProject"
        },
        {
            selector: ".edituser",
            type: "click",
            action: "deleteProject"
        },

    // Events
    ],
    username: "#username",
    password: "#password",

    init: function() {
        this.notify();
    },

    // onrendered
    notify: function() {
        if(app.meta.editRole === true) {
            var self = this;
            $(".usermanagement-list-cards").sortable({
                connectWith: ".usermanagement-list-cards",
                scroll: false,
                delay: 350,
                zIndex: 9999,
                accept: ":not(.usermanagement-list-card.currentUser)",
                start: function(event, ui) {
                    $(ui.item[0]).addClass('dragged');
                    $('.usermanagement-list-cards').addClass('dragStarted');
                },
                stop: function(event, ui) {
                    $(ui.item[0]).removeClass('dragged');
                    $('.usermanagement-list-cards').removeClass('dragStarted');
                    self.controller.rolesChanged();
                }
            });
        }
    },

    addCard: function(data, evt, target) {
        if(data.target === 'user') {
            this.__addUserCard(target);
        } else if(data.target === 'project') {
            this.__addProjectsCard();
        }
    },

    __addUserCard: function(target) {
        var list = target.closest('.usermanagement-list-wrapper');
        var role = list.attr('data-target');

        var card = "<div class='usermanagement-card open' data-target='"+role+"'>";
                card += "<div class='usermanagement-card-information'>";
                    card += "<input class='username-input-field' placeholder='Enter username' data-target='"+role+"' style='display: inline-block'/>";
                card += "</div>";
                card += "<input placeholder='Enter password' class='password-input-field' data-target='"+role+"'/>";
                card += "<div class='usermanagement-card-actions-container'>";
                    card += "<button class='approve-new-card-button col-md-6' data-target='"+role+"'><span class='cancel-card glyphicon glyphicon-ok'></button>";
                    card += "<button class='remove-new-card-button col-md-6'><span class='cancel-card glyphicon glyphicon-remove'></button>";
                card += "</div>";
        card += "</div>";

        list.find('.usermanagement-list-cards').prepend(card);
    },

    __generateNewCard: function(name, role) {
        var card = "<div class='usermanagement-card' data-target='"+name+"'>";
                card += "<div class='usermanagement-card-information'>";
                    card += "<span class='username-title'>"+name+"</span>";
                    card += "<input class='username-input-field' value='"+name+"' data-target='"+name+"' data-type='user'/>";
                card += "</div>";
                card += "<input type='text' placeholder='Change password' class='password-input-field' data-target='"+name+"'/>";
                card += "<div class='usermanagement-card-actions-container'>";
                    card += "<button class='edit-user-button col-md-6'><span class='cancel-card glyphicon glyphicon-pencil'></button>";
                    card += "<button class='delete-user-button col-md-6' data-target='"+name+"'><span class='cancel-card glyphicon glyphicon-trash'></button>";
                card += "</div>";
        card += "</div>";

        $('.usermanagement-list-wrapper[data-target="'+role+'"]').find('.usermanagement-list-cards').prepend(card);
    },

    removeNewCard: function(data, evt, target) {
        target.closest('.usermanagement-card').remove();
    },

    __addProjectsCard: function() {

    },

    keyUpOnInput: function(data, evt, target) {
        var tgt = $(evt.target);
        var type = data.target;
        if (evt.which===13) {
            if (tgt.parents('.newrole').length > 0) {
                this.enterOnRoleInputArea(data, evt, target);
            }
            else if (tgt.parents('.newuser').length > 0) {
                this.enterOnUserInputArea(data, evt, target);
            }
        } else {
            if(tgt.is('input')) {
                $('input').removeClass('danger');
                this.trigger('closeNotification');
                if (tgt.parents('.newuser').length > 0) {
                    var username = this.obj("username").val();
                    var password = this.obj("password").val();
                    this.controller._set('username', username, true);
                    this.controller._set('password', password, true);
                }
            }
        }
    },

    __tilt_direction: function(item) {
        var left_pos = item.position().left,
            move_handler = function (e) {
                if (e.pageX >= left_pos) {
                    item.addClass("right");
                    item.removeClass("left");
                } else {
                    item.addClass("left");
                    item.removeClass("right");
                }
                left_pos = e.pageX;
            };
        $("html").bind("mousemove", move_handler);
        item.data("move_handler", move_handler);
    },  
});
