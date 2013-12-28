//cordova init
var app = {
    initialize: function() {
        this.bindEvents();
    },
    bindEvents: function() {
        console.log('derp');
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    onDeviceReady: function() {
        console.log('merp');

        window.cast.echo("echome", function(echoValue) {
            console.log(echoValue == "echome");
        });
        app.receivedEvent('deviceready');
    },
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    },
    addDevices: function(devicesStr){
        console.log(devicesStr);
        alert(devicesStr);
        var devices = JSON.parse(devicesStr);
    }
};
app.addDevices('herp');
