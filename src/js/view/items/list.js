app.view('items-list', {
    events: [
        {
            selector: 'span.glyphicon-ok',
            type: 'click',
            action: 'checkTranslation'
        },
        {
            selector: 'span.glyphicon-pencil',
            type: 'click',
            action: 'clickEdit'
        },
        {
            selector: '.panel-container',
            type: 'scroll',
            action: '__determineScrollPosition'
        },
        {
            selector: '.header-panel',
            type: 'click',
            action: 'showSelectedItem'
        },
        {
            selector: '.translations-panel-inputfield',
            type: 'focusout',
            action: 'changedTranslationsCollector'
        },
        {
            selector: '.item-delete-panel',
            type: 'click',
            action: 'toggleDelete'
        },
        {
            selector: '.item-confirm-delete-panel',
            type: 'click',
            action: 'deleteItem'
        },
        {
            selector: '.pager-list-item',
            type: 'click',
            action: 'changePage'
        },
        {
            action: 'importInitFile',
            type: 'change',
            selector: '#import-init-file'
        }, 

        //////////////////////////
        // Event Listener
        //////////////////////////
        {
            type: 'setLanguages',
            action: 'setLanguages'
        },
        {
            type: 'discardChanges',
            action: 'discardChanges'
        },
        {
            type: 'changeDefaultLanguage',
            action: 'changeDefaultLanguage'
        },
        {
            type: 'setItems',
            action: 'setItems'
        },
        {
            type: 'filterTranslations',
            action: 'filterTranslations'
        },
        {
            type: 'renderDom',
            action: 'renderDom'
        },
        {
            type: 'updateDom',
            action: 'updateDom'
        },
        {
            type: 'toggleLocale',
            action: 'toggleLocale'
        },
        {
            type: 'scrollToSelected',
            action: '__scrollToSelected'
        },
        {
            type: 'updatePage',
            action: '__updatePage'
        },
        {
            type: 'updateThis',
            action: 'updateThis'
        },
    ],

    input: '#import-init-file',
    snappingPoint: '.snapping-dot',
    noDataOverlay: '.no-data-overlay',

    toggleDelete: function(data, evt, target) {
        var id = data.id;
        var dl = $('.item-panel dl[data-value="'+id+'"]');
        if(dl.hasClass('deleting')) {
            dl.removeClass('deleting');
        } else {
            dl.addClass('deleting');
        }

        var icon = $('.item-panel dl[data-value="'+id+'"] .item-delete-panel .icon');
        if(icon.hasClass('glyphicon-trash')) {
            icon.removeClass('glyphicon-trash').addClass('glyphicon-remove');
        } else {
            icon.removeClass('glyphicon-remove').addClass('glyphicon-trash');
        }
    },
});