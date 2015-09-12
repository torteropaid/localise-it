app.view('items-item', {
    events: [
        {
            selector: '#item-close',
            type: 'click',
            action: 'closeItem'
        },
        {
            selector: '.btn-success',
            type: 'click',
            action: 'toggleSuccess'
        },
        {
            selector: '#item-navigation button',
            type: 'click',
            action: 'navigate'
        },
        {
            selector: '#item-save',
            type: 'click',
            action: 'saveTranslations'
        },
        {
            selector: '#item-save-changes',
            type: 'click',
            action: 'saveChanges'
        },
        {
            selector: '#item-discard',
            type: 'click',
            action: 'discardTranslations'
        },
        {
            selector: '#item-discard-changes',
            type: 'click',
            action: 'discardChanges'
        },
        {
            selector: '#item-check',
            type: 'click',
            action: 'checkedTranslation'
        },
        {
            selector: '.item-translation',
            type: 'focusout',
            action: 'updateTranslationOnFocusout'
        },
        {
            selector: '.checkbox',
            type: 'click',
            action: 'change-selected-language'
        },
        {
            selector: '.item-language-selector',
            type: 'click',
            action: 'toggleSelectedItems'
        },

        //////////////////////////////////////
        // Event Listener
        /////////////////////////////////////
        {
            type: 'showitem',
            action: '__showitem'
        },
        {
            type: 'showStandardDialogue',
            action: 'showStandardDialogue'
        },
        {
            type: 'toggleShowItem',
            action: 'toggleShowItem'
        },
        {
            type: 'toggleLocale',
            action: 'toggleLocale'
        },
    ],

    defaultText: '#item-default-field',

    closeItem: function() {
        this.controller.toggleShowItem({show: false});
    },

    toggleSuccess: function(data) {
        $('.btn-success').toggleClass('checked');
        this.trigger('toggleOk');
    },

    toggleSelectedItems: function(data, evt, target) {
        target.closest('#item-default-language').find('textarea').toggleClass('hidden');
        this.controller.__setSelectedLanguages(data);
    },

});