app = app || {}

app.meta = {
    userManagement: true,
    addRole: true,
    projectManagement: false,
    addProject: false,
    title: function() {
        $('head title').text('Commscope - Language Portal');
    },
    predefinedRoles: ["admin", "user"],
    exportofusermanagement: true,
    importoftranslationfiles: true,
    exportoftranslationfiles: true
};