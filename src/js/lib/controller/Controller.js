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
