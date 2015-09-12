app.Controller('sidebar-sidebar', {
    init: function() {
        var locale      = app.cookie.get({cname: 'selectedLocale'});

        if(locale && locale !== NaN && locale !== "NaN" && locale.length > 0) {
            app.selectedLocale = locale;
            this.set('localeId', locale);
        } else {
            app.selectedLocale = 'en_gb';
            this.set('localeId', 'en_gb');
        }
    },

    handleLogout: function() {
        var self = this;
        app.apiAdapter.logout( 
            function(jqXHR, exception) {
                if(jqXHR.status == 200) {
                    self.trigger('toggleLoggedIn', {flag: false});
                    app.cookie.delete({cname: 'user'});
                    app.cookie.delete({cname: 'logged_in'});
                    app.cookie.delete({cname: 'usertoken'});
                } else if(jqXHR.status == 200){
                    self.set('loginfail', true);
                }
            },
            function(jqXHR, exception) {
                if(jqXHR.status == 200) {
                    self.trigger('toggleLoggedIn', {flag: false});
                    app.cookie.delete({cname: 'user'});
                    app.cookie.delete({cname: 'logged_in'});
                    app.cookie.delete({cname: 'usertoken'});
                } else if(jqXHR.status == 200){
                    self.set('loginfail', true);
                }
            }
        );
    },

    generateAuthToken: function() {
        var self = this;
        app.apiAdapter.generateAuthToken(function(res) {
            res = JSON.parse(res);
            if(res.token) {
                app.usertoken = res.token;
                app.cookie.set({cname: 'usertoken', content: res.token});
                self.view.obj('authToken').text(res.token);
            }
        });
    }
});