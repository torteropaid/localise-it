/*
 * ION-U web application
 *
 * Copyright (c) 2012, CommScope/webvariants
 */

/*global jQuery:false, window:false, Debug:false, Request:false, ion:false*/
/*jshint smarttabs:true, forin:false*/ // <- we only iterate through objects we control, so no need for hasOwnProperty()

/**
 * @module Library
 * @author carlo@webvariants.de
 */

/**
 * @class Reloader
 */

// TODO Refactor!

var Job = function (opt) {
	this.remove = function () {
		this.del = true;
	};

	_.extend(this, {
		type           : null,
		callback       : null,
		errorCallback  : null,
		interval       : 0,
		iteration      : null,
		pause          : false,
		clearEvents    : null,
		checksum       : null,
		payloadHandler : null,
		now            : false,
		"del"          : false // flag to mark something to delete i
	}, opt || {});
};

var runloop = {
	currentDevice: null,
	iteration: 0,
	timeInterval: 50,
	pauseValue: false,
	isPerforming: false,
	pseudoDevice: 'x',
	jobs: [],

	start: function () {
		if (!Config.Debug.deactivateReload) {
			runloop.triggerLoop();
		}
	},

	getRunJobs: function () {
		var result = {
			jobs: [],
			runJobs: []
		};

		for (var jobIndex in runloop.jobs) {
			if (runloop.jobs.hasOwnProperty(jobIndex)) {
				var job = runloop.jobs[jobIndex];
				if (job.del || job.iteration < runloop.iteration) {
					continue;
				}

				result.runJobs.push(job);
				if (job.iteration == runloop.iteration && !job.pause) {
					job.now = false;
					runloop.jobs[jobIndex].iteration = runloop.iteration + job.interval;
					result.jobs.push(job);
				}
				else if (job.now) {
					job.now = false;
					result.jobs.push(job);
				}
			}
		}
		return result;
	},

	loop: function () {
		if (!runloop.isPaused()) {
			runloop.updateQueue();
			runloop.isPerforming = false;
			var jobRes = runloop.getRunJobs();
			runloop.jobs = jobRes.runJobs;
			var jobs = jobRes.jobs;

			runloop.iteration++;

			if (jobs.length > 0) {
				var request = null;
				var requestCount = 0;
				var jobCount = 0;

				var cb = function (count) {
					if (count) {
						jobCount += count;
					} else {
						jobCount++;
					}

					if (requestCount == jobCount ) {
						runloop.triggerLoop();
					}
				};

				for (var jobIndex in jobs) {
					if (jobs.hasOwnProperty(jobIndex)) {
						var job = jobs[jobIndex];
						if (job.type == 'request') {
							var payload = {};
							if (job.payloadHandler && typeof(job.payloadHandler) == 'function') {
								payload = job.payloadHandler();
								if(payload === false) {
									continue;
								}
							}
							else if (job.payload) {
								payload = job.payload;
							}

							app.adapter.add({
								controller: job.controller,
								action: job.action,
								payload: payload,
								device: job.device,
								callback: job.callback,
								errorCallback: job.errorCallback,
								checksum: job.checksum,
								job: job
							}, true);

							requestCount++;
						}
						else if (job.type == 'execute') {
							if(Config.Debug.debugMode) {
								job.callback(cb, job);
							} else {
								try{ // Is needed when in an job an exception is thrown
									job.callback(cb, job);
								} catch(err) {
									console.error(err);
								}
							}
						}

						if(job.once) {
							job.remove();
						}
					}
				}

				if (request) {
					request.finishCb = function () {
						cb(requestCount);
					};

					request.exec();
				}
				else {
					runloop.triggerLoop();
				}
			}
			else {
				runloop.triggerLoop();
			}
		}
	},

	remove: function (device, identifier) {
		var found   = false,
			newJobs = [];

		for (var jobIndex in runloop.jobs) {
			if (runloop.jobs.hasOwnProperty(jobIndex)) {
				var job = runloop.jobs[jobIndex],
					jobIdentifier = job.controller + '-' + job.action;

				if (!(jobIdentifier === identifier && job.device === device)) {
					newJobs.push(job);
				}
				else {
					found = true;
				}
			}
		}

		if (found) {
			runloop.jobs = newJobs;
		}

		return found;
	},

	updateQueue: function () {
		for (var jobIndex in runloop.jobs) {
			if (runloop.jobs.hasOwnProperty(jobIndex)) {
				var job = runloop.jobs[jobIndex];
				if (job.device != runloop.pseudoDevice) {
					// TODO check implementation and refactor class
					// set name to app.runloop or move the functionality to the app
					// console.warn('use dataRegister', 'job.device != runloop.pseudoDevice');
					var identifier = job.controller + '-' + job.action;
					if (job.type != 'execute' && app.viewHelper.get(job.uid).length === 0) {
						console.log(job);
						job.del = true;
					}
				}
			}
		}
	},

	triggerLoop: function () {
		// isPerforming is a safety flag that setTimeout isn't triggered twice
		if (!runloop.isPaused() && !runloop.isPerforming) {
			runloop.isPerforming = true;

			// setTimeout is used instead of interval, because an iteration can take some time
			// we don't want troublemaker, right?
			window.setTimeout(runloop.loop, runloop.timeInterval);
		}
	},

	pause: function (device, identifier) {
		if (!identifier) {
			runloop.isPerforming = false;
			runloop.pauseValue = true;
		}
		else {
			var job = runloop.findJob(device, identifier);
			if (job) {
				job.pause = true;
			}
		}
	},

	isPaused: function (device, identifier) {
		if (!identifier) {
			return runloop.pauseValue;
		}
		else {
			var job = runloop.findJob(device, identifier);
			if (job) {
				return job.pause;
			}
		}
	},

	findJob: function (device, identifier) {
		device = device || runloop.pseudoDevice;
		for (var jobIndex in runloop.jobs) {
			if (runloop.jobs.hasOwnProperty(jobIndex)) {
				var job           = runloop.jobs[jobIndex],
					jobIdentifier = job.controller + '-' + job.action;

				if (jobIdentifier === identifier && (job.device === device || device === '*')) {
					return job;
				}
			}
		}

		return null;
	},
	findByUid: function(uid) {
		var res = [];
		for (var jobIndex in runloop.jobs) {
			if (runloop.jobs.hasOwnProperty(jobIndex)) {
				var job           = runloop.jobs[jobIndex];
				if(uid == job.uid) {
					res.push(job);
				}
			}
		}

		return res;
	},
	setChecksum: function (checksum, device, identifier) {
		if (!identifier || typeof(checksum) != 'string') {
			return false;
		}
		else {
			var job = runloop.findJob(device, identifier);
			if (job) {
				job.checksum = checksum;
				return checksum;
			}
		}
	},

	findIteration: function (interval, later) {
		var iteration = runloop.iteration + 1;
		if(later) {
			iteration = runloop.iteration + interval;
		} else {
			// the plus one is for safety reasons,
			for (var jobIndex in runloop.jobs) {
				var runJob = runloop.jobs[jobIndex];
				if (interval == runJob.interval && runloop.iteration <= runJob.iteration) {
					if (runJob.iteration == runloop.iteration) {
						iteration = runJob.iteration + interval;
					}
					else {
						iteration = runJob.iteration;
					}
				}
			}
		}

		return iteration;
	},

	play: function (device, identifier) {
		var done = false;

		if (!identifier) {
			runloop.pauseValue = false;
			runloop.triggerLoop();
			done = true;
		}
		else {
			var job = runloop.findJob(device, identifier);
			if (job) {
				job.pause = false;
				job.iteration = runloop.findIteration(job.interval);
				done = true;
			}
		}

		return done;
	},

	addJob: function (job) {
		var added  = false,
			runJob = runloop.findJob(job.device, job.controller + '-' + job.action);

		if (!runJob){
			job.iteration = runloop.findIteration(job.interval, job.once);

			// if (!job.device) {
			// 	Reloader.pseudoDevice;
			// }

			runloop.jobs.push(job);
			added = true;
		}
		else if (runJob.pause && runJob.iteration + runJob.interval > runloop.iteration){
			runJob.pause = false;
			runJob.iteration = runloop.findIteration(job.interval, job.once);
			added = true;
			runJob.uid = job.uid;
		}

		return added;
	},
	once: function(job) {
		job.once = true;
		if(!job.interval) {
			job.interval = 1;
		}
		return this.addJob(job);
	},
	clear: function () {
		// we only want to delete the request-jobs (Reloader consited only of https.Server(opts, requestListener);)
		for (var jobIndex in runloop.jobs) {
			if (runloop.jobs.hasOwnProperty(jobIndex)) {
				var job = runloop.jobs[jobIndex];
				if (job.type == 'request') {
					job.del = true;
				}
			}
		}
	},

	clearEvent: function (event) {
		var newJobs = [];
		for (var jobIndex in runloop.jobs) {
			if (runloop.jobs.hasOwnProperty(jobIndex)) {
				var job = runloop.jobs[jobIndex];
				if ($.inArray(event.type, job.clearEvents) === -1) {
					newJobs.push(job);
				}
			}
		}

		runloop.jobs = newJobs;
	}
};

app.runloop = runloop;
