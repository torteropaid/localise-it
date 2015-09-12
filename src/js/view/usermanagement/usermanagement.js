app.View('usermanagement-usermanagement', {
    events: [
    // USER
        {
            selector: ".edituser",
            type: "click",
            action: "addUser"
        },
        {
            selector: ".edituser",
            type: "click",
            action: "toggleUserEditing"
        },
        {
            selector: ".edituser",
            type: "click",
            action: "handleUserInputArea"
        },
        {
            selector: ".edituser",
            type: "click",
            action: "updateUser"
        },
        {
            selector: ".edituser",
            type: "click",
            action: "deleteUser"
        },

    // Project
        {
            selector: ".edituser",
            type: "click",
            action: "addProject"
        },
        {
            selector: ".edituser",
            type: "click",
            action: "toggleProjectEditing"
        },
        {
            selector: ".edituser",
            type: "click",
            action: "handleProjectInputArea"
        },
        {
            selector: ".edituser",
            type: "click",
            action: "updateProject"
        },
        {
            selector: ".edituser",
            type: "click",
            action: "deleteProject"
        },
    ],
    username: "#username",
    password: "#password",

    init: function() {
        this.notify();
    },

    // onrendered
    notify: function() {
        $(".list-group").sortable({
            connectWith: ".list-group",
            scroll:      false,
            appendTo:    '.detail',
            receive:     this.controller.rolesChanged.bind(this.controller),
        });

        $(".user.list-group-item" ).draggable({
            connectToSortable: '.list-group',
            helper: "clone",
            revert: false,
            scroll: false,
            start: function(event, ui) {
                ui.helper.find('.emil-btn').remove();
                ui.helper.find('.role').remove();
            }
        });
    },

    keyUpOnInput: function(data, evt, target) {
        var tgt = $(evt.target);
        if (evt.which===13) {
            if (tgt.parents('.newrole').length > 0) {
                this.enterOnRoleInputArea(data, evt, target);
            }
            else if (tgt.parents('.newuser').length > 0) {
                this.enterOnUserInputArea(data, evt, target);
            }
        } else {
            if(tgt.is('input')) {
                $('input').removeClass('danger');
                this.trigger('closeNotification');
                if (tgt.parents('.newuser').length > 0) {
                    var username = this.obj("username").val();
                    var password = this.obj("password").val();
                    this.controller._set('username', username, true);
                    this.controller._set('password', password, true);
                }
            }
        }
    },

    // USER
    enterOnUserInputArea: function() {
        var username = this.obj("username").val();
        var password = this.obj("password").val();
        this.controller.handleUserInputArea(username, password); 
    },

    openUserEditArea: function(username, roleid) {
        this.controller.openUserEditArea(username, roleid);
        var self = this;
        this.__timer = setTimeout(function() {
            self.obj("username").focus();
            clearTimeout(self.__timer);
            delete self.__timer;
        }, 100);
    },

    editUserButtonClick: function(data, evt, target) {
        var username = $(target).parent().data("user");
        var roleid   = $(target).parent().data("origin");
        this.openUserEditArea(username, roleid);
    },

    enterOnRoleInputArea: function() {
        var rolename = this.obj("rolename").val();
        this.controller.handleRoleInputArea(rolename);
    },

    editRoleButtonClick: function(data, evt, target) {
        var rolename = $(target).parent().data("role");
        this.controller.set('edit_role', rolename);
        this.openRoleEditArea(rolename);
    },
});
