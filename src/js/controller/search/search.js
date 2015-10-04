app.Controller('search-search', {
    update: false,

    init: function() {
        this.set('clean', false);
        this.set('defaultLanguage', this.get('defaultLanguage'));

        app.allTranslations = this.get('translations');

        var searchValue = app.cookie.get({cname: 'globalSearchValue'});
        var searchType  = app.cookie.get({cname: 'globalSearchType'});
        var locale      = app.cookie.get({cname: 'selectedLocale'});

        if(searchValue && searchValue !== NaN && searchValue !== "NaN" && searchValue.length > 0) {
            app.filter = searchValue;
            this.set('searchValue', searchValue);
        } else {
            this.set('searchValue', '');
        }

        if(locale && locale !== NaN && locale !== "NaN" && locale.length > 0) {
            app.selectedLocale = locale;
            this.set('localeId', locale);
        } else {
            app.selectedLocale = 'en_gb';
            this.set('localeId', 'en_gb');
        }

        this.__mapLocale();
    },

    updateThis: function() {
        this.set('update', !this.update);
        this.update = !this.update;
    },


    ///////////////////////////////////////////////////////////////////
    // collecting the ids of all changed translations
    //////////////////////////////////////////////////////////////////
    mapLocale: function(value) {
        var cur     = this.get('locale');
        var locales = this.get('locales');
        var exists  = false, counter = 0;

        if(cur.toLowerCase() !== value.toLowerCase()) {
            for(var i in locales) {
                if(locales[i].title.toLowerCase()==value.toLowerCase()) {
                    this.changeLocale({target: locales[i].key});
                    exists = true;
                    this.trigger('filterTranslations', {});
                }
                counter++;
                if(counter == locales.length && !exists) {
                    this.trigger('showNotification', {text: "Locale doesn't exists", time: 3});
                }
            }
        }
    },

    __mapLocale: function() {
        var id      = this.get('localeId');
        var locales = this.get('locales');

        for(var i in locales) {
            if(locales[i].key == id) {
                locales[i].selected = true;
                this.set('locale', locales[i].title);
            }
        }
    },

    changeLocale: function(data, evt, target) {
        var locale  = data.target;
        var cur     = this.get('locale');
        var locales = this.get('locales');

        if(cur !== locale) {
            for(var i in locales) {
                locales[i].selected = false;
                if(locales[i].key==locale) {
                    locales[i].selected = true;
                    this.set('locale', locales[i].title);
                    app.cookie.set({cname: 'selectedLocale', content: locale});
                    this.triggerSiblings('toggleLocale', {key: locale});
                    app.selectedLocale = locale;
                }
            }
        }
    },


    ///////////////////////////////////////////////////
    // Search part triggered on keyup in search field
    //////////////////////////////////////////////////
    startGlobalSearch: function(data, evt, target) {
        var search = $('#global-search-filter').val();

        $('#clear-search-filter').removeClass('hidden');
        if(search && search != '' && search !== null) {
            if(evt.which == 13) {
                var index = $('.global-search-autocomplete-value.selected').attr('title');
                if(index && index != undefined) {search = index;}
                this.__fillResultList(search, 'all');
            } else if(evt.which != 38 && evt.which != 40) {
                if(search.length >= 3) {
                    this.__generateGlobalSearchAutocomplete(search);
                } else {
                    this.clearSearchAutocomplete();
                }
                $('#clear-search-filter').removeClass('hidden');
            }
        } else {
            this.clearSearchAutocomplete();
        }
    },

    __generateGlobalSearchAutocomplete: function(search) {
        var translations           = app.allTranslations;
        var selectedLocale        = app.selectedLocale;
        var counter                = 0;
        var autocompleteTransArray = [];
        var autocompleteKeyArray   = [];

        for(var i in translations) {
            if(counter < 10) {
                var exists = false;
                var str    = translations[i].mapping[selectedLocale];
                var key    = i;

                for(var i in autocompleteTransArray) {
                    var compare = autocompleteTransArray[i];
                    var index = compare.indexOf(str);
                    if(index >= 0) {
                        exists = true;
                    }
                }

                for(var x in autocompleteKeyArray) {
                    var compareX = autocompleteKeyArray[x];
                    var indexX = compareX.indexOf(str);
                    if(indexX >= 0) {
                        exists = true;
                    }
                }

                if(str && str.startsWith(search)) {
                    autocompleteTransArray[counter] = str;
                    ++counter;
                } else if(key && key.startsWith(search)) {
                    autocompleteKeyArray[counter] = key;
                    ++counter;
                } else if(str && str.indexOf(search) > 0) {
                    autocompleteTransArray[counter] = str;
                    ++counter;
                } else if(key && key.indexOf(search) > 0) {
                    autocompleteKeyArray[counter] = key;
                    ++counter;
                }
            }
        }

        /*for(var i in translations) {
            if(counter < 10) {
                var exists = false;
                var key    = i;

                if(key && key.startsWith(search)) {
                    autocompleteKeyArray[counter] = key;
                    ++counter;
                }
            }
        }

        for(var i in translations) {
            if(counter < 10) {
                var exists = false;
                var str    = translations[i].mapping[selectedLocale];
                var key    = i;

                for(var i in autocompleteTransArray) {
                    var compare = autocompleteTransArray[i];
                    var index = compare.indexOf(str);
                    if(index >= 0) {
                        exists = true;
                    }
                }

                if(str && str.indexOf(search) > 0 && !exists) {
                    autocompleteTransArray[counter] = str;
                    ++counter;
                }
            }
        }

        for(var i in translations) {
            if(counter < 10) {
                var exists = false;
                var str    = translations[i].mapping[selectedLocale];
                var key    = i;

                for(var i in autocompleteTransArray) {
                    var compare = autocompleteTransArray[i];
                    var index = compare.indexOf(str);
                    if(index >= 0) {
                        exists = true;
                    }
                }

                if(key && key.indexOf(search) > 0) {
                    autocompleteKeyArray[counter] = key;
                    ++counter;
                }
            }
        }*/

        this.__buildGlobalAutocompleteDropDown(autocompleteTransArray, autocompleteKeyArray);
    },

    __buildGlobalAutocompleteDropDown: function(transarray, keyarray) {
        if(transarray.length > 0 || keyarray.length > 0) {
            this.clearSearchAutocomplete();
            this.searchResultCounter = 0;
            var trans = '<div class="global-autocomplete-section-header"><b>Translations</b></div>';
            for(var i in transarray) {
                trans += "<div class='global-search-autocomplete-value string' title='"+transarray[i]+"' data-id='"+this.searchResultCounter+"'>"+transarray[i]+"</div>";
                this.searchResultCounter++
            }
            $('.global-search-autocomplete-panel').append(trans);
            var key = '<div class="global-autocomplete-section-header"><b>Keys</b></div>';
            for(var i in keyarray) {
                key += "<div class='global-search-autocomplete-value key' title='"+keyarray[i]+"' data-id='"+this.searchResultCounter+"'>"+keyarray[i]+"</div>";
                this.searchResultCounter++;
            }
            $('.global-search-autocomplete-panel').append(key);
        } else {
            this.clearSearchAutocomplete();
        }
    },

    navigateSearchResults: function(data, evt, target) {
        if(evt.keyCode == 38 || evt.keyCode == 40) {
            var pos               = target.selectionStart;
            target.value          = (evt.keyCode == 38?1:-1)+parseInt(target.value,10);        
            target.selectionStart = pos; 
            target.selectionEnd   = pos;

            var dir               = 'down';

            if(evt.keyCode == 38) {dir = 'up';}

            this.__navigateResults(dir);
            evt.preventDefault();
        }
        this.view.closeDropdown();
    },

    __navigateResults: function(dir) {
        var index = $('.global-search-autocomplete-value.selected').attr('data-id');
        $('.global-search-autocomplete-value').removeClass('selected');

        if(index && index != undefined) {
            index = parseInt(index);
            if(index < this.searchResultCounter && index >= 0) {
                if(dir == 'down') {++index;} else {--index;}
                $('.global-search-autocomplete-value[data-id="'+index+'"]').addClass('selected');
            }
            
        } else {
             if(dir == 'down') {index = 0;} else {index = this.searchResultCounter-1;}
            $('.global-search-autocomplete-value[data-id="'+index+'"]').addClass('selected');
        }
    }, 

    selectValueFromAutocomplete: function(data, evt, target) {
        var text  = target.text();
        var value = 'string';

        if(target.hasClass('key')) {
            value = 'key';
        }
        this.__fillResultList(text, value);
    },

    clearSearch: function() {
        this.set('searchValue', '');
        this.set('clean', !this.get('clean'));
        app.filter = '';
        app.cookie.set({cname: 'globalSearchValue', content: ''});
        app.cookie.set({cname: 'globalSearchType', content: ''});
        app.cookie.set({cname: 'filter', content: ''});
        this.triggerSiblings('filterTranslations', {});
    },

    clearSearchAutocomplete: function() {
        $('.global-search-autocomplete-panel').empty();
    },

    __handleSearchValue: function(search) {
        if(search.startsWith('add:')) {
            //locale and key
            type = search.split(':')[1];
            content = search.split(':')[2];

            if(type == 'key') {
                key = search.split(':')[2];
                trans = search.split(':')[3];


                var keyArray = key.split('.')
                var name = keyArray[keyArray.length-1]


                var namespaceArray = key.split('.');
                namespaceArray.pop();
                var namespace = null;
                if(namespaceArray.length > 1) {
                    namespace = namespaceArray.join('.');
                } else {
                    namespace = namespaceArray[0];
                }

                var newArrayValue = {
                    _attributes: app.allTranslations[0]._attributes,
                    _pk: app.allTranslations[0]._pk,
                    name: name,
                    namespace: namespace,
                    description: '',
                    checks: {},
                    texts: {}
                };

                for(var l in app.languages) {
                    if(l == 'en_gb') {
                        newArrayValue.checks[app.languages[l].id] = true;
                    } else {
                        newArrayValue.checks[app.languages[l].id] = false;
                    }
                }

                for(var l in app.languages) {
                    if(l == 'en_gb') {
                        newArrayValue.texts[app.languages[l].id] = trans;
                    } else {
                        newArrayValue.texts[app.languages[l].id] = '';
                    }
                }

                app.allTranslations.push(newArrayValue);

                this.trigger('saveData', {value: this.trigger('showNotification', {text: 'Key successfully added', type: 'success', time: 3})});
            }

            return;

        } else if(search.startsWith('delete:')) {
            //for locale and key
            type = search.split(':')[1];
            content = search.split(':')[2];

        } else if(search.startsWith('change:')) {
            //for locale and key
            type = search.split(':')[1];
            content = search.split(':')[2];

            if(type == 'locale') {
                this.mapLocale(content);
            } else {
                this.trigger('showNotification', {text: "Action not allowed", type: 'danger', time: 3});
            }

        } else if(search.startsWith('beginsWith:')) {
            content = search.split(':')[1];
            app.filter = content;
            this.triggerSiblings('filterTranslations', {type: 'startsWith'});

        } else if(search.startsWith('endsWith:')) {
            content = search.split(':')[1];
            app.filter = content;
            this.triggerSiblings('filterTranslations', {type: 'endsWith'});

        } else if(search.startsWith(':') || search.startsWith('id:')) {
            var id = parseInt(search.split(':')[1], 10);
            var isInt = this.isInt(id);
            if(x == (id-1)) {
            
            }

        } else {
            if(value == 'string' || value == 'key' || value == 'all') {
            }
        }
    },

    __fillResultList: function(search, value) {
        var translations    = app.allTranslations;
        var defaultLanguage = app.defaultLanguage;
        var resultList      = [];
        var counter         = 0;
        var type, content, key, trans;

        app.filter = search;
        console.log('__fillResultList', search);

        app.cookie.set({cname: 'globalSearchValue', content: search});
        app.cookie.set({cname: 'globalSearchType', content: value});
        this.triggerParents('filterTranslationsHelper', {});
        this.set('searchValue', search);

    },

    isInt: function(n) {
       return n % 1 === 0;
    },

    setGlobalDefaultLanguage: function() {
        this.set('defaultLanguage', this.get('defaultLanguage'));
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