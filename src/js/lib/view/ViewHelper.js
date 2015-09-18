
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