ion.view = ion.view || {};

ion.view.filebox = {
    browseButton: '.ion-btn.browseForFile',
    events: [
        {
            type: 'dragstart',
            action: '_handleDragStart'
        },
        {
            type: 'drag',
            action: '_handleDrag'
        },
        {
            type: 'dragover',
            action: '_handleDragOver'
        },
        {
            selector: '.ion-btn.browseForFile',
            type: 'click',
            action: '_handleDragOver'
        }
    ],
    _handleDragStart: function (evt) {},
    _handleDrag: function (evt) {},
    _handleDragOver: function (evt) {}
};
