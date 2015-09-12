app.time = {
	zone: 'America/New_York',
	init: function() {
		var self = this;
		app.adapter.add({device: 'x', controller: 'setup', action: 'date', callback: function(res) {
			self.setTimezone(res.tzname);
		}}, true);
	},
	setTimezone: function(name) {
		this.zone   = name;
		this.offset = false;
		localStorage.setItem('timezone', name);
	},
	getTimezone: function() {
		var item = localStorage.getItem('timezone');
		if(item) {
			this.zone = item;
		}
		return this.zone;
	},
	
	getDate: function(timestamp, forceAmerica, clear) {
		var tz = this.getTimezone();
		if(!tz) { // If timezone is not set, momentjs throws exception
			console.warn('Timezone is not set!');
			return moment(timestamp,"X").format("DD.MM.YYYY");
		} else if(tz.indexOf("Europe")===0){
			return moment(timestamp,"X").tz(this.zone).format("DD.MM.YYYY");
		}else{
			return moment(timestamp,"X").tz(this.zone).format("MM/DD/YYYY");
		}
	},

	getTime: function(timestamp, detail, clear) {
		detail = (detail !== undefined) ? detail : false;
		var res = "";
		if(!this.zone) { // If timezone is not set, momentjs throws exception
			console.warn('Timezone is not set!');
			res = moment(timestamp,"X").format("HH:mm:ss");
		} else if (detail) {
			res = moment(timestamp,"X").tz(this.zone).format("HH:mm:ss");
		} else {
			res = moment(timestamp,"X").tz(this.zone).format("HH:mm");
		}
		return res;
	
	},

	/**
	 * requiered format: "30-05-2014 10:47:43"
	 */
	getTimestamp: function(timestring) {
		var res = 0;
		if (timestring === undefined || timestring === ""){
			res = moment().format("X");
		} else {
			res =moment.tz(timestring,"DD-MM-YYYY HH:mm:ss",this.zone).unix();
		}
		return res;
	},

	__buildTimeStr: function(year, month, day, hours, minutes, seconds) {
		//requiered format in moment.js : "30-05-2014 10:47:43"
		var timeStr = '';

		var HH = this.long(parseInt(hours,10));
		var mm = this.long(parseInt(minutes,10));
		var ss = this.long(parseInt(seconds,10));

		timeStr = day+'-'+month+'-'+year+' '+HH+':'+mm+':'+ss;

		return timeStr;
	},


	long: function(value) {
		var valueString = String(value);
		if(valueString.length === 1) {
			valueString = '0' + valueString;
		}

		return valueString;
	},
};

// app.time.init();
