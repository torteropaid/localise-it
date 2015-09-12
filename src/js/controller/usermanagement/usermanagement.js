app.Controller('usermanagement-usermanagement', {
    
    init: function() {
        // get projects and user data here with mapping
        // implement initial a to z sorting here
    },

    __mapUserProjectData: function() {

    },

    ////////////////////////////////
    // User Related Part
    ///////////////////////////////
    addUser: function(data, evt, target) {
    },

    toggleUserEditing: function(data, evt, target) {
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
    
    updateUser: function(data, evt, target) {
    },
    
    deleteUser: function(data, evt, target) {
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
