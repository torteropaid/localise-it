app.Controller = app.Controller || {};

app.Controller.Base = {
    __error: function (msg, evt, target) {
        // TODO default
        // app.app.error();
    },

    __success: function (msg, evt, target) {
        // TODO default
        // app.app.success();
    }
};

// app.Controller.Base = app._merge(app.Controller.Base);
