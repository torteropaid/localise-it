app.view('usermanagement-usermanagement', {
    events: [
    // GENERAL
        {
            selector: ".remove-new-card-button",
            type: "click",
            action: "removeNewCard"
        },
        {
            selector: "input",
            type: "keyup",
            action: "keyUpOnInput"
        },

    // USER
        {
            selector: ".add-new-card",
            type: "click",
            action: "addCard"
        },
        {
            selector: ".edit-user-button",
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
        var self = this;
        $(".usermanagement-list-cards").sortable({
            connectWith: ".usermanagement-list-cards",
            scroll: false,
            helper: "clone",
            delay: 350,
            zIndex: 9999,
            start: function(event, ui) {
                $(ui.item[0]).addClass('dragged');
            },
            stop: function(event, ui) {
                $(ui.item[0]).removeClass('dragged');
                self.controller.rolesChanged();
            }
        });
    },

    addCard: function(data, evt, target) {
        if(data.target === 'user') {
            this.__addUserCard(target);
        } else if(data.target === 'project') {
            this.__addProjectsCard();
        }
    },

    __addUserCard: function(target) {
        var list = target.closest('.usermanagement-list');
        var role = list.attr('data-target');

        var card = "<div class='usermanagement-card open' data-target='0'><div class='usermanagement-card-information'>";
        card += "<input class='new-username-input-field' placeholder='enter username' data-target='0'/>";
        card += "<input placeholder='enter password' class='new-password-input-field' data-target='0'/>";
        card += "<div class='usermanagement-card-actions-container'><button class='remove-new-card-button'><span class='cancel-card glyphicon glyphicon-remove'></button></div>";
        card += "</div></div>";

        list.find('.usermanagement-list-cards').prepend(card);
    },

    removeNewCard: function(data, evt, target) {
        target.closest('.usermanagement-card').remove();
    },

    __addProjectsCard: function() {

    },

    keyUpOnInput: function(data, evt, target) {
        var tgt = $(evt.target);
        var type = data.target;
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

    __tilt_direction: function(item) {
        var left_pos = item.position().left,
            move_handler = function (e) {
                if (e.pageX >= left_pos) {
                    item.addClass("right");
                    item.removeClass("left");
                } else {
                    item.addClass("left");
                    item.removeClass("right");
                }
                left_pos = e.pageX;
            };
        $("html").bind("mousemove", move_handler);
        item.data("move_handler", move_handler);
    },  
});
