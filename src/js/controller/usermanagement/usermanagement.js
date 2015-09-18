app.Controller('usermanagement-usermanagement', {
    
    init: function() {
        // get projects and user data here with mapping
        // implement initial a to z sorting here
        var self = this;
        app.apiAdapter.getUserList(function(res, message) {
            res = JSON.parse(res);
            self.__mapUsers(res);
            self.__mapProjects(res);
        }, function(res, message) {
            console.error('getUserList', res, message);
        });
    },

    __mapUsers: function(res) {
        var users   = res;
        var roles   = [];
        var counter = 0;
        var size    = Object.size(res);

        for(var u in res) {
            if(roles.indexOf(res[u].role) == -1) {
                roles.push(res[u].role);
            }

            counter++;

            if(counter == size) {
                this.set('users', users);
                this.set('roles', roles);
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
    addUser: function(data, evt, target) {
    },

    toggleUserEditing: function(data, evt, target) {
        var card = target.closest('.usermanagement-card');
        
        target.find('.glyphicon').toggleClass('glyphicon-pencil glyphicon-remove');

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
    
    handleUserInputArea: function(username, password) {
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
    
    checkUser: function(username) {
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
    
    checkPwd: function(password) {
        var message = "";
        if(password === "") {
            message = "Please enter a password";
        }
        else if(password.length <= 3) {
            message = "The password must contain at least 4 characters!";
        }

        if (message) {
            $('#password').addClass('danger');
            this.trigger('showNotification', { text: message, type: 'danger', time: 5 });
            return false;
        } else return true;
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
        /*app.apiAdapter.deleteUser(
            data.target,
            function(res, message) {
                console.log('deleteUser', res, message):
            },
            function(res, message) {
                console.error('deleteUser', res, message):
            }
        );*/
    },



    ////////////////////////////////
    // Project Related Part
    ///////////////////////////////
    addProject: function(data, evt, target) {
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
