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
