app.view = app.view || {};

app.view.Dragger = {
	events: [
		{
			selector: '.dragPanel',
			type: 'mousedown',
			action: 'yDragging'
		},
		{
			selector: '.xyDraggable',
			type: 'mousedown',
			action: 'xyDragging'
		},
		{
			selector: '.mockUpDiv, .dragPanel, body',
			type: 'mouseup',
			action: 'stopDraggingUp'
		},
	
	],

	rackViewWidget: '.rackViewWidget',
	dragPanel: '.dragPanel',
	splitView: '.splitView',
	subContent: '#subContent',

	yDragging: function(opt, evt, target) {
		opt = $.extend({handle:"",cursor:"move"}, opt);
		var dragger = target.addClass('active-handle').parent().addClass('draggable');

		if(opt.handle === "") {
			dragger = target.addClass('draggable');
		}

		var z_idx = dragger.css('z-index'),
			drg_h = dragger.outerHeight(),
			pos_y = dragger.offset().top + drg_h - evt.pageY;
			pos_target = target.parent()[0].offsetTop;

		dragger.css('z-index', 1000).parents().on("mousemove", function(e) {
			if (target.hasClass('draggable')) {
				$('.draggable').offset({
					top:e.pageY + pos_y - drg_h + 20
				}).on("mouseup", function() {
					$(this).removeClass('draggable');
				});
			}

			if(target.parent()[0].offsetTop <= 30){
				target.parent().removeClass('draggable');
				target.removeClass('draggable');
			}
		});
		evt.preventDefault();
	},

	xyDragging: function(data, evt, target) {
		var dragger = target.addClass('active-handle').parent().addClass('draggable');

		dragger = target.addClass('draggable');

		var z_idx = dragger.css('z-index'),
			drg_h = dragger.outerHeight(),
			drg_w = dragger.outerWidth(),
			pos_y = dragger.offset().top + drg_h - evt.pageY,
			pos_x = dragger.offset().left + drg_w - evt.pageX;

		dragger.css('z-index', 1000).parents().on("mousemove", function(e) {
			$('.draggable').offset({
				top: e.pageY + pos_y - drg_h,
				left: e.pageX + pos_x - drg_w
			}).on("mouseup", function() {
				$(this).removeClass('draggable');
			});
		});
		evt.preventDefault();
	},

	stopDragging: function(opt, evt, target) {
		//console.log('__test');
		this.obj('dragPanel').removeClass('draggable');
		this.obj('dragPanel').removeClass('active-handle').parent().removeClass('draggable');
		evt.preventDefault();
	},

	stopDraggingUp: function(opt, evt, target) {
		this.obj('dragPanel').removeClass('draggable');
		this.obj('dragPanel').removeClass('active-handle').parent().removeClass('draggable');
		if(target.hasClass('draggable')) {
			target.removeClass('draggable');
		}
		this.obj('dragPanel').removeClass('active-handle').parent().removeClass('draggable');
	},

};

