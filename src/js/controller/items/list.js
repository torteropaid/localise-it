app.Controller('items-list', {
    init: function() {
        this.scrollInitialized = false;
        this.trigger('toggleLoading', {flag: true});
        this.__filterTranslations();
        this.scrollToSelected();

        var self = this;
    },

    notify: function() {
    },

    toggleLocale: function(opt) {
        var languages       = app.languages;

        for(var i in languages) {
            if(opt.key == languages[i]) {
                this.set('selectedLocale', languages[i]);
                this.scrollToSelected();
            }
        }
    },


    /////////////////////////////////////////////////////////////////
    // Creating string of all selected languages to save in cookie
    ////////////////////////////////////////////////////////////////
    setSelectedLanguages: function() {
        var languages     = app.languages;
        var selectedArray = [];
        var counter       = 0;

        for(var i in languages) {
            if(languages[i].selected) {
                selectedArray.push(i);
                counter++;
            }
        }

        var str = selectedArray.join(',');

        app.selectedLanguages = str;
        app.cookie.set({cname: 'selectedLanguages', content: str});
    },


    ///////////////////////////////////////////////////////////////
    // Setting of global variables called by differnet controller
    //////////////////////////////////////////////////////////////
    setLanguages: function(opt) {
        var languages = opt.languages;
        app.languages = languages;

        this.setSelectedLanguages();
    },

    setItems: function(opt) {
        app.translations = opt.translations || app.allTranslations;
        app.languages    = opt.languages    || app.languages;
    },


    ////////////////////////////////////////////////////////////////
    // Creating array of all translations that fit the filter data
    ///////////////////////////////////////////////////////////////
    __filterTranslations: function() {
        var counter                   = 0;
        var translationsArray         = [];
        var filteredTranslationsObject = {};
        //var tab                       = parseInt(app.tab);
        var filter                    = app.filter;
        var translations              = app.allTranslations;
        var localeId                  = app.selectedLocale;

        //var filteredByTab = this.__filterByTab({translations: translations, tab: tab});
        // @TODO if filteredtranslatinslength > 1 and key >1 and str >1 introduce tab to switch between key starting with and containing filter
        // and translation starting with and containing filter
        // add count of translations and keys as well
        
        if(filter != '' && filter != null && filter.length > 0) {
            
            for(var i in translations) {
                var key = i;
                var exists = false;
                var newObj = {};

                for(var x in filteredTranslationsObject) {
                    var index = x.indexOf(filter);
                    if(index >= 0) {
                        exists = true;
                    }
                }

                if(key && key.startsWith(filter)) {
                    newObj[key] = translations[i];
                    filteredTranslationsObject[key] = translations[i];
                    ++counter;
                }
            }
            
            for(var i in translations) {
                var key = i;
                var newObj = {};

                if(key && key.indexOf(filter) > 0) {
                    newObj[key] = translations[i];
                    filteredTranslationsObject[key] = translations[i];
                    ++counter;
                }
            }
            
            for(var i in translations) {
                var str = translations[i].mapping[localeId];
                var newObj = {};

                if(str && str.startsWith(filter)) {
                    newObj[key] = translations[i];
                    filteredTranslationsObject[key] = translations[i];
                    ++counter;
                }
            }
            
            for(var i in translations) {
                var str = translations[i].mapping[localeId];
                var newObj = {};

                if(str && str.indexOf(filter) > 0) {
                    newObj[key] = translations[i];
                    filteredTranslationsObject[key] = translations[i];
                    ++counter;
                }
            }

            app.filteredTranslationsObject = filteredTranslationsObject;
            if(filteredTranslationsObject.length == 1) {
                for(var i in filteredTranslationsObject) {
                    this.showSelectedItem({id: filteredTranslationsObject[i].id});
                }
            }

            //this.__renderDom(filteredTranslationsObject);
            this.set('allTranslations', filteredTranslationsObject);
        } else {
            app.filteredTranslationsObject = translations;
            //this.__renderDom(translations);
            this.set('allTranslations', translations);
        }

        this.trigger('toggleLoading', {flag: false});

    },

    __renderDom: function(obj) {
        var strArray       = [];
        var size           = Object.size(obj);
        var selectedLocale = this.get('selectedLocale');
        var cluster;

        for(var i in obj) {
            var str = '<div class="item-panel col-md-12" data-id="'+obj[i].id+'" data-value="'+i+'">';
                str += '<dl class="'+(obj[i].selected ? 'selected' : '')+'" data-value="'+i+'" data-id="'+obj[i].id+'">';
                    str += '<div class="header-panel" data-id="'+obj[i].id+'">';
                        str += '<dt>';
                            str += '<label>Key:</label><span>'+i+'</span>';
                        str += '</dt>';

                        for(var l in obj[i].mapping) {
                            str += '<dt class="'+(selectedLocale == i ? '' : 'hidden')+'">';
                                str += '<label>Locale:</label><span>'+obj[i].mapping[j]+'</span>';
                            str += '</dt>';
                        }
                    str += '</div>';

                    str += '<div class="item-button-panel" data-id="'+i+'">';
                        str += '<dt class="item-delete-panel" data-id="'+i+'">';
                            str += '<span class="item-delete-icon"><span class="icon glyphicon glyphicon-trash"></span></span>';
                        str += '</dt>';

                        str += '<dt class="item-status-panel" data-id="'+i+'">';
                            str += '<span class="item-delete-icon"><span class="icon glyphicon '+(obj[i].done ? 'glyphicon-ok ok' : 'glyphicon-exclamation-sign new')+'"></span></span>';
                        str += '</dt>';
                    str += '</div>';
                str += '</dl>';

                str += '<div class="item-confirm-delete-panel" data-target="'+i+'">';
                    str += '<div class="item-confirm-text">Confirm</div>';
                str += '</div>';
            str += '</div>';

            strArray.push(str);
            $('#main').append(str);

            if(strArray.length == size) {
                this.__initializeScroll();
            }
        }
    },


    ////////////////////////////////////////////////////////////////
    // Display Dialogue according to clicked panel
    ///////////////////////////////////////////////////////////////
    showSelectedItem: function(data, evt, target) {
        var id              = parseInt(data.id);

        var defaultLanguage = app.defaultLanguage;
        var translations    = app.allTranslations;
        var languages       = app.languages;
        var count           = app.count;

        this.triggerSiblings('toggleShowItem', {
            show: true,
            index: id,
            defaultLanguage: defaultLanguage,
            translations: translations,
            languages: languages,
            count: count
        });
        for(var i in translations) {
            translations[i].selected = false;
            if(translations[i].id == id) {
                translations[i].selected = true;
            }
        }

        app.allTranslations = translations;

        $('dl').removeClass('selected');
        $('dl[data-id="'+id+'"]').addClass('selected');
    },

    scrollToSelected: function() {
        var selectedItem = app.cookie.get({cname: 'selectedItem'});

        if(selectedItem && selectedItem !== NaN && selectedItem !== "NaN" && selectedItem.length > 0) {
            $('.item-panel dl').removeClass('selected');
            setTimeout(function() {
                var id = parseInt(selectedItem);
                for(var i in app.allTranslations) {
                    if(app.allTranslations[i].id == id) app.allTranslations[i].selected = true;
                }
                $('#item-list').scrollTop($('.item-panel[data-id="'+id+'"]').position().top - 40);
                $('.item-panel[data-id="'+id+'"] dl').addClass('selected');
            }, 500);
        }
    },


    ///////////////////////////////////////////////////////////////////
    // reset of changesTranslations array to an empty array on cancel
    //////////////////////////////////////////////////////////////////
    discardChanges: function() {
        this.trigger('hideSaveButtonBar');
        app.changedTranslations = [];
    },

    deleteItem: function(data, evt, target) {
        var self         = this;
        var translations = app.allTranslations;
        var locales      = [];
        this.view.toggleDelete({id: data.target});

        for(var i in translations) {
            if(i == data.target) {
                var mapping = translations[i].mapping;
                for(var x in mapping) {
                    locales.push(x);
                }
            }
        }
        app.apiAdapter.deleteData(data.target, locales, function(res) {
            if(res === true) {
                target.closest('.item-panel').animate({
                    opacity: 0.25,
                    left: "+=50",
                    height: "toggle"
                }, 200, function() {
                    this.remove();
                });
            }
        })
    }

});