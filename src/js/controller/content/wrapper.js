app.Controller('content-wrapper', {
    init: function() {
        var self = this;
        app.apiAdapter.getData(function(res) {
            self.__getCookieData(res);
        });
    },,


    ////////////////////////////////////
    // Handle hashchange
    ///////////////////////////////////
    hashchange: function() {
        var hash = window.location.hash;
        //this.trigger('openSidebar');
    },


    ////////////////////////////////////////////////////////////////////////////////
    // Collect all the cookie data and set ion values as well as rendering the dom
    ///////////////////////////////////////////////////////////////////////////////
    __getCookieData: function(res) {
        var cookiesEnabled     = navigator.cookieEnabled;
        if(!cookiesEnabled) {
            console.log('no cookies enabled');
        }
        var defaultLanguageKey = app.cookie.get({cname: 'defaultLanguageKey'});
        var selectedLanguages  = app.cookie.get({cname: 'selectedLanguages'});
        var locale             = app.cookie.get({cname: 'locale'});
        var selectedLocale     = app.cookie.get({cname: 'selectedLocale'});
        var languages          = app.languages;
        

        // Getting the selectedLanguages value for dom panels 
        if(selectedLanguages && selectedLanguages !== NaN && selectedLanguages !== "NaN") {
            app.selectedLanguages = selectedLanguages;
        } else {
            app.selectedLanguages = 'en_gb';
            app.cookie.set({cname: 'selectedLanguages', content: app.selectedLanguages});
        }

        // Getting the defaultLanguage value for dom panels 
        if(locale && locale !== NaN && locale !== "NaN") {
            app.locale        = locale;
        } else {
            app.locale        = 'en_gb';
        }

        // Getting the defaultLanguage value for dom panels 
        if(selectedLocale && selectedLocale !== NaN && selectedLocale !== "NaN") {
            app.selectedLocale         = selectedLocale;
            this.set('selectedLocale', selectedLocale);
        } else {
            app.selectedLocale         = 'en_gb';
            this.set('selectedLocale', 'en_gb');
        }

        var selected = app.selectedLanguages.split(',');
        for(var i in languages) {
            var checked = false;
            for(var j in selected) {
                if(selected[j] == i) {
                    checked = true;
                }
            }
            languages[i].selected = checked;
        }
        app.languages = languages;

        app.project         = res;
        app.projectname     = res.pid;
        app.defaultLocale   = res.defaultlocale;
        app.languages       = res.locales;

        app.count           = Object.size(res.translations);

        app.allTranslations = this.__enrichTranslations(res.translations);

        this.set('locales', this.mapLocales(res.Locales));

        this.set('project', res.pid);
        this.set('translations', this.__enrichTranslations(res.translations));
        this.set('defaultLocale', res.defaultlocale);
    },

    __enrichTranslations: function(res) {
        var counter      = 0;
        var translations = _.cloneDeep(res);
        var selectedItem = app.cookie.get({cname: 'selectedItem'});
        
        for(var i in translations) {
            translations[i].id       = counter;
            translations[i].selected = false;
            counter++;
        }

        return translations;
    },


    //////////////////////////////////////////////////////
    // Get and set all data necessary for dom rendering
    /////////////////////////////////////////////////////
    mapLocales: function(locales) {
        var localesObj   = app.locales;
        var localesArray = [];

        for(var i in locales) {
            locale          = {};
            locale.id       = parseInt(i); 
            locale.key      = locales[i];
            locale.selected = false;

            for(var j in localesObj) {
                if(locales[i] == localesObj[j]) {
                    locale.title = j;
                }
            }
            localesArray.push(locale);
        }

        app.locales = localesArray;

        return app.locales;
    },

});