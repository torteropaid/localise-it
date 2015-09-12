app.view('header-header', {
    events: [
        {
            selector: '#mainMenu li',
            type: 'click',
            action: 'handleMenu'
        },
        /*{
            selector: 'span.logout',
            type: 'click',
            action: 'handleLogout'
        },*/

        {
            selector: '#helper-menu',
            type: 'click',
            action: 'openMenu'
        },
        {
            type: 'handleMenu',
            action: 'handleMenu'
        },
    ],

    init: function() {
    },

    openMenu: function() {
        this.trigger('toggleMenu', {value: true});
    }

});