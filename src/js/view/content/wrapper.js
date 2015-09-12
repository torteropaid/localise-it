app.view('content-wrapper', {
    events: [
        {
            type: 'hashchange',
            action: 'hashchange'
        },
        {
            type: 'showItem',
            action: 'showItem'
        },
        {
            type: 'changeLocale',
            action: 'changeLocale'
        },
        {
            type: 'filterBySearch',
            action: 'filterBySearch'
        },
        {
            type: 'scrollToNavigatedItem',
            action: 'scrollToNavigatedItem'
        }
    ],

    init: function() {
    },

    changeLocale: function(opt) {
        this.trigger('toggleLocale', opt);
    },

    filterBySearch: function(payload) {
        this.trigger('filterTranslations', payload)
    },

    scrollToNavigatedItem: function() {
        this.trigger('scrollToSelected')
    }

});