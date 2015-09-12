app.view('main-main', {
    events: [
        {
            type: 'handleLog',
            action: 'handleLog'
        },
        {
            type: 'handleWaitloader',
            action: 'handleWaitloader'
        },
        {
            type: 'filterItems',
            action: 'filterItems'
        },
        {
            type: 'setItems',
            action: 'setItems'
        },
        {
            type: 'saveData',
            action: 'saveData'
        },
        {
            type: 'setGlobalState',
            action: 'setGlobalState'
        },
        {
            type: 'showGlobalSearch',
            action: 'showGlobalSearch'
        },
        {
            type: 'toggleMenu',
            action: 'toggleSidebar'
        },
        {
            type: 'triggerLocaleChanging',
            action: 'triggerLocaleChanging'
        },
        {
            type: 'toggleLoading',
            action: 'toggleLoading'
        },
        {
            type: 'toggleLoggedIn',
            action: 'toggleLoggedIn'
        },
    ],

    triggerLocaleChanging: function(payload) {
        this.trigger('triggerLocaleChange', payload);
    },

    toggleLoading: function(payload) {
        var indicator = $('.activity-indicator-overlay');
        if(payload.flag === true) indicator.addClass('loading');
        else indicator.removeClass('loading');
    },
});