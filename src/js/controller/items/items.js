app.Controller('items-items', {
    col: 0,

    init: function() {
        ion.__scrollDirection = 1; // 1 is 'down' and 0 is 'up'

        this.setSelectedLanguages();

        this.changes         = false;
        this.changedData     = [];

        this.lastScrollTop   = 0;
        this.setItems({});

        this.filterTranslations();
        this.renderDom({min: ion.minimum, max: ion.maximum, filter: ion.filter, defaultLanguage: ion.defaultLanguage});
        this.trigger('setSearchValue', {value: ion.filter});
    },


    ////////////////////////////////////////////////////////////////////////
    // Render all elements for rendering the dom initially or on filtering
    ///////////////////////////////////////////////////////////////////////
    renderDom: function(opt) {
        $('.panel-container').empty();
        this.trigger('toggleLoading', {flag: true});
        var translations    = [];
        var min             = opt.min || ion.minimum;
        var max             = opt.max || ion.maximum;

        translations = ion.filteredTranslationsArray;
        ion.count    = translations.length;

        this.__generateElements({min: min, max: max, translations: translations});

        this.__generateScrollbar({});
        
        this.trigger('clearAutocomplete');

        var self = this;

        setTimeout(function() {
            if(window.innerWidth <= 760) {
                self.showDialogue({id: 0});
            }
        }, 200);
    },


    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Generate all elements for the scrollbar according to the total number of translations and for the item panels
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    __generateElements: function(opt) {
        var id, key, defaultTranslation, selected, text, checked, name, languageKey, elementCounter = 0, loopCounter = 0, elementCollector = [];
        var defaultLanguage = ion.defaultLanguage, translations = opt.translations, languages = ion.languages;
        var max             = opt.max, min = opt.min;
        var append          = opt.append || true;

        for(var i in translations) {
            if(parseInt(i) >= min && parseInt(i) <= max) {
                id                 = translations[i].identifier;
                key                = translations[i].namespace+'.<b>'+translations[i].name+'</b>';
                defaultTranslation = translations[i].texts[defaultLanguage.id];

                var translationsArray = []
                for(var j in languages) {
                    selected    = languages[j].selected;
                    text        = translations[i].texts[languages[j].id] || "";
                    checked     = translations[i].checks[languages[j].id] ? true : false;
                    name        = languages[j].name;
                    languageKey = j;
                    translationsArray.push({selected: selected, text: text, checked: checked, name: name, languageKey: languageKey});
                }
                element = this.__createElement({id: id, key: key, defaultTranslation: defaultTranslation, translations: translationsArray, counter: elementCounter});
                elementCollector.push(element);
                ++elementCounter;
            }
            
            ++loopCounter;

            this.__attachElements({loopCounter: loopCounter, count: ion.count, elementCollector: elementCollector, append: append});
        }
    },

    __attacheElements: function(opt) {
        var elementString    = '';
        var activityCounter  = opt.activityCounter  || 0;
        var elementCollector = opt.elementCollector || [];

        if(opt.loopCounter == opt.count) {
            for(var i in elementCollector) {
                elementString = elementString + elementCollector[i];
                ++activityCounter;
            }

            if(opt.append) {
                $('.panel-container').append(elementString);
                //$('.panel-container').html(elementString);
            } else {
                $('.panel-container').prepend(elementString);
            }
            
            if(activityCounter == elementCollector.length) {
                this.trigger('toggleLoading', {flag: false});
            }
        }
    },

    __generateScrollbar: function(opt) {
        var count           = opt.count || ion.count;
        var snappingNz      = count+1; // start + num + end
        var stepsize        = 1.0/(snappingNz);
        var height          = 100/count;
        var active          = false;
        
        if(ion.count > 100) {
            var valueMin = ion.minimum + 25;

            for (var i = 0; i <= snappingNz; i++) {
                var step = (stepsize*(i))*100;
                var activeFlag = active ? 'active' : '';
                var hidden = (i == 0 || i == snappingNz) ? 'hide' : '';
                            
                var dot = "<div class='dot snapping-dot "+hidden+" "+activeFlag+"' style='top: "+step+"%; height: "+height+"%;'  data-offset='"+step+"' data-snappos='"+i+"'></div>";

                $('.scrollbar-container').append(dot);
            }

            this.__calcSnappingPosition(valueMin);
            this.__scrollHandler();
        } else {
            $('.scrollbar-container').empty();
        }

    },


    /////////////////////////////////////////////////////////////////
    // Creating string of all selected languages to save in cookie
    ////////////////////////////////////////////////////////////////
    setSelectedLanguages: function() {
        var languages     = ion.languages;
        var selectedArray = [];
        var counter       = 0;

        for(var i in languages) {
            if(languages[i].selected) {
                selectedArray.push(i);
                counter++;
            }
        }

        var str = selectedArray.join(',');

        ion.selectedLanguages = str;
        ion.cookie.set({cname: 'selectedLanguages', content: str});
    },


    ///////////////////////////////////////////////////////////////
    // Setting of global variables called by differnet controller
    //////////////////////////////////////////////////////////////
    setLanguages: function(opt) {
        var languages = opt.languages;
        ion.languages = languages;

        this.setSelectedLanguages();
    },

    setItems: function(opt) {
        ion.translations = opt.translations || ion.allTranslations;
        ion.langauges    = opt.languages    || ion.languages;
    },


    ////////////////////////////////////////////////////////////////
    // Creating array of all translations that fit the filter data
    ///////////////////////////////////////////////////////////////
    filterTranslations: function() {
        var counter                   = 0;
        var translationsArray         = [];
        var filteredTranslationsArray = [];
        var tab                       = ion.tab;
        var filter                    = ion.filter;
        var translations              = ion.allTranslations;

        var filteredByTab = this.__filterByTab({translations: translations, tab: tab});
        
        if(filter != '' && filter != null && filter.length > 0) {
            
            for(var i in filteredByTab) {
                var str = filteredByTab[i].namespace+'.'+filteredByTab[i].name;

                if(str.startsWith(filter)) {
                    filteredTranslationsArray[counter] = filteredByTab[i];
                    ++counter;
                } else if(str.indexOf(filter) > 0) {
                    filteredTranslationsArray[counter] = filteredByTab[i];
                    ++counter;
                }
            }

            ion.filteredTranslationsArray = filteredTranslationsArray;
        } else {
            ion.filteredTranslationsArray = filteredByTab;
        }

    },

    __filterByTab: function(opt) {
        var array              = opt.translations;
        var i, j, trans, check, text;
        var filteredByTabArray = [];

        for (i in array) {
            trans = array[i];
            if (opt.tab==3) { // unchecked
                var unchecked = false;

                for (j=1; j<7; j++) {
                    check = trans.checks[j];
                    if (check==false || check==undefined) {
                        unchecked = true;
                    }
                }
                if (unchecked) filteredByTabArray.push(trans);
            } else if (opt.tab==2) { // New
                var newItem = false;

                for (j=1; j<7; j++) {
                    text = trans.texts[j];
                    if (text=='' || text==undefined) {
                        newItem = true;
                    }
                }
                if (newItem) filteredByTabArray.push(trans);
            } else filteredByTabArray = array;
        }

        return filteredByTabArray;
    },


    ////////////////////////////////////////////////////////////////
    // Display Dialogue according to clicked panel
    ///////////////////////////////////////////////////////////////
    showDialogue: function(data, evt, target) {
        var id = data.id;

        var defaultLanguage = ion.defaultLanguage;
        var translations    = ion.allTranslations;
        var languages       = ion.languages;
        var count           = ion.count;

        this.trigger('showOverlay', {
            index: parseInt(id),
            defaultLanguage: defaultLanguage,
            translations: translations,
            languages: languages,
            count: count
        });
    },


    ////////////////////////////////////////////////////////////////
    // Set scroll handle on click
    ///////////////////////////////////////////////////////////////
    setScrollHandle: function(data, evt, target) {
        var snapValue = parseInt(data.snappos);

        this.__calcSnappingPosition(snapValue);

        this.__setPositionCookie();

        this.updateDom({min: ion.minimum, max: ion.maximum, type: 'click'});

        if(ion.minimum !== 0) {
            $('#items').scrollTop(330);
        }
    },

    __setPositionCookie: function() {
        ion.cookie.set({cname: 'lastMinPosition', content: ion.minimum});
        ion.cookie.set({cname: 'lastMaxPosition', content: ion.maximum});
    },


    ////////////////////////////////////////////////////////////////
    // Set scroll handle on drag
    ///////////////////////////////////////////////////////////////
    dragHandler: function(data, evt, target) {
        var direction = 1; // 1 is for dragging down and 0 for dragging up
        var col       = this.col
        var self      = this;
        var start     = ion.minimum;

        $('.dot').on('mousedown', function() {
            start          = ion.minimum;
            self.draggable = true;
        }).on('mouseover', function(e){
            if (self.draggable) {
                var elem        = $(this);
                var oldMinimum  = ion.minimum;
                var oldMaximum  = ion.maximum;
                var snapValue   = parseInt(elem.attr('data-snappos'));
                var append      = null;

                self.__calcSnappingPosition(snapValue);

                if (!elem.hasClass('active')) {
                    elem.addClass('active');
                }

                direction = self.__getDirection({oldMinimum: oldMinimum, oldMaximum: oldMaximum});

                self.__setPositionCookie();

                var validAppend  = start+col-1;
                var validPrepend = start-col+1;

                if(ion.minimum >= validAppend) {
                    append = true;
                    start  = ion.minimum;
                }

                if(ion.minimum < validPrepend) {
                    append = false;
                    start  = ion.minimum;
                }

                self.updateDom({min: ion.minimum, max: ion.maximum, type: 'drag', direction: direction, append: append});
            }
        }).on('mouseup', function() {
            self.draggable = false;
        });
    },

    __getDirection: function(opt) {
        var direction = 1;

        if(opt.oldMinimum < ion.minimum) {
            direction = 1;
        } else if(opt.oldMaximum > ion.maximum) {
            direction = 0;
        }

        return direction;
    },


    ////////////////////////////////////////////////////////////////
    // private function to catch scroll event and scroll direction
    ///////////////////////////////////////////////////////////////
    __scrollHandler: function() {
        var lastScrollTop    = this.lastScrollTop;
        var self             = this;
        var col              = 0;
        var singleItemHeight = 0;
        var singleItem       = $('.item-panel');
        var scrollPosition   = lastScrollTop + 182;
        
        singleItem.each(function() { 
            if($(this).position().top == 0) { 
                ++col; // number of elements next to each other
            } 
        });

        this.col            = col;

        $('#items').scroll(function(event){
            var st               = $(this).scrollTop();
            var min              = parseInt($('.dot.active').first().attr('data-snappos'));
            var max              = parseInt($('.dot.active').last().attr('data-snappos'));
            var valuedown        = min + (25 + col);
            var valueup          = max - (25 + col);

            if (st > lastScrollTop && max <= ion.count){
                // scrolling down
                var pseudoBottom = $('.pseudo-scroll-element.bottom');
                var firstItem    = $('.item-panel').first();
                var windowHeight = window.innerHeight;
                var heighestItem = 0;

                if(lastScrollTop >= scrollPosition) {
                    singleItem.each(function() {
                        var item = $(this);
                        if(item.position().top >= 0 && item.position().top < 182) {
                            singleItemHeight = item.innerHeight();
                            if(item.innerHeight() >= heighestItem) {
                                heighestItem = item.innerHeight();
                            }
                        }
                    });

                    scrollPosition = lastScrollTop + singleItemHeight;
                    self.__setScrollValues({type: null, value: valuedown});
                }

                if(pseudoBottom.position().top > windowHeight && pseudoBottom.position().top < (windowHeight + 2000)) {
                    var itemCounter = 0;
                    singleItem.each(function() {
                        var item = $(this);
                        if(item.position().top < windowHeight) {
                            itemCounter++;
                        }
                    });
                    self.updateDom({min: ion.minimum, max: ion.maximum, type: 'scroll', direction: 'down', counter: itemCounter});
                }
            } else if(st < lastScrollTop && min >= 0) {
                // scrolling up
                var pseudoTop    = $('.pseudo-scroll-element.top');
                var firstItem    = $('.item-panel').first();
                var windowHeight = window.innerHeight;
                var heighestItem = 0;

                if(lastScrollTop <= scrollPosition) {
                    singleItem.each(function() {
                        var item = $(this);
                        if(item.position().top < 0 && item.position().top < -182) {
                            singleItemHeight = item.innerHeight();
                            if(item.innerHeight() >= heighestItem) {
                                heighestItem = item.innerHeight();
                            }
                        }
                    });

                    scrollPosition = lastScrollTop - singleItemHeight;
                    self.__setScrollValues({type: null, value: valueup});
                }

                if(pseudoTop.position().top < windowHeight && pseudoTop.position().top > (windowHeight - 3000)) {
                    var itemCounter = 0;
                    singleItem.each(function() {
                        var item = $(this);
                        if(item.position().top > windowHeight) {
                            itemCounter++;
                        }
                    });
                    self.updateDom({min: ion.minimum, max: ion.maximum, type: 'scroll', direction: 'up', counter: itemCounter});
                }
            }
            lastScrollTop = st;
        });
    },

    __setScrollValues: function(opt) {
        this.__calcSnappingPosition(opt.value);
        this.__setPositionCookie();
    },


    ////////////////////////////////////////////////////////////////
    // calculating the position of the scroll handle 
    ///////////////////////////////////////////////////////////////
    __calcSnappingPosition: function(value) {
        var minimum    = parseInt(value) - 25;
        var maximum    = parseInt(value) + 25;

        ion.oldMinimum = ion.minimum;
        ion.oldMaximum = ion.maximum;

        if(minimum < 0) {
            minimum    = 0;
            maximum    = 50;
        }
        if(maximum >= ion.count) {
            minimum    = ion.count - 50;
            maximum    = ion.count;
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

        ion.minimum = minimum;
        ion.maximum = maximum;
    },


    ////////////////////////////////////////////////////////////////
    // private function to update the dom according to scrollbar
    ///////////////////////////////////////////////////////////////
    updateDom: function(opt) {
        var min     = opt.min     || ion.minimum;
        var max     = opt.max     || ion.maximum;
        var version = opt.version || null;
        var type    = opt.type    || null;

        var itemMin = parseInt($('.item-panel').first().attr('data-id'));
        var itemMax = parseInt($('.item-panel').last().attr('data-id'));

        var oldmin          = ion.oldMinimum;
        var oldmax          = ion.oldMaximum;
        var translations    = ion.filteredTranslationsArray;
        var defaultLanguage = ion.defaultLanguage;
        var languages       = ion.languages;
        var count           = ion.count;
        var col             = this.col;

        if(type == 'scroll') {

            if(opt.direction == 'down') {
                this.__generateElements({append: true, translations: translations, min: itemMax+1, max: itemMax+opt.counter});
                for(var x = 0; x < ((opt.counter*3)/4); x++) {
                    $('.item-panel[data-value='+x+']').remove();
                }
            } else if(opt.direction == 'up') {
                this.__generateElements({append: false, translations: translations, min: itemMin-opt.counter, max: itemMin-1});
                for(var y = itemMax; y < ((opt.counter*3)/4); y--) {
                    $('.item-panel[data-value='+y+']').remove();
                }
            }

        } else if(type == 'change') {

            if(version == 'default') {
                this.renderDom({});
            } else if(version == 'language') {
                this.__hideShowTranslations();
            }

        } else if(type == 'click') {
            this.renderDom({});
        } else if(type == 'drag') {

            if(opt.direction == 1 && opt.append === true) {
                this.__generateElements({append: true, translations: translations, min: itemMax+1, max: itemMax+col});
                for(var i = 0; i < col; i++) {
                    $('.item-panel').first().remove();
                }
            } else if(opt.direction == 0 && opt.append === false) {
                this.__generateElements({append: false, translations: translations, min: itemMin-col, max: itemMin-1});
                for(var i = 0; i < col; i++) {
                    $('.item-panel').last().remove();
                }
            }

        }

    },


    ////////////////////////////////////////////////////////////////////////
    // private functions to append, prepend and remove elements in the dom 
    ///////////////////////////////////////////////////////////////////////
    __hideShowTranslations: function() {
        var selectedLanguages = ion.selectedLanguages;
        var languageArray     = selectedLanguages.split(',');

        $('.item-panel').each(function() {
            var self          = $(this);
            var translations  = self.find('.translation-field');

            translations.each(function() {
                var trans     = $(this);
                var key       = trans.attr('data-target');

                trans.addClass('hidden');
                for(var i in languageArray) {
                    if(languageArray[i] == key) {
                        if(trans.hasClass('hidden')) {
                            trans.removeClass('hidden');
                        }
                    }
                }
            });
        });
    },

    __appendElements: function(opt) {
        //append new elements due to scroll direction down and remove old elements that are out of range
        //each language in languages -> if language.selected
        var elemnt = null;

        if(opt.itemMin >= (opt.currentMin - 20)) {
            /* Add Element via append*/
            //@TODO add for loop for each element that fits condition and get data for create Element 

            //@TODO push values for languages and translations into global array and splice elements from array that don't fit the conditions anymore

            //var key = trans.namespace+'.<b>'+trans.name+'</b>';
            //element = this.__createElement({id: id, key: key, defaultTranslation: defaultTranslation, translations: transArray});

            //$('.panel-container').append(element);

            //this.__removeElements({min: opt.itemMin, max: opt.itemMax});
        }

    },

    __prependElements: function(opt) {
        //prepend new elements due to scroll direction up and remove old elements that are out of range
        //each language in languages -> if language.selected
        var elemnt = null;

        if(opt.itemMax <= (opt.currentMax + 20)) {
            /* Add Element via prepend*/

            //@TODO add for loop for each element that fits condition and get data for create Element 

            //@TODO push values for languages and translations into global array and splice elements from array that don't fit the conditions anymore

            //element = this.__createElement({id: id, key: key, defaultTranslation: defaultTranslation, translations: transArray});

            //$('.panel-container').prepend(element);

            //this.__removeElements({min: opt.itemMin, max: opt.itemMax});
        }
    },

    __removeElements: function(opt) {
        var items = $('.item-panel');
        var min   = opt.min;
        var max   = opt.max;

        items.each(function() {
            var item = $(this);

            if((parseInt(item.attr('data-id')) >= max) || (parseInt(item.attr('data-id')) <= min)) {
                item.remove();
            }
        });
    },


    ////////////////////////////////////////////////////////////////
    // private function to create translation panels
    ///////////////////////////////////////////////////////////////
    __createElement: function(opt) {
        var element            = null;
        var data               = opt                     || {};

        var id                 = data.id;
        var key                = data.key                || null;
        var counter            = data.counter            || 0;
        var translations       = data.translations;
        var defaultTranslation = data.defaultTranslation || null;

        element = '<div data-id="'+id+'" data-value="'+counter+'" class="col-lg-4 col-md-6 col-sm-12 item-panel">' +
                '<dl>' +
                    '<div class="header-panel" data-id="'+id+'">'+
                        '<dt>' +
                            '<label>Key:</label><span>'+key+'</span>' +
                        '</dt>' +
                        '<dt>' +
                            '<label>Default:</label><span>'+defaultTranslation+'</span>' +
                        '</dt>'+
                    '</div>' +
                    '<div class="translations-panel">';

                    for(var i in translations) {
                        element = element + 
                        '<dd class="'+(translations[i].checked ? 'checked' : '')+' translation-field '+(translations[i].selected ? '' : 'hidden')+'" data-target="'+translations[i].languageKey+'">' +
                            '<label>'+translations[i].name+':</label><input data-target="'+id+'" type="text" class="translations-panel-inputfield" value="'+translations[i].text+'"><span data-target="'+id+'" data-key="'+i+'" data-type="check" class="glyphicon glyphicon-ok"></span>' +
                        '</dd>';
                    }

                    element = element+'</div>' +
                '</dl>' +
            '</div>';
        return element;
    },


    ///////////////////////////////////////////////////////////////////
    // collecting the ids of all changed translations
    //////////////////////////////////////////////////////////////////
    changedTranslationsCollector: function(data, evt, target) {
        var id              = data.target;
        var translations    = ion.allTranslations;
        var defaultLanguage = ion.defaultLanguage;
        var string          = target.val();
        var comparison      = null;
        var changedTrans    = ion.changedTranslations || [];

        for(var i in translations) {
            if(i == id) {
                comparison = translations[i].texts[defaultLanguage.id];
                
                if(string != comparison) {
                    changedTrans.push(id);
                    translations[i].texts[defaultLanguage.id] = string;
                    ion.changedTranslations = changedTrans;
                    ion.translations = translations;
                    this.trigger('showSaveButtonBar', {});
                } else {
                    for(var x in changedTrans) {
                        var index = changedTrans[x].indexOf(id);
                        if(index >= 0) {
                            changedTrans.splice(index, 1);
                        }
                    }
                    if(changedTrans.length == 0) this.trigger('hideSaveButtonBar');
                }
            }
        }

    },

    checkTranslation: function(data, evt, target) {
        var parent       = target.closest('dd');
        var checked      = true;
        var id           = parseInt(data.target);
        var key          = parseInt(data.key);
        var trans        = ion.allTranslations; 
        var languages    = ion.languages;
        var changedTrans = ion.changedTranslations || [];

        parent.toggleClass('checked');
        
        if(target.hasClass('checked')) {
            checked = false;
        }
        
        for(var i in trans) {
            if(i == id) {
                for(var j in languages) {
                    if(key == languages[j].id) {
                        trans[i].checks[languages[j].id] = checked;
                    }
                }
            }
        }

        changedTrans.push(id);
        ion.changedTranslations = changedTrans;
        this.trigger('showSaveButtonBar', {});
    },


    ///////////////////////////////////////////////////////////////////
    // reset of changesTranslations array to an empty array on cancel
    //////////////////////////////////////////////////////////////////
    discardChanges: function() {
        this.trigger('hideSaveButtonBar');
        ion.changedTranslations = [];
    },

});