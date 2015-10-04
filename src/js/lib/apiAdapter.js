var app = app || {};

app.apiAdapter = {
    token: app.cookie.get({cname: 'usertoken'}),
    defaultToken: '73r253jcb1p3e423h3vptngr6qqpt',
    url: window.location.origin+'/api/lit',

    //API for new back-end

    /////////////////////////////////////////
    // Authorisation Handling
    ////////////////////////////////////////
    checkLogin: function(successCallback, errorCallback) {
        var url  = window.location.origin+'/auth/currentuser';
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

    getCurrentUser: function(successCallback, errorCallback) {
        var url  = window.location.origin+'/auth/currentuser';
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



    /////////////////////////////////////////
    // Usermanagement Handling
    ////////////////////////////////////////
    getUserList: function(successCallback, errorCallback) {
        var url  = window.location.origin+'/auth/user?token='+this.defaultToken;
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
        var url  = window.location.origin+'/auth/user/'+username+'?token='+this.defaultToken;
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
        var url  = window.location.origin+'/auth/user/'+obj.username+'?token='+this.defaultToken;
        $.ajax ({
            type: "PUT",
            url: url,
            async: true,
            //json object to sent to the authentication url
            data: obj, 
            success: successCallback,
            error: errorCallback
        });
    },

    allowUser: function(obj, successCallback, errorCallback) {
        var url  = window.location.origin+'/auth/allow';
        $.ajax ({
            type: "POST",
            url: url,
            async: true,
            //json object to sent to the authentication url
            data: obj, 
            success: successCallback,
            error: errorCallback
        });
    },

    forbidUser: function(obj, successCallback, errorCallback) {
        var url  = window.location.origin+'/auth/forbid';
        $.ajax ({
            type: "POST",
            url: url,
            async: true,
            //json object to sent to the authentication url
            data: obj, 
            success: successCallback,
            error: errorCallback
        });
    },

    addUser: function(data, successCallback, errorCallback) {
        var url  = window.location.origin+'/auth/user?token='+this.defaultToken;
        $.ajax ({
            type: "POST",
            url: url,
            async: true,
            //json object to sent to the authentication url
            data: data, 
            success: successCallback,
            error: errorCallback
        });
    },


    /////////////////////////////////////////
    // ProjectManagement Handling
    ////////////////////////////////////////
    getProjectData: function(name, successCallback, errorCallback) {
        var url  = window.location.origin+'/api/project/'+name;
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

    createProject: function(name, successCallback, errorCallback) {
        var url  = window.location.origin+'/api/'+name;
        $.ajax ({
            type: "PUT",
            url: url,
            async: true,
            //json object to sent to the authentication url
            data: {}, 
            success: successCallback,
            error: errorCallback
        });
    },

    alterProject: function(name, color, successCallback, errorCallback) {
        var url  = window.location.origin+'/api/'+name;
        $.ajax ({
            type: "PUT",
            url: url,
            async: true,
            //json object to sent to the authentication url
            data: {}, 
            success: successCallback,
            error: errorCallback
        });
    },

    deleteProject: function(name, successCallback, errorCallback) {
        var url  = window.location.origin+'/api/'+name;
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


    /////////////////////////////////////////
    // Translation and Key Handling
    ////////////////////////////////////////
    putLocale: function(key, locale, data, cb, ecb) {
        var url  = this.url+'/translation/'+key+'/'+locale+'?token='+this.defaultToken;
        $.ajax ({
            type: "PUT",
            url: url,
            async: true,
            //json object to sent to the authentication url
            data: data, 
            success: cb,
            error: ecb,
        });
        //$.get("http://localhost:3000/api/lit", cb);
    },

    postData: function(cb) {
        var str  = window.location.origin;
        var url  = this.url+'';
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
        //$.get("http://localhost:3000/api/lit", cb);
    },

    deleteKey: function(key, locales, cb) {
        for(var i in locales) {
            var url  = this.url+'/translation/'+key+'/'+locales[i]+'?token='+this.defaultToken;
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
        //$.get("http://localhost:3000/api/lit", cb);
    },

    getData: function(successCallback, errorCallback) {
        this.token = app.cookie.get({cname: 'usertoken'})
        var url    = this.url+'?token='+this.defaultToken;
        //$.get(url, successCallback, errorCallback);
        $.ajax ({
            type: "GET",
            url: url,
            async: true,
            //json object to sent to the authentication url
            data: {
            }, 
            success: successCallback,
            error: errorCallback
        });
    },


    /////////////////////////////////////////
    // Token Handling
    ////////////////////////////////////////
    generateAuthToken: function(successCallback) {
        var url  = window.location.origin+'/auth/token';
        $.get(url, successCallback);
    },


    /////////////////////////////////////////
    // File Handling
    ////////////////////////////////////////
    uploadFile: function(locale, fileData, successCallback, errorCallback) {
        var url  = this.url+'/file/'+locale+'?token='+this.defaultToken;
        $.ajax ({
            type: "PUT",
            url: url,
            dataType: 'json',
            //json object to sent to the authentication url
            data: fileData, 
            success: successCallback,
            error: errorCallback
        });
    },

};