app.view('sidebar-sidebar', {
    events: [
        {
            selector: '.close-button',
            type: 'click',
            action: 'closeMenu'
        },
        {
            selector: '#left-sidebar-container',
            type: 'click',
            action: 'closeMenu'
        },
        {
            selector: '#logout-button',
            type: 'click',
            action: 'handleLogout'
        },
        {
            selector: "*:not(.locale-sidebar-selector)",
            type: "click",
            action: "closeDropdown"
        },
        {
            selector: ".locale-sidebar-selector",
            type: "click",
            action: "toggleDropdown"
        },
        {
            selector: "li.locale",
            type: "click",
            action: "changeLocale"
        },
        {
            selector: "#add-key-button",
            type: "click",
            action: "showAddPanelKey"
        },
        {
            action: 'importFile',
            type: 'change',
            selector: '#import-file'
        }, 
        {
            action: 'openUserManagement',
            type: 'click',
            selector: '#user-management-button'
        }, 
        {
            action: 'generateAuthToken',
            type: 'click',
            selector: '#generate-auth-token-button'
        }, 

        {
            type: 'openSidebar',
            action:'openSidebar'
        }
    ],

    input: '#import-file',

    authToken: '.auth-token',

    openUserManagement: function() {
        this.closeMenu();
        window.location.hash = 'usermanagement';
    },

    openSidebar: function(payload) {
        $('#menu-container').addClass('open');
    },

    closeMenu: function(payload) {
        $('#menu-container').removeClass('open');
    },

    toggleDropdown: function() {
        this.showSelect = true;
        $('.locale-sidebar-selector .dropdown-menu').toggle();
        $('.locale-selector-btn-group').toggleClass('open');
    },

    changeLocale: function(data, evt, target) {
        this.trigger('triggerLocaleChanging', {target: data.target});
        target.closest('ul').find('li').removeClass('hidden');
        target.addClass('hidden');
        target.closest('.locale-dropdown').find('.locale-title').text(target.text());
    },
    
    closeDropdown: function() {
        if (!this.showSelect) {
            $('.locale-sidebar-selector .dropdown-menu').hide();
            $('.locale-selector-btn-group').removeClass('open');
        }
        this.showSelect = false;
    }
});