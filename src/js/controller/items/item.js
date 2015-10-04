app.Controller('items-item', {

    init: function() {
        var itemVisible       = app.cookie.get({cname: 'itemVisible'});

        if(itemVisible && itemVisible !== NaN && itemVisible !== "NaN" && itemVisible.length > 0 && itemVisible == 'true') {
            this.getItemId();
        }
    },

    toggleShowItem: function(payload) {
        if(payload.show === true) {
            this.__showItem(payload);
        } else if(payload.show === false) {
            this.closeItemView();
        }
    },

    getItemId: function() {
        var itemId = app.cookie.get({cname: 'selectedItem'});

        if(itemId && itemId !== NaN && itemId !== "NaN" && itemId.length > 0) {
            var id = itemId;
            this.__showItem({index: id});
        }
    },

    closeItemView: function() {
        //this.set('displayItem', false);
        $('#item').removeClass('opening isOpened').addClass('closing');
        var self = this;
        setTimeout(function() {
            self.set('displayItem', false);
        }, 300);
        this.changed = false;
        app.cookie.set({cname: 'itemVisible', content: ''});
    },


    ///////////////////////////////////////////////////////////////////
    // load all the data for desired translation
    //////////////////////////////////////////////////////////////////
    __showItem: function(options) {
        var id = parseInt(options.index);
        this.__itemData(id);
        //this.set('showItem', true);
        var self = this;
        setTimeout(function() {
            $('#item').removeClass('isClosed').addClass('opening');
        }, 100);
        setTimeout(function() {
            self.set('displayItem', true);
        }, 300);

        app.cookie.set({cname: 'selectedItem', content: id});
        app.cookie.set({cname: 'itemVisible', content: true});
    },

    __itemData: function(id) {
        var selectedLocale = app.selectedLocale;
        var locales        = app.locales;
        var translations   = app.allTranslations;
        var languages      = app.languages;


        for(var i in translations) {
            if(translations[i].id == id) {
                var key = i;
                var defaultText = translations[i].mapping[selectedLocale];

                this.__fillOpenedLanguages();

                //this.__iterateSelectedLanguages();
                this.set('key', i);
                this.set('index', id);
                this.set('count', translations.length);
                this.set('languages', languages);
                this.set('defaultText', defaultText);
                //this.set('selectedText', defaultText);
                this.set('translation', translations[i]);
                this.set('footerindex', id+1);
                this.set('selectedLocale', selectedLocale);
                this.set('defaultLocaleId', app.defaultLocale);
                this.set('selectedLocaleId', selectedLocale);
                this.set('count', app.count);
                this.set('locales', app.locales);
                //this.set('selectedLanguage', app.defaultLanguageKey);
                //this.set('selectedLanguages', app.selectedLanguages);
                //this.set('defaultLanguageTitle', defaultLanguage.name);
                //this.set('selectedLanguageTitle', defaultLanguage.name);
            }
        }
    },

    __fillOpenedLanguages: function() {
        var languages = app.selectedLanguages.split(',');
        app.openedLanguages = languages;
        if(app.openedLanguages.length == 0) {
            app.openedLanguages.push(app.defaultLocale);
        }
        this.set('selectedLanguages', app.openedLanguages);
    },

    __setSelectedLanguages: function(data) {
        var lang      = data.target;
        var counter   = 0;
        var languages = this.get('selectedLanguages');
        
        var index = languages.indexOf(lang);

        if(index >= 0) {
            languages.splice(index, 1);
        } else {
            languages.push(data.target);
        }
        var string          = languages.join(',');
        app.openedLanguages = languages;

        app.cookie.set({cname: 'selectedLanguages', content: string});
        this.set('selectedLanguages', languages);
    },

    toggleLocale: function(opt) {
        var languages = app.languages;
        var id        = this.get('index');

        for(var i in languages) {
            if(opt.key == languages[i]) {
                app.defaultLanguage    = languages[i];
                app.defaultLanguageKey = i;
                app.selectedLocale     = languages[i];
                this.set('selectedLocale', languages[i]);
                this.__itemData(parseInt(id));
                this.set('selectedLanguages', app.openedLanguages);
            }
        }
    },


    ///////////////////////////////////////////////////////////////////
    // load next or previous translation
    //////////////////////////////////////////////////////////////////
    navigate: function(data) {
        var direction          = parseInt(data.id);
        var selectedLocale     = this.get('selectedLocale');
        var translations       = app.allTranslations;
        var languages          = this.get('languages');
        var defaultLanguageId  = this.get('defaultLanguageId');
        var selectedLanguageId = this.get('selectedLanguageId');

        for(var i in translations) {
            if(translations[i].id == direction) {
                var key         = i;
                var defaultText = translations[i].mapping[selectedLocale];
                //var selectedText = translations[i].texts[selectedLanguageId];

                this.set('key', key);
                this.set('defaultText', defaultText);
                //this.set('selectedText', selectedText);
                this.set('footerindex', direction+1);
                this.set('index', direction);
                this.set('translation', translations[i]);

                app.cookie.set({cname: 'selectedItem', content: direction});
                this.trigger('updatePage', {id: direction});
                this.trigger('scrollToNavigatedItem');
            }
        }
    },


    ///////////////////////////////////////////////////////////////////
    // collecting the ids of all changed translations
    //////////////////////////////////////////////////////////////////
    updateTranslationOnFocusout: function(data, evt, target) {
        var key             = this.get('key');
        var selectedLocale  = this.get('selectedLocale');
        var locale          = data.target;
        var translations    = _.cloneDeep(app.allTranslations);
        var defaultLanguage = app.defaultLanguage;
        var string          = target.val();

        for(var i in translations) {
            if(i == key) {
                translations[i].mapping[locale] = string;
            }
            if(locale == selectedLocale) {
                this.view.obj('defaultText').text(string);
            }
        }
        app.allTranslations = translations;
        app.apiAdapter.putLocale(key, locale, string, function(res) {
        })
    },

    checkedTranslation: function(data, evt, target) {
        var id                = parseInt(data.target);
        var trans             = app.allTranslations;
        var lang              = app.languages;
        var changedTrans      = app.changedTranslations || [];
        var checked           = this.get('checked');
        var defaultLanguageId = this.get('defaultLanguageId');

        for(var i in trans) {
            if(trans[i].identifier == id) {
                for(var j in lang) {
                    if(lang[j].id == defaultLanguageId) {
                        trans[i].checks[lang[j].id] = !checked;
                    }
                }
            }
        }

        changedTrans.push(id);
        app.changedTranslations = changedTrans;
        app.allTranslations     = trans;
        this.set('checked', !checked);
    },

    ///////////////////////////////////////////////////////////////////
    // Save or Discard changes
    //////////////////////////////////////////////////////////////////
    saveTranslations: function() {
        this.trigger('saveData', {});
        //this.trigger('updateDom');
    },

    discardTranslations: function() {
        this.closeOverlay();
    },

    saveChanges: function() {
        this.saveTranslations();
        this.trigger('updateThis', { login: false });
    },

    discardChanges: function() {
        this.discardTranslations();
        this.trigger('handleLog', { login: false });
    },

    ///////////////////////////////////////////////////////////////////
    // Save or Discard changes
    //////////////////////////////////////////////////////////////////
    showStandardDialogue: function(opt) {
        this.set('standardMessage', opt.message);
        this.set('standardDialog', true);
        this.set('showDialog', true);
    },
});