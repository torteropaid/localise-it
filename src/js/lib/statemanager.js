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
