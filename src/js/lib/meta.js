app = app || {}

app.meta = {
    pageTitle: 'l.it - localise it',
    favicon: 'l.it - localise it',
    logo: 'l.it - localise it',
    userManagement: true,
    editName: true,
    editPassword: true,
    editRole: false,
    addRole: false,
    projectManagement: false,
    addProject: false,
    development: true,
    title: function() {
        $('head title').text(this.pageTitle);
    },
    logs: function() {
        if (!this.development) {
            console = console || {};
            console.log = console.error = console.info = console.debug = console.warn = console.trace = console.dir = console.dirxml = console.group = console.groupEnd = console.time = console.timeEnd = console.assert = console.profile = function() {};
        }
    },
    predefinedRoles: ["admin", "user"],
    exportofusermanagement: true,
    importoftranslationfiles: true,
    exportoftranslationfiles: true
};