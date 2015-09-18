app = app || {};

app.view.smartscroll = {
    events: [
        {
            type: 'dragstart',
            action: '_handleDragStart'
        },
        {
            type: 'drag',
            action: '_handleDrag'
        },
        {
            type: 'dragover',
            action: '_handleDragOver'
        },
        {
            selector: '.dot',
            type: 'click',
            action: 'setScrollHandle'
        },
        {
            selector: '.dot',
            type: 'mousedown',
            action: 'dragHandler'
        }
    ],

    generate: function(obj) {
        var containerID = obj.containerID,
            array       = obj.elements,
            length      = obj.elements.length;

        app.smartscroll.minimum     = 0;
        app.smartscroll.maximum     = 199;
        app.smartscroll.count       = elements.length;
        app.smartscroll.elements    = elements;
        app.smartscroll.containerID = obj.containerID;

        $(containerID).append('<div class="">Please wait while the data is being loaded...</div>');

        app.smartscroll.initDom({elements: array, containerID: containerID});
    },

    filter: function(obj) {
    },

    update: function(obj) {
        if(obj.type == 'array') {
            app.smartscroll.elements = obj.elements;
        }
    },


    /////////////////////////////////////
    // Dom Elements
    ////////////////////////////////////
    initDom: function(obj) {
        var activityCounter  = 0;
        var elementString    = '';
        var elementCollector = app.smartscroll.elements || [];
        var min              = app.smartscroll.minimum || 0;
        var max              = app.smartscroll.maximum || 199;

        for(var i in elementCollector) {
            ++activityCounter;
            if(i >= min && i <= max) {
                elementString = elementString + elementCollector[i];

                if(activityCounter == elementCollector.length) {
                    $(obj.containerID).empty();
                    $(obj.containerID).before('<div class="pseudo-scroll-element row top" style="height: 1px; width: 100%;"></div>');
                    $(obj.containerID).after('<div class="pseudo-scroll-element row bottom" style="height: 100px; width: 100%;"></div>');
                    $(obj.containerID).after('<div class="scrollbar-container"></div>');
                    $(obj.containerID).append(elementString);
                    app.smartscroll.generateScrollbar();
                }
            }
        }

    },

    updateDom: function(opt) {
        var min             = app.smartscroll.minimum;
        var max             = app.smartscroll.maximum;
        var version         = opt.version || null;
        var type            = opt.type    || null;

        var itemMin         = parseInt($('.item-panel').first().attr('data-id'));
        var itemMax         = parseInt($('.item-panel').last().attr('data-id'));

        var oldmin          = app.smartscroll.oldMinimum;
        var oldmax          = app.smartscroll.oldMaximum;

        if(type == 'scroll') {

            if(opt.direction == 'down') {
                app.smartscroll.__attacheElements({append: true, elements: app.smartscroll.elements, min: itemMax+1, max: itemMax+opt.counter});
                for(var x = 0; x < ((opt.counter*3)/4); x++) {
                    $('.item-panel[data-value='+x+']').remove();
                }
            } else if(opt.direction == 'up') {
                app.smartscroll.__attacheElements({append: false, elements: app.smartscroll.element, min: itemMin-opt.counter, max: itemMin-1});
                for(var y = itemMax; y < ((opt.counter*3)/4); y--) {
                    $('.item-panel[data-value='+y+']').remove();
                }
            }

        } else if(type == 'change') {

            if(version == 'default') {
                app.smartscroll.initDom({});
            }

        } else if(type == 'click') {
            app.smartscroll.generateDom({});
        } else if(type == 'drag') {

            if(opt.direction == 1 && opt.append === true) {
                app.smartscroll.__attacheElements({append: true, translations: translations, min: itemMax+1, max: itemMax+col});
                for(var i = 0; i < col; i++) {
                    $('.item-panel').first().remove();
                }
            } else if(opt.direction == 0 && opt.append === false) {
                app.smartscroll.__attacheElements({append: false, translations: translations, min: itemMin-col, max: itemMin-1});
                for(var i = 0; i < col; i++) {
                    $('.item-panel').last().remove();
                }
            }

        }
    },

    __attacheElements: function(opt) {
        if(opt.append === true) {

        } else if(opt.append === false) {

        }
    },


    /////////////////////////////////////
    // Scrollbar
    ////////////////////////////////////
    generateScrollbar: function(length) {
        var length     = app.smartscroll.elements.length;
        var snappingNz = length+1; // start + num + end
        var stepsize   = 1.0/(snappingNz);
        var height     = 100/length;
        var active     = false;
        
        app.smartscroll.count = length;
        
        if(length > 100) {
            var valueMin = ion.minimum + 25;

            $('.scrollbar-container').empty();
            //$('.scrollbar-container').empty();

            for (var i = 0; i <= snappingNz; i++) {
                var step       = (stepsize*(i))*100;
                var activeFlag = active ? 'active' : '';
                var hidden     = (i == 0 || i == snappingNz) ? 'hide' : '';
                            
                var dot = "<div class='dot snapping-dot "+hidden+" "+activeFlag+"' style='top: "+step+"%; height: "+height+"%;'  data-offset='"+step+"' data-snappos='"+i+"'></div>";

                $('.scrollbar-container').append(dot);
            }

            app.smartscroll.__calcSnappingPosition(valueMin);
            app.smartscroll.handleScroll();
        } else {
            $('.scrollbar-container').empty();
        }

    },

    __calcSnappingPosition: function(value) {
        var minimum    = parseInt(value) - 99;
        var maximum    = parseInt(value) + 99;

        app.smartscroll.oldMinimum = app.smartscroll.minimum;
        app.smartscroll.oldMaximum = app.smartscroll.maximum;

        if(minimum < 0) {
            minimum    = 0;
            maximum    = 200;
        }
        if(maximum >= app.smartscroll.elements.length) {
            minimum    = app.smartscroll.elements.length - 198;
            maximum    = app.smartscroll.elements.length;
        }

        $('.snapping-dot').each(function() {
            var self    = $(this);
            var snappos = parseInt(self.attr('data-snappos'));

            if(snappos >= minimum && snappos <= maximum) {
                self.addClass('active');
            } else {
                self.removeClass('active');
            }
        });

        app.smartscroll.minimum = minimum;
        app.smartscroll.maximum = maximum;

    },


    ////////////////////////////////////
    // Click Action Handler
    ///////////////////////////////////
    handleClick: function (data) {
        var snapValue = parseInt(data.snappos);

        app.smartscroll.__calcSnappingPosition(snapValue);

        app.smartscroll.__setPositionCookie();

        app.smartscroll.updateDom({min: app.smartscroll.minimum, max: app.smartscroll.maximum, type: 'click'});

        if(app.smartscroll.minimum !== 0) {
            $('#items').scrollTop(330);
        }
    },


    /////////////////////////////////////
    // Scroll Action Handler
    ////////////////////////////////////
    handleScroll: function () {
        var lastScrollTop    = app.smartscroll.lastScrollTop;
        var singleItemHeight = 0;
        var singleItem       = $('.item-panel');
        var scrollPosition   = lastScrollTop + 182;

        $('#items').scroll(function(event){
            var st               = $(this).scrollTop();
            var min              = parseInt($('.dot.active').first().attr('data-snappos'));
            var max              = parseInt($('.dot.active').last().attr('data-snappos'));
            var valuedown        = min;
            var valueup          = max;

            if (st > lastScrollTop && max <= app.smartscroll.count){
                // scrolling down
                var pseudoBottom = $('.pseudo-scroll-element.bottom');
                var firstItem    = $('.item-panel').first();
                var windowHeight = window.innerHeight;

                if(lastScrollTop >= scrollPosition) {
                    scrollPosition = lastScrollTop;
                    app.smartscroll.__setScrollValues({type: null, value: valuedown});
                }

                if(pseudoBottom.position().top > windowHeight && pseudoBottom.position().top < (windowHeight + 2000)) {
                    app.smartscroll.updateDom({min: app.smartscroll.minimum, max: app.smartscroll.maximum, type: 'scroll', direction: 'down', counter: itemCounter});
                }

            } else if(st < lastScrollTop && min >= 0) {
                // scrolling up
                var pseudoTop    = $('.pseudo-scroll-element.top');
                var firstItem    = $('.item-panel').first();
                var windowHeight = window.innerHeight;
                var heighestItem = 0;

                if(lastScrollTop <= scrollPosition) {
                    scrollPosition = lastScrollTop;
                    app.smartscroll.__setScrollValues({type: null, value: valueup});
                }

                if(pseudoTop.position().top < windowHeight && pseudoTop.position().top > (windowHeight - 3000)) {
                    app.smartscroll.updateDom({min: app.smartscroll.minimum, max: app.smartscroll.maximum, type: 'scroll', direction: 'up', counter: itemCounter});
                }

            }
            lastScrollTop = st;
        });
    },

    __setScrollValues: function(opt) {
        app.smartscroll.__calcSnappingPosition(opt.value);
        app.smartscroll.__setPositionCookie();
    },


    /////////////////////////////////////
    // Scroll Action Handler
    ////////////////////////////////////
    handleDrag: function (evt) {
        var direction = 1; // 1 is for dragging down and 0 for dragging up
        var start     = app.smartscroll.minimum;

        $('.dot').on('mousedown', function() {
            start          = app.smartscroll.minimum;
            app.smartscroll.draggable = true;
        }).on('mouseover', function(e){
            if (app.smartscroll.draggable) {
                var elem        = $(this);
                var oldMinimum  = app.smartscroll.minimum;
                var oldMaximum  = app.smartscroll.maximum;
                var snapValue   = parseInt(elem.attr('data-snappos'));
                var append      = null;

                app.smartscroll.__calcSnappingPosition(snapValue);

                if (!elem.hasClass('active')) {
                    elem.addClass('active');
                }

                direction = app.smartscroll.__getDirection({oldMinimum: oldMinimum, oldMaximum: oldMaximum});

                app.smartscroll.__setPositionCookie();

                var validAppend  = start+col-1;
                var validPrepend = start-col+1;

                if(app.smartscroll.minimum >= validAppend) {
                    append = true;
                    start  = app.smartscroll.minimum;
                }

                if(app.smartscroll.minimum < validPrepend) {
                    append = false;
                    start  = app.smartscroll.minimum;
                }

                app.smartscroll.updateDom({min: app.smartscroll.minimum, max: app.smartscroll.maximum, type: 'drag', direction: direction, append: append});
            }
        }).on('mouseup', function() {
            app.smartscroll.draggable = false;
        });
    },


    ////////////////////////////////////
    // General Private Functions
    ///////////////////////////////////
    __getDirection: function(opt) {
        var direction = 1;

        if(opt.oldMinimum < app.smartscroll.minimum) {
            direction = 1;
        } else if(opt.oldMaximum > app.smartscroll.maximum) {
            direction = 0;
        }

        return direction;
    },

    __setPositionCookie: function() {
        app.smartscroll.__cookie.set({cname: 'lastMinPosition', content: app.smartscroll.minimum});
        app.smartscroll.__cookie.set({cname: 'lastMaxPosition', content: app.smartscroll.maximum});
    },

    __cookie: {
    //var __cookie = {
        set: function (opt) {
            var d = new Date();
            var cname = opt.cname;
            d.setTime(d.getTime() + (opt.exdays*24*60*60*1000));
            var expires = "expires="+d.toUTCString();
            var path = "path=/";
            document.cookie =cname + "=" + opt.content + "; " + expires + ";" + path;
        },

        get: function (opt) {
            var name = opt.cname+'=';
            var ca = document.cookie.split(';');
            for(var i=0; i<ca.length; i++) {
              var c = ca[i];
              while (c.charAt(0)==' ') c = c.substring(1);
              if (c.indexOf(name) != -1) return c.substring(name.length, c.length);
            }
            return "";
        },

        delete: function(opt) {
            document.cookie = opt.cname+"=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
        }
    },

};
