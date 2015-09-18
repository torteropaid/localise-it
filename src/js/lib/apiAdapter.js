var app = app || {};

app.apiAdapter = {
    token: app.cookie.get({cname: 'usertoken'}),
    url: window.location.origin+'/api/ion-u',

    //API for new back-end

    checkLogin: function(successCallback, errorCallback) {
        var url  = window.location.origin+'/auth/currentuser?token='+this.token;
        $.ajax ({
            type: "GET",
            url: url,
            async: true,
            //json object to sent to the authentication url
            data: {}, 
            success: successCallback,
            error: errorCallback
        });
    },

    getCurrentUser: function(successCallback, errorCallback) {
        var url  = window.location.origin+'/auth/currentuser?token='+this.token;
        $.ajax ({
            type: "GET",
            url: url,
            async: true,
            //json object to sent to the authentication url
            data: {}, 
            success: successCallback,
            error: errorCallback
        });
    },

    getUserList: function(successCallback, errorCallback) {
        var url  = window.location.origin+'/auth/user?token='+this.token;
        $.ajax ({
            type: "GET",
            url: url,
            async: true,
            //json object to sent to the authentication url
            data: {}, 
            success: successCallback,
            error: errorCallback
        });
    },

    deleteUser: function(username, successCallback, errorCallback) {
        var url  = window.location.origin+'/auth/user/'+username+'?token='+this.token;
        $.ajax ({
            type: "DELETE",
            url: url,
            async: true,
            //json object to sent to the authentication url
            data: {}, 
            success: successCallback,
            error: errorCallback
        });
    },

    updateUser: function(obj, successCallback, errorCallback) {
        var url  = window.location.origin+'/auth/update/?token='+this.token;
        $.ajax ({
            type: "POST",
            url: url,
            async: true,
            //json object to sent to the authentication url
            data: {}, 
            success: successCallback,
            error: errorCallback
        });
    },

    allowUser: function(obj, successCallback, errorCallback) {
        var url  = window.location.origin+'/auth/update/?token='+this.token;
        $.ajax ({
            type: "POST",
            url: url,
            async: true,
            //json object to sent to the authentication url
            data: {}, 
            success: successCallback,
            error: errorCallback
        });
    },

    addUser: function(data, successCallback, errorCallback) {
        var url  = window.location.origin+'/auth/user?token='+this.token;
        $.ajax ({
            type: "DELETE",
            url: url,
            async: true,
            //json object to sent to the authentication url
            data: data, 
            success: successCallback,
            error: errorCallback
        });
    },

    putLocale: function(key, locale, data, cb) {
        var url  = this.url+'/translation/'+key+'/'+locale+'?token='+this.token;
        $.ajax ({
            type: "PUT",
            url: url,
            async: true,
            //json object to sent to the authentication url
            data: data, 
            success: cb
        });
        //$.get("http://localhost:3000/api/ion-u", cb);
    },

    postData: function(cb) {
        var str  = window.location.origin;
        var url  = this.url+'?token='+this.token;
        $.ajax ({
            type: "POST",
            url: url,
            dataType: 'json',
            async: true,
            //json object to sent to the authentication url
            data: {
            }, 
            success: cb
        });
        //$.get("http://localhost:3000/api/ion-u", cb);
    },

    deleteKey: function(key, locales, cb) {
        for(var i in locales) {
            var url  = this.url+'/translation/'+key+'/'+locales[i]+'?token='+this.token;
            $.ajax ({
                type: "DELETE",
                url: url,
                dataType: 'json',
                async: true,
                //json object to sent to the authentication url
                data: {
                }, 
                success: cb
            });
        }
        //$.get("http://localhost:3000/api/ion-u", cb);
    },

    getData: function(successCallback) {
        this.token = app.cookie.get({cname: 'usertoken'})
        var url    = this.url+'?token='+this.token;
        $.get(url, successCallback);
    },

    generateAuthToken: function(successCallback) {
        var url  = window.location.origin+'/auth/token';
        $.get(url, successCallback);
    },

    login: function(data, successCallback, errorCallback) {
        var url  = window.location.origin+'/auth/login';
        $.ajax ({
            type: "POST",
            url: url,
            dataType: 'json',
            //json object to sent to the authentication url
            data: data, 
            success: successCallback,
            error: errorCallback
        });
    },

    logout: function(successCallback, errorCallback) {
        var url  = window.location.origin+'/auth/logout';
        $.ajax ({
            type: "GET",
            url: url,
            dataType: 'json',
            //json object to sent to the authentication url
            data: {}, 
            success: successCallback,
            error: errorCallback
        });
    },

};