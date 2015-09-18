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
    },

    importFile: function() {
        var fileInput = this.view.obj("input");
        var newFile   = fileInput.prop('files')[0];
        var filename  = newFile.name;
        var filetype;
        if (filename.substr(-4) == '.lea') {
            filetype = 'lea';
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
            this.readFile(files, newFile);
        } else if (filetype=='lea') {
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
                        self.readFile(files, newFile, password);
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

    readFile: function (files, newFile, password) {
        var self     = this;
        var existant = false;
        var text;
        var reader   = new FileReader();
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
            //Enforce file name to be the same as filename tag in URF payload
            //var serializer = new XMLSerializer();
            //file.data = serializer.serializeToString(newDom);

            console.log('readFile', file.data);

            if (file.data) {
                app.urfHandler.create(file, files, function(res) {
                });
                text = "File correctly loaded!";
                //self.trigger('closeContentDialog');
                self.trigger('showNotification', {text: text, type: 'success', time: 5});
            } else {
                text = 'Import failed. Your password seems to be incorrect.';
                //self.trigger('setResponseContentDialog', text);
            }
        };
        reader.readAsText(newFile);
    },
});