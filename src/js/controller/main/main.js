/*
    List of all available app.* variables for global use

    app.tree                       = array, to instantiate the tree view
    app.state                      = string, of saved states on server for creating stateArray
    app.stateArray                 = array, of all saved states on server

    app.languages                  = array, all available languages
    app.translations               = array, all translations in the language portal
    app.allTranslations            = array, all translations in the language portal globally hold for reset purposes
    app.defaultLanguage            = array, currently set default language
    app.defaultLanguageKey         = string, currently set default language key

    app.filter                     = string, of currently filtered key value
    app.selectedLangauges          = string, of all selected languages seperated by ',' to save in cookie 
    app.changedTranslations        = array, with all changed translations that need to be updated on save
    app.filteredTranslationsObject = array, with all filtered translations. Being used for dynamic dom creation and scrollbar

    app.count                      = int, count of all loaded translations
    app.minimum                    = int, id of the first visible and loaded translation, also used for scrollbar
    app.maximum                    = int, id of the last visible and loaded translation, also used for scrollbar
    app.oldMinimum                 = int, previous id of the first visible and loaded translation, also used for scrollbar
    app.oldMaximum                 = int, previous id of the last visible and loaded translation, also used for scrollbar
*/

app.Controller('main-main', {
    init: function() {
        this.globalSearch = false;
        this.__checkLogin();
        app.meta.title();
        app.meta.logs();
    },

    __checkLogin: function() {
        var self     = this;
        var user     = app.cookie.get({cname: 'user'});
        var loggedin = parseInt(app.cookie.get({cname: 'logged_in'}));
        var value    = false;

        if(loggedin && loggedin !== undefined && loggedin !== null && loggedin == 1) {
            this.apiLoggedInCheck();
        } else {
            this.trigger('toggleLoggedIn', {flag: false});
            app.apiAdapter.logout(function(res, message) {
                app.cookie.delete({cname: 'user'});
                app.cookie.delete({cname: 'logged_in'});
                app.cookie.delete({cname: 'usertoken'});
                self.toggleLoggedIn({flag: false});
            }, function(res, message) {
                console.log('logout out failed:', res, message);
            });
        }
    },

    apiLoggedInCheck: function() {
        var self = this;
        app.apiAdapter.checkLogin(
            function(jqXHR, exception) {
                if((exception && exception == 'success') || jqXHR.status == 200) {
                    self.trigger('toggleLoggedIn', {flag: true});
                    app.cookie.set({cname: 'user', content: 'commscope'});
                    app.cookie.set({cname: 'logged_in', content: 1, exdays: 0.25});
                    app.cookie.set({cname: 'usertoken', content: '73r253jcb1p3e423h3vptngr6qqpt'});
                }
            },
            function(jqXHR, exception) {
                console.error('apiLoggedInCheck', jqXHR, exception);
                if((exception && exception == 'success') || jqXHR.status == 200) {
                    self.trigger('toggleLoggedIn', {flag: true});
                    app.cookie.set({cname: 'user', content: 'commscope'});
                    app.cookie.set({cname: 'logged_in', content: 1, exdays: 0.25});
                    app.cookie.set({cname: 'usertoken', content: '73r253jcb1p3e423h3vptngr6qqpt'});
                } else {
                    self.__logout();
                }
            }
        );
    },

    __logout: function() {
        var self = this;

        app.apiAdapter.logout(function(res, message) {
            app.cookie.delete({cname: 'user'});
            app.cookie.delete({cname: 'logged_in'});
            app.cookie.delete({cname: 'usertoken'});
            self.toggleLoggedIn({flag: false});
        }, function(res, message) {
            console.log('logout out failed:', res, message);
        });
    },

    toggleLoggedIn: function(payload) {
        this.set('loggedIn', payload.flag);
    },


    ////////////////////////////////////
    // Handle log in and log out
    ///////////////////////////////////

    toggleSidebar: function() {
        this.trigger('openSidebar');
    },

   /* handleWaitloader: function(opt) {
        this.set('waitloader', opt.show);
    },*/


    /////////////////////////////
    // Adapter calls
    ////////////////////////////
    setGlobalState: function() {
        var json = {};
        var str  = window.location.href;
        var url  = str.substring(0,str.indexOf('#'))+'api/setstate';
        var hash = null;

        var dlang = 'en-gb',
            l     = app.selectedLanguages,
            open  = app.filter,
            tab   = app.tab;

        hash = '#cur=tree&dlang='+dlang+'&lang='+l+'&open='+open+'&tab='+tab;

        json['state'] = hash;

        app.apiAdapter.saveViewState({
            data: json,
            url: url,
            callback: function(res) {
                console.log('__getData', res);
            }
        });
    },

    saveData: function(payload) {
        var self = this;

        var data         = app.changedTranslations || [],
            translations = app.allTranslations || [],
            changes      = {},
            str          = window.location.href,
            url          = str.substring(0,str.indexOf('#'))+'api/update';

        for (var i = data.length - 1; i >= 0; i--) {
            obj = translations[data[i]];
            obj = {namespace: obj.namespace, name:obj.name, description: obj.description, texts: obj.texts, checks: obj.checks};
            changes[obj.namespace+'.'+obj.name] = obj;
        }
        changes = JSON.stringify(changes)

        app.apiAdapter.postData({
            data: changes,
            url: url,
            callback: function(res) {
                for(var i in app.allTranslations) {
                    var count = 0;
                    var done  = true;

                    for(var x in app.languages) {
                        count++;
                        if(app.allTranslations[i].texts[app.languages[x].id] === undefined || app.allTranslations[i].texts[app.languages[x].id] === '') {
                            done = false;
                        }

                        if(count == app.languagesCounter) {
                            app.allTranslations[i].done = done;
                        }
                    }
                }
                if(payload) payload.value;
            }
        });
    },
});