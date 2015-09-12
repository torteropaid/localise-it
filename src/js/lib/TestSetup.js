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
