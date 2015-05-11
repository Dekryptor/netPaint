/// <reference path="EncryptionHandler.ts"/>
/// <reference path="definitions/message.ts"/>
/// <reference path="definitions/promise.ts"/>
// Sould be ws://borsti1.inf.fh-flensburg.de:8080
var SocketManager = (function () {
    function SocketManager(url) {
        this.MessageListners = new Array;
        this.ws = new WebSocket(url);
        var self = this;
        this.ws.onopen = function (params) {
            console.log("Verbindung Geöffnet.");
            //Generellen CryptoManager laden.
            self.cryptoManager = new defaultEncryptionHandler();
            self.session = "none";
        };
        this.ws.addEventListener('message', function (message) {
            //Nachricht enschlüsseln
            self.cryptoManager.decryptJSON(message.data).then(function (params) {
                var envelope = JSON.parse(params);
                console.log("Topic:" + envelope.topic);
                console.log("Data: " + envelope.data);
                //
                var event = new CustomEvent(envelope.topic, envelope.data);
            }, function (error) {
                //Catch the Unsucsessful Decryption
                var event = new CustomEvent("unencrypted", message.data);
            });
        });
    }
    SocketManager.prototype.sendMessage = function (topic, data) {
        var self = this;
        var envelope = {
            'topic': topic,
            'data': data
        };
        this.cryptoManager.encryptString(JSON.stringify(envelope)).then(function (encryptedMessage) {
            self.ws.send(encryptedMessage);
            console.log("Send:" + envelope + " as :" + encryptedMessage);
        });
    };
    SocketManager.prototype.addMessageListner = function (topic, callback) {
        this.MessageListners.push({ 'topic': topic, 'func': callback });
    };
    SocketManager.prototype.removeEventListener = function (callback) {
    };
    return SocketManager;
})();
