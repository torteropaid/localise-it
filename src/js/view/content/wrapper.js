app.view('content-wrapper', {
    events: [
        {
            type: 'hashchange',
            action: 'checkHash'
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
        },
        {
            type: 'updateView',
            action: 'updateView'
        },
        {
            type: 'toggleShowItemHelper',
            action: '__toggleShowItemHelper'
        },
        {
            type: 'filterTranslationsHelper',
            action: '__filterTranslationsHelper'
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
    },

    __toggleShowItemHelper: function(payload) {
        this.trigger('toggleShowItem', payload);
    },

    __filterTranslationsHelper: function(payload) {
        console.log('filterTranslations');
        this.trigger('filterTranslations', payload);
    }

});