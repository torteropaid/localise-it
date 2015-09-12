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
