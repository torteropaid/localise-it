app.view('notification-notification', {
	events: [ 
		{
			action: 'closeNotification',
			type: 'click',
			selector: '.notification .close',
		},
		{
			action: 'showNotification',
			type: 'showNotification'
		},
		{
			action: 'closeNotification',
			type: 'closeNotification'
		}
	],
});
