app.view('search-search', {
    events: [
        {
            selector: '#global-search-filter',
            type: 'keyup',
            action: 'startGlobalSearch'
        },
        {
            selector: '#global-search-filter',
            type: 'keydown',
            action: 'navigateSearchResults'
        },
        {
            selector: '#clear-search-filter',
            type: 'click',
            action: 'clearSearch'
        },
        {
            selector: '.global-search-autocomplete-panel .global-search-autocomplete-value',
            type: 'click',
            action: 'selectValueFromAutocomplete'
        },
        {
            selector: "*:not(#locale-selector)",
            type: "click",
            action: "closeDropdown"
        },
        {
            selector: "*:not(.input-field-group)",
            type: "click",
            action: "clearSearchAutocomplete"
        },
        {
            selector: "#locale-selector",
            type: "click",
            action: "toggleDropdown"
        },
        {
            selector: "li.locale",
            type: "click",
            action: "changeLocale"
        },

        //////////////////////////
        // Event Listener
        //////////////////////////
        {
            type: 'setLanguages',
            action: 'setLanguages'
        },
        {
            type: 'setGlobalDefaultLanguage',
            action: 'setGlobalDefaultLanguage'
        },
        {
            type: 'triggerLocaleChange',
            action: 'changeLocale'
        },
        {
            type: 'updateThis',
            action: 'updateThis'
        },
    ],

    toggleDropdown: function() {
        this.showSelect = true;
        $('#locale-selector .dropdown-menu').toggle();
        $('.locale-selector-btn-group').toggleClass('open');
    },
    
    closeDropdown: function() {
        if (!this.showSelect) {
            $('#locale-selector .dropdown-menu').hide();
            $('.locale-selector-btn-group').removeClass('open');
        }
        this.showSelect = false;
    },
});