app.Controller('content-globalsearch', {

    init: function() {
        this.set('resultList', []);
        this.set('languages', app.languages);
        this.set('defaultLanguage', app.defaultLanguage);

        var searchValue = app.cookie.get({cname: 'globalSearchValue'});
        var searchType  = app.cookie.get({cname: 'globalSearchType'});

        if(searchValue && searchValue !== NaN && searchValue !== "NaN" && searchValue.length > 0) {
            this.set('searchValue', searchValue);
        } else {
            this.set('searchValue', '');
        }

        if(searchType && searchType !== NaN && searchType !== "NaN" && searchType.length > 0) {
            this.__fillResultList(searchValue, searchType);
        }
    },


    ///////////////////////////////////////////////////////////////////
    // collecting the ids of all changed translations
    //////////////////////////////////////////////////////////////////
    changedTranslationsCollector: function(data, evt, target) {
        var id              = data.target;
        var translations    = app.allTranslations;
        var defaultLanguage = app.defaultLanguage;
        var string          = target.val();
        var comparison      = null;
        var changedTrans    = app.changedTranslations || [];

        for(var i in translations) {
            if(i == id) {
                comparison = translations[i].texts[defaultLanguage.id];
                
                if(string != comparison) {
                    changedTrans.push(id);
                    translations[i].texts[defaultLanguage.id] = string;
                    app.changedTranslations = changedTrans;
                    app.translations = translations;
                    this.trigger('showSaveButtonBar', {});
                } else {
                    for(var x in changedTrans) {
                        var index = changedTrans[x].indexOf(id);
                        if(index >= 0) {
                            changedTrans.splice(index, 1);
                        }
                    }
                    if(changedTrans.length == 0) this.trigger('hideSaveButtonBar');
                    app.changedTranslations = changedTrans;
                }
            }
        }
    },

    checkTranslation: function(data, evt, target) {
        var parent       = target.closest('dd');
        var checked      = true;
        var id           = parseInt(data.target);
        var key          = parseInt(data.key);
        var trans        = app.allTranslations; 
        var languages    = app.languages;
        var changedTrans = app.changedTranslations || [];

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
        app.changedTranslations = changedTrans;
        this.trigger('showSaveButtonBar', {});
    },


    ///////////////////////////////////////////////////
    // Search part triggered on keyup in search field
    //////////////////////////////////////////////////
    startGlobalSearch: function(data, evt, target) {
        var search = $('#global-search-filter').val();

        $('#clear-search-filter').show();
        if(search) {
            if(evt.which == 13) {
                var index = $('.global-search-autocomplete-value.selected').attr('title');
                if(index && index != undefined) {search = index;}
                this.__fillResultList(search, 'all');
            } else if(evt.which != 38 && evt.which != 40) {
                this.__generateGlobalSearchAutocomplete(search);
                $('#clear-search-filter').show();
            }
        }
    },

    __generateGlobalSearchAutocomplete: function(search) {
        var translations           = app.allTranslations;
        var defaultLanguage        = app.defaultLanguage;
        var counter                = 0;
        var autocompleteTransArray = [];
        var autocompleteKeyArray   = [];

        for(var i in translations) {
            if(counter < 10) {
                var exists = false;
                var str    = translations[i].texts[defaultLanguage.id];
                var key    = translations[i].namespace+'.'+translations[i].name;

                for(var i in autocompleteTransArray) {
                    var compare = autocompleteTransArray[i];
                    var index = compare.indexOf(str);
                    if(index >= 0) {
                        exists = true;
                    }
                }

                if(str && str.startsWith(search) && !exists) {
                    autocompleteTransArray[counter] = str;
                    ++counter;
                } else if(key && key.startsWith(search)) {
                    autocompleteKeyArray[counter] = key;
                    ++counter;
                } else if(str && str.indexOf(search) > 0 && !exists) {
                    autocompleteTransArray[counter] = str;
                    ++counter;
                } else if(key && key.indexOf(search) > 0) {
                    autocompleteKeyArray[counter] = key;
                    ++counter;
                }
            }
        }

        /*var options = {
          keys: ['defaultText', "key"],
          includeScore: true,
          threshold: 0.0,
          location: 0,
          distance: 100
        };
        var f = new Fuse(translations, options);
        var result = f.search(search);
        console.log(result);*/

        this.__buildGlobalAutocompleteDropDown(autocompleteTransArray, autocompleteKeyArray);
    },

    __buildGlobalAutocompleteDropDown: function(transarray, keyarray) {
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
             console.log(index);
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
        this.set('resultList', []);
        app.cookie.set({cname: 'globalSearchValue', content: ''});
        app.cookie.set({cname: 'globalSearchType', content: ''});
    },

    clearSearchAutocomplete: function() {
        $('.global-search-autocomplete-panel').empty();
    },

    __fillResultList: function(search, value) {
        var translations    = app.allTranslations;
        var defaultLanguage = app.defaultLanguage;
        var resultList      = [];
        var counter         = 0;

        for(var x in translations) {
            var str    = translations[x].texts[defaultLanguage.id];
            var key    = translations[x].namespace+'.'+translations[x].name;


            if(search.startsWith(':')) {
                var id = parseInt(search.split(':')[1], 10);
                var isInt = this.isInt(id);
                if(x == (id-1)) {
                    resultList[counter] = translations[id-1];
                    ++counter;
                }
            } else {
                if(value == 'string') {
                    if(str && str.indexOf(search) >= 0) {
                        resultList[counter] = translations[x];
                        ++counter;
                    }
                } else if(value == 'key') {
                    if(key && key.indexOf(search) >= 0) {
                        resultList[counter] = translations[x];
                        ++counter;
                    }

                } else if (value = 'all') {
                    if(str && str.indexOf(search) >= 0) {
                        resultList[counter] = translations[x];
                        ++counter;
                    }
                    if(key && key.indexOf(search) >= 0) {
                        resultList[counter] = translations[x];
                        ++counter;
                    }
                }
            }

        }

        app.cookie.set({cname: 'globalSearchValue', content: search});
        app.cookie.set({cname: 'globalSearchType', content: value});
        this.set('searchValue', search);
        this.set('resultList', resultList);
    },

    isInt: function(n) {
       return n % 1 === 0;
    },

    setLanguages: function(opt) {
        var languages = opt.languages;
        app.languages = languages;

        this.setSelectedLanguages();
    },

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

        this.__hideShowTranslations();
    },

    setGlobalDefaultLanguage: function() {
        this.set('defaultLanguage', app.defaultLanguage);
    },


    ////////////////////////////////////////////////////////////////
    // Display Dialogue according to clicked panel
    ///////////////////////////////////////////////////////////////
    showDialogue: function(data, evt, target) {
        var id = data.id;

        var defaultLanguage = app.defaultLanguage;
        var translations    = app.allTranslations;
        var languages       = app.languages;
        var count           = app.count;

        this.trigger('showOverlay', {
            index: parseInt(id),
            defaultLanguage: defaultLanguage,
            translations: translations,
            languages: languages,
            count: count
        });
    },


    ///////////////////////////////////////////////////////////////////
    // Save or Discard changes
    //////////////////////////////////////////////////////////////////
    saveTranslations: function() {
        this.trigger('saveData', {});
        //this.trigger('updateDom');
    },

    discardTranslations: function() {
        app.changedTranslations = [];
        this.trigger('hideSaveButtonBar');
    },

    ///////////////////////////////////////////////////////////////////
    // Save or Discard changes
    //////////////////////////////////////////////////////////////////
    showStandardDialogue: function(opt) {
        this.set('standardMessage', opt.message);
        this.set('standardDialog', true);
        this.set('showDialog', true);
    },


    __hideShowTranslations: function() {
        var selectedLanguages = app.selectedLanguages;
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
});