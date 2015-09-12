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