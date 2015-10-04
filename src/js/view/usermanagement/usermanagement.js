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
        {
            selector: ".go-back-wrapper",
            type: "click",
            action: "closeUsermanagement"
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
            selector: ".delete-user-button",
            type: "click",
            action: "deleteUser"
        },
        {
            selector: ".approve-new-card-button",
            type: "click",
            action: "approveNewUser"
        },
        {
            selector: ".approve-user-button",
            type: "click",
            action: "approveExistingUser"
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

    // Events
    ],
    username: "#username",
    password: "#password",

    init: function() {
        this.notify();
    },

    // onrendered
    notify: function() {
        if(app.meta.editRole === true) {
            var self = this;
            $(".usermanagement-list-cards").sortable({
                connectWith: ".usermanagement-list-cards",
                scroll: false,
                delay: 350,
                zIndex: 9999,
                accept: ":not(.usermanagement-list-card.currentUser)",
                start: function(event, ui) {
                    $(ui.item[0]).addClass('dragged');
                    $('.usermanagement-list-cards').addClass('dragStarted');
                },
                stop: function(event, ui) {
                    $(ui.item[0]).removeClass('dragged');
                    $('.usermanagement-list-cards').removeClass('dragStarted');
                    self.controller.rolesChanged();
                }
            });
        }
    },

    addCard: function(data, evt, target) {
        if(data.target === 'user') {
            this.__addUserCard(target);
        } else if(data.target === 'project') {
            this.__addProjectsCard();
        }
    },

    __addUserCard: function(target) {
        var list = target.closest('.usermanagement-list-wrapper');
        var role = list.attr('data-target');

        var card = "<div class='usermanagement-card open' data-target='"+role+"'>";
                card += "<div class='usermanagement-card-information'>";
                    card += "<input class='username-input-field' placeholder='Enter username' data-target='"+role+"' style='display: inline-block'/>";
                card += "</div>";
                card += "<input placeholder='Enter password' class='password-input-field' data-target='"+role+"'/>";
                card += "<div class='usermanagement-card-actions-container'>";
                    card += "<button class='approve-new-card-button col-md-6' data-target='"+role+"'><span class='cancel-card glyphicon glyphicon-ok'></button>";
                    card += "<button class='remove-new-card-button col-md-6'><span class='cancel-card glyphicon glyphicon-remove'></button>";
                card += "</div>";
        card += "</div>";

        list.find('.usermanagement-list-cards').prepend(card);
    },

    __generateNewCard: function(name, role) {
        var card = "<div class='usermanagement-card' data-target='"+name+"'>";
                card += "<div class='usermanagement-card-information'>";
                    card += "<span class='username-title'>"+name+"</span>";
                    card += "<input class='username-input-field' value='"+name+"' data-target='"+name+"' data-type='user'/>";
                card += "</div>";
                card += "<input type='text' placeholder='Change password' class='password-input-field' data-target='"+name+"'/>";
                card += "<div class='usermanagement-card-actions-container'>";
                    card += "<button class='edit-user-button col-md-6'><span class='cancel-card glyphicon glyphicon-pencil'></button>";
                    card += "<button class='delete-user-button col-md-6' data-target='"+name+"'><span class='cancel-card glyphicon glyphicon-trash'></button>";
                card += "</div>";
        card += "</div>";

        $('.usermanagement-list-wrapper[data-target="'+role+'"]').find('.usermanagement-list-cards').prepend(card);
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
