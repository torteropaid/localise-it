
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
