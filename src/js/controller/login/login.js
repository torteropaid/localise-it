app.Controller('login-login', {

    loginOnKeyup: function(data, evt, target) {
        if(evt.which == 13) {
            this.login();
        } else {
            this.view.obj('username').removeClass('error');
            this.view.obj('password').removeClass('error');
        }
    },

    login: function() {
        var username = this.view.obj('username').val();
        var password = this.view.obj('password').val();

        if (username === '') {
            this.view.obj('username').addClass('error');
            this.view.obj('username').attr('placeholder', 'Username is missing');
        } else if (password === '') {
            this.view.obj('password').addClass('error');
            this.view.obj('username').attr('placeholder', 'Password is missing');
        } else {
            this.checkLogin(username, password);
        }
    },

    checkLogin: function(username, password) {
        var self = this;
        var data = {username: username, password: password};

        app.apiAdapter.login(
            data, 
            function(jqXHR, exception) {
                console.log('checkLogin', jqXHR, exception);
                if((exception && exception == 'success') || jqXHR.status == 200) {
                    self.trigger('toggleLoggedIn', {flag: true});
                    app.cookie.set({cname: 'user', content: 'commscope'});
                    app.cookie.set({cname: 'logged_in', content: 1});
                    app.cookie.set({cname: 'usertoken', content: '73r253jcb1p3e423h3vptngr6qqpt'});
                }
            },
            function(jqXHR, exception) {
                console.error('checkLogin', jqXHR, exception);
                if((exception && exception == 'success') || jqXHR.status == 200) {
                    self.trigger('toggleLoggedIn', {flag: true});
                    app.cookie.set({cname: 'user', content: 'commscope'});
                    app.cookie.set({cname: 'logged_in', content: 1});
                    app.cookie.set({cname: 'usertoken', content: '73r253jcb1p3e423h3vptngr6qqpt'});
                } else {
                    self.view.obj('root').find('.error-message').removeClass('hidden');
                }
            }
        );
    },
});