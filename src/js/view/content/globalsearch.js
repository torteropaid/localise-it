app.view('content-globalsearch', {
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
            selector: '.header-panel',
            type: 'click',
            action: 'showDialogue'
        },
        {
            selector: '.translations-panel-inputfield',
            type: 'focusout',
            action: 'changedTranslationsCollector'
        },
        {
            selector: 'span.glyphicon-ok',
            type: 'click',
            action: 'checkTranslation'
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
    ],

});