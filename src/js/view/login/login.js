app.view('login-login', {
    username: '#loginname',
    password: '#password',

    events: [
        {
            selector: '.login-button',
            type: 'click',
            action: 'login'
        },
        /*{
            selector: 'input',
            type: 'keyup',
            action: 'loginOnKeyup'
        },*/
        {
            type: 'enterKey',
            action: 'login'
        }
    ],

    init: function() {
    }
});