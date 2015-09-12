app.Controller('items-activityindicator', {

    /*init: function() {
        this.set('loading', false);
    },*/

    toggleLoading: function(opt) {
        this.set('loading', opt.flag);
    }

});