app.Controller('items-list', {
    update: false,

    init: function() {
        this.trigger('toggleLoading', {flag: true});

        this.filterTranslations();
        this.__scrollToSelected();
        this.trigger('toggleLoading', {flag: false});
    },

    updateThis: function() {
        this.set('update', !this.update);
        this.filterTranslations();
        this.update = !this.update;
    },

    toggleLocale: function(opt) {
        var languages       = app.languages;

        for(var i in languages) {
            if(opt.key == languages[i]) {
                this.set('selectedLocale', languages[i]);
                this.__scrollToSelected();
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
    filterTranslations: function() {
        var translationsArray          = [];
        var filteredTranslationsObject = {};
        var filter                     = app.cookie.get({cname: 'globalSearchValue'});
        var translations               = app.allTranslations;
        var localeId                   = app.selectedLocale;
        var length                     = Object.size(translations);

        if(filter && filter != '' && filter != null && filter != undefined) {
            var counter = 0;
            
            for(var i in translations) {
                var key    = i;
                var str    = translations[i].mapping[localeId];
                var exists = false;


                if(key && key.startsWith(filter)) {
                    filteredTranslationsObject[key] = translations[i];
                } else if(key && key.indexOf(filter) > 0) {
                    filteredTranslationsObject[key] = translations[i];
                } else if(str && str.startsWith(filter)) {
                    filteredTranslationsObject[key] = translations[i];
                } else if(str && str.indexOf(filter) > 0) {
                    filteredTranslationsObject[key] = translations[i];
                }
                counter++;

                if(counter == length) {
                    app.filteredTranslationsObject = filteredTranslationsObject;

                    this.__paginateTranslations(filteredTranslationsObject);
                }
            }

        } else {
            app.filteredTranslationsObject = translations;
            this.__paginateTranslations(translations);
            if(Object.size(translations) == 0) {
                this.set('pagedTranslationsLength', 0);
            }
        }
    },

    __paginateTranslations: function(translations) {
        var resolution        = this.get('resolution');
        var page              = this.get('currentPage');
        var pagedTranslations = {};
        var size              = Object.size(translations);
        var counter           = 0;
        var pager             = [];
        var min               = page === 0 ? 0 : resolution*page;
        var max               = resolution*(page+1);

        var maxNumberOfPages  = Math.ceil(size/resolution);

        for(var i = 1; i <= maxNumberOfPages; i++) pager.push(i);

        if(size < resolution) {
            resolution = size;
            min = 0
            max = Object.size(app.allTranslations);
        } else if(max > size) {
            max = size;
            resolution = max - min;
        }

        for(var t in translations) {
            if(translations[t].id >= min && translations[t].id < max) {
                pagedTranslations[t] = translations[t];
                counter++;
            }

            if(counter == resolution) {
                app.pagedTranslations = pagedTranslations;
                app.pager             = pager;

                this.set('pagedTranslations', pagedTranslations);
                this.set('pager', pager);
                    
                if(Object.size(translations) == 1) {
                    this.showSelectedItem({id: translations[t].id});
                }

                return;
            }
        }
    },

    changePage: function(data, evt, target) {
        var id   = data.target;
        var page = this.get('currentPage');
        var newPage;

        if(id == 'previous') {
            newPage = page-1;
        } else if(id == 'next') {
            newPage = page+1;
        } else {
            id = parseInt(id);
            if(page !== id) {
                newPage = id;
            }
        }

        if(page !== newPage && newPage !== NaN && newPage !== undefined && newPage !== null) {
            app.cookie.set({cname: 'currentPage', content: newPage});
            app.currentPage = newPage;
            this.set('currentPage', newPage);
            this.__paginateTranslations(app.filteredTranslationsObject);
        }
    },

    __updatePage: function(payload) {
        if(payload.id) {
            var resolution = this.get('resolution');
            var page       = parseInt(payload.id/resolution);

            if(page !== app.currentPage) this.changePage({target: page});
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

        this.trigger('toggleShowItem', {
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

    __scrollToSelected: function() {
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
    // delete item
    //////////////////////////////////////////////////////////////////
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
        app.apiAdapter.deleteKey(data.target, locales, function(res) {
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
    },

    importInitFile: function() {
        var fileInput = this.view.obj("input");
        var newFile   = fileInput.prop('files')[0];
        var filename  = newFile.name;
        var filetype;
        if (filename.substr(-4) == '.json') {
            filetype = 'json';
            filename = filename.slice(0,-4);
        }
        var textType = /.json/;
        var existant = false;
        var files    = this.get('files') || [];
        var text, i, file;
        for (i in files) {
            file = files[i];
            if (file.name==filename) {
                existant = true;
            }
        }
        
        if (newFile.type.match(textType)) {
            this.readInitFile(files, newFile);
        } else if (filetype=='json') {
            var self = this;
            var options = {
                title:   'Import URF',
                message: 'Please enter the password to decrypt the file:',
                input:   'password',
                cancel:  'Cancel',
                ok:      'Import',
                callback: function(result) {
                    if (result===false) return;
                    /*var password = result.input;
                    if (password) {
                        self.readInitFile(files, newFile, password);
                    } else {
                        text = 'You must enter a password to decrypt this file!';
                        this.trigger('setResponseContentDialog', text);
                    }*/
                    console.log(result);
                }
            };
            //this.trigger('showContentDialog', options);
        } else {
            text = "This file type is not supported!";
            this.trigger('showNotification', {text: text, type: 'danger', time: 5});
        }

        return false;
    },

    readInitFile: function (files, newFile, password) {
        var self     = this;
        var existant = false;
        var text, filename;
        var reader   = new FileReader();
        this.view.obj('noDataOverlay').removeClass('hidden');
        reader.onload = function(e) {
            var file = {};
            if (password) {
                // Dycrypt with user-password
                file.name = newFile.name.substr(0, newFile.name.length-4);
                file.data = app.crypter.aesDecrypt(reader.result, password);
            } else {
                file.name = newFile.name;
                file.data = reader.result;
            }

            if (file.data) {
                app.apiAdapter.uploadFile(file.name.split('.json')[0], file.data, function(res, msg) {
                    text = "File correctly loaded!";
                    self.trigger('showNotification', {text: text, type: 'success', time: 5});
                    self.trigger('updateView');
                    self.view.obj('noDataOverlay').addClass('hidden');
                }, function(res, msg) {
                    console.error(res, msg);
                    text = "File not uploaded: "+msg;
                    self.trigger('showNotification', {text: text, type: 'error', time: 5});
                })
            } else {
                text = 'Import failed. Your file seems to not have the correct data.';
                //self.trigger('setResponseContentDialog', text);
            }
        };
        reader.readAsText(newFile);
    },

});