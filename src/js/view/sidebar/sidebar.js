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
            selector: "#geneate-auth-token-button",
            type: "click",
            action: "generateAuthToken"
        },
        {
            selector: "li.locale",
            type: "click",
            action: "changeLocale"
        },
        {
            selector: "#add-key-button",
            type: "click",
            action: "toggleKeyInputFields"
        },
        {
            selector: "#add-user-button",
            type: "click",
            action: "toggleAddUserInputFields"
        },
        {
            selector: "#close-add-key-button",
            type: "click",
            action: "toggleKeyInputFields"
        },
        {
            selector: "#add-locale-button",
            type: "click",
            action: "toggleLocaleInputField"
        },
        {
            selector: "#close-add-locale-button",
            type: "click",
            action: "toggleLocaleInputField"
        },
        {
            action: 'importFile',
            type: 'change',
            selector: '#fileSelection'
        }, 

        {
            type: 'openSidebar',
            action:'openSidebar'
        }
    ],

    addKeyButton: '#add-key-button',
    closeAddKeyButton: '#close-add-key-button',
    addLocaleButton: '#add-locale-button',
    closeAddLocaleButton: '#close-add-locale-button',
    addUserButton: '#add-user-button',
    closeAddUserButton: '#close-add-user-button',

    addKeyInputFieldsWrapper: '.add-key-input-fields',
    addLocaleInputFieldWrapper: '.add-locale-input-field',
    addKeyInputField: '#sidebar-add-key-input-field',
    addDefaultTranslationInputField: '#sidebar-key-value-input-field',
    addLocaleInputField: '#sidebar-add-locale-input-field',

    addUserInputField: '#sidebar-add-user-input-field',
    addUserPasswordInputField: '#sidebar-user-password-input-field',
    addUserInputFields: '.add-user-input-fields',

    authToken: '.auth-token',

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
    },

    toggleLocaleInputField: function(data, evt, target) {
        var input = this.obj('addLocaleInputFieldWrapper');

        target.addClass('hidden');
        if(input.hasClass('hidden')) {
            this.obj('closeAddLocaleButton').removeClass('hidden');
            input.removeClass('hidden');
        } else {
            this.obj('addLocaleButton').removeClass('hidden');
            input.addClass('hidden');
        }
    },

    toggleKeyInputFields: function(data, evt, target) {
        var input = this.obj('addKeyInputFieldsWrapper');

        target.addClass('hidden');
        if(input.hasClass('hidden')) {
            this.obj('closeAddKeyButton').removeClass('hidden');
            input.removeClass('hidden');
        } else {
            this.obj('addKeyButton').removeClass('hidden');
            input.addClass('hidden');
        }
    },

    toggleAddUserInputFields: function(data, evt, target) {
        var input = this.obj('addUserInputFields');

        target.addClass('hidden');
        if(input.hasClass('hidden')) {
            this.obj('closeAddUserButton').removeClass('hidden');
            input.removeClass('hidden');
        } else {
            this.obj('addUserButton').removeClass('hidden');
            input.addClass('hidden');
        }
    }
});