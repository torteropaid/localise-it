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
