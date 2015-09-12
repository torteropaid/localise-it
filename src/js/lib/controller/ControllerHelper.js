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
