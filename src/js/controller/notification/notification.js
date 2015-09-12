app.Controller('notification-notification', {
	
	showNotification: function (payload) {
		if (!payload.text) return;
		clearTimeout(this.timeout);
		this.alertClass = 'alert-' + payload.type;
		//this.set('options', { alertClass: this.alertClass + ' shown'});
		//this.set('message', payload.text);
		$('.notification').addClass(this.alertClass + ' shown');
		$('.notification .message').text(payload.text);
		if (payload.time) {
			var time = payload.time*1000;
			var self = this;
			this.timeout = setTimeout(function() {
				self.closeNotification();
			}, time);
		}
	},
	
	closeNotification: function () {
		// remove class 'shown' from alertClass
		$('.notification').removeClass(this.alertClass + ' shown');
		$('.notification .message').text('');
		//this.set('options', { alertClass: this.alertClass });
	}
});
