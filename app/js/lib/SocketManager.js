/// <reference path="EncryptionHandler.ts"/>
/// <reference path="definitions/message.ts"/>
/// <reference path="definitions/promise.ts"/>
// Sould be ws://borsti1.inf.fh-flensburg.de:8080
var SocketManager = (function () {
    function SocketManager(url) {
        this.Messages = new Array();
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
                self.Messages.unshift(envelope);
                if (self.Messages.length >= 10) {
                    self.Messages.splice(10, 1);
                }
                console.log(self.Messages);
            }).catch(function (error) {
                //Catch the Unsucsessful Decryption
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
        }).catch(function (params) {
            throw new Error("Konnte nicht Verschlüsseln");
        });
    };
    SocketManager.prototype.addMessageListner = function (topic, callback) {
        this.MessageListners.push({ 'topic': topic, 'func': callback });
    };
    SocketManager.prototype.removeEventListener = function (callback) {
    };
    return SocketManager;
})();
