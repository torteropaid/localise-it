app.Controller('usermanagement-usermanagement', {
    
    init: function() {
        var self = this;
        app.apiAdapter.getUserList(function(res, message) {
            res = JSON.parse(res);
            self.__mapUsers(res);
            self.__mapProjects(res);
        }, function(res, message) {
            console.error('getUserList', res, message);
        });
    },

    closeUsermanagement: function() {
        window.location.hash = '';
    },


    __mapUsers: function(res) {
        var users   = res;
        var roles   = [];
        var counter = 0;
        var size    = Object.size(res);
        var userExists = false;

        for(var u in res) {
            if(roles.indexOf(res[u].role) == -1) {
                roles.push(res[u].role);
            }
            if(res[u].role == 'user') {
                userExists = true;
            }

            counter++;

            if(counter == size) {
                this.set('users', users);
                this.set('roles', roles);
                this.set('userExists', userExists);
                this.set('projectManagement', app.meta.projectManagement);
                this.set('addRoleEnabled', app.meta.addRole);
                this.set('addRoleEnabled', app.meta.addRole);
                this.set('exportofusermanagement', app.meta.exportOfUserManagement);
            }
        }
    },

    __mapProjects: function() {

    },

    ////////////////////////////////
    // User Related Part
    ///////////////////////////////
    toggleUserEditing: function(data, evt, target) {
        var card = target.closest('.usermanagement-card');
        
        target.find('.glyphicon').toggleClass('glyphicon-pencil glyphicon-ok');
        target.toggleClass('approve-user-button edit-user-button');

        if(card.hasClass('open')) {
            card.removeClass('open');
            card.find('.username-title').show();
            card.find('.username-input-field').hide();
        } else {
            card.addClass('open');
            card.find('.username-title').hide();
            card.find('.username-input-field').show();
        }
    },

    approveExistingUser: function(data, evt, target) {
        var self  = this;
        var role  = data.target;
        var name  = target.closest('.usermanagement-card').find('.username-input-field');
        var pwd   = target.closest('.usermanagement-card').find('.password-input-field');

        var valid = this.__checkUserInput(data, evt, target);

        if(valid === true) {
            var obj = {username: name.val(), password: pwd.val(), role: role};
            app.apiAdapter.updateUser(obj, function(res, msg) {
                console.log('changeUser', res, msg);
                text = 'User "'+name.val()+'" successfully updated.';
                self.trigger('showNotification', {text: text, type: 'success', time: 5});
            }, function(res, msg) {
                console.error('changeUser', res, msg);
                text = "User data could not be updated: "+msg;
                self.trigger('showNotification', {text: text, type: 'error', time: 5});
            });
        }
    },

    approveNewUser: function(data, evt, target) {
        var self  = this;
        var role  = data.target;
        var name  = target.closest('.usermanagement-card').find('.username-input-field');
        var pwd   = target.closest('.usermanagement-card').find('.password-input-field');

        var valid = this.__checkUserInput(data, evt, target);

        if(valid === true) {
            var obj = {username: name.val(), password: pwd.val(), role: role};
            app.apiAdapter.addUser(obj, function(res, msg) {
                console.log('addUser', res, msg);
                text = 'User "'+name.val()+'" successfully added to '+role;
                self.trigger('showNotification', {text: text, type: 'success', time: 5});
                target.closest('.usermanagement-card').remove();
                self.view.__generateNewCard(name.val(), role);
            }, function(res, msg) {
                console.error('addUser', res, msg);
                text = "User could not be saved: "+msg;
                self.trigger('showNotification', {text: text, type: 'error', time: 5});
            });
        }
    },

    __checkUserInput: function(data, evt, target) {
        var users = this.get('users');
        var name  = target.closest('.usermanagement-card').find('.username-input-field');
        var pwd   = target.closest('.usermanagement-card').find('.password-input-field');
        var check = false;

        if(name.val() === '') {
            name.val('');
            name.attr('placeholder', 'Please add username');
            name.addClass('error');
        } else if(pwd.val() === '') {
            pwd.val('');
            pwd.attr('placeholder', 'Please add a password');
            pwd.addClass('error');
        } else if(pwd.val().length < 5) {
            pwd.val('');
            pwd.attr('placeholder', 'Minimum 5 characters');
            pwd.addClass('error');
        } else if(users[name] !== undefined) {
            text = "Username is already in use.";
            this.trigger('showNotification', {text: text, type: 'error', time: 5});
        } else {
            check = true;
        }

        return check;
    },

    rolesChanged: function() {
        var self      = this;
        var lists     = $('.usermanagement-list[data-type="role"]');
        var userArray = _.cloneDeep(this.get('users'));

        lists.each(function() {
            var list  = $(this);
            var role  = list.attr('data-target');
            var cards = list.find('.usermanagement-card');

            cards.each(function() {
                var card = $(this);
                var id   = card.attr('data-target');

                if(userArray[id].role !== role) {
                    userArray[id].role = role;
                    self.username      = id;
                    self.password      = null;
                    self.role          = role;

                    //self.__updateUser();
                }

            });
        });
    },
    
    __updateUser: function(data, evt, target) {
        var obj = {
            username: this.username,
            password: this.password,
            role: this.role
        };

        app.apiAdapter.updateUser(
            obj,
            function(res, message) {
                console.log('__updateUser', res, message);
            },
            function(res, message) {
                console.error('__updateUser', res, message);
            }
        );
    },
    
    __allowUser: function(data, evt, target) {
        var obj = {
            username: this.username,
            project: this.project
        };

        app.apiAdapter.updateUser(
            obj,
            function(res, message) {
                console.log('__allowUser', res, message);
            },
            function(res, message) {
                console.error('__allowUser', res, message);
            }
        );
    },
    
    deleteUser: function(data, evt, target) {
        var self = this;

        app.apiAdapter.deleteUser(
            data.target,
            function(res, message) {
                text = 'User "'+data.target+'" has been successfully deleted.';
                self.trigger('showNotification', {text: text, type: 'success', time: 5});
                target.closest('.usermanagement-card').remove();
                console.log('deleteUser', res, message);
            },
            function(res, message) {
                text = 'An error occured while deleting user "'+data.target+'"'+msg;
                self.trigger('showNotification', {text: text, type: 'error', time: 5});
                console.error('deleteUser', res, message);
            }
        );
    },



    ////////////////////////////////
    // Project Related Part
    ///////////////////////////////
    addProject: function(data, evt, target) {
        var name = target.val();

        app.apiAdapter.createProject(name, function(res, msg) {
            console.log('createProject success', res, msg);
        }, function(res, msg) {
            console.error('createProject error', res, msg);
        })
    },

    toggleProjectEditing: function(data, evt, target) {
    },
    
    handleProjectInputArea: function(username, password) {
        var edit_user = this.get('edit_user');
        var selectedRole = this.get('selectedRole');
        var roleid = this.getRole('id', selectedRole);
        
        if(this.checkUser(username)) {
            if (edit_user) {
                if (password === ""){
                    this.updateUser(edit_user, username, this.getUser('', edit_user).password, roleid);
                    this.set('selectedRole', this.getRole('name'));
                    return;
                }
            }
            else {
                if(this.checkPwd(password)) {
                    this.addUser(username, password, roleid);
                    this.set('selectedRole', this.getRole('name'));
                    return;
                } 
            }
        }
        console.error("Save failed!");
    },
    
    checkProject: function(username) {
        var message = "";
        var edit_user = this.get('edit_user');

        if (username === "") {
            message = "Please enter a username";
        }
        else if (username.length <= 3) {
            message = "Username must have at least 4 characters";
        }
        else if (edit_user!=username && this.itemExists(username, 'users')) { 
            message = "Username is already taken";
        }

        if (message) {
            $('#user_name').addClass('danger');
            this.trigger('showNotification', { text: message, type: 'danger', time: 5 });
            return false;
        } 
        else return true;
    },
    
    updateProject: function(data, evt, target) {
    },
    
    deleteProject: function(data, evt, target) {
    },
});
