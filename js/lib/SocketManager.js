/// <reference path="EncryptionHandler.ts"/>
/// <reference path="definitions/message.ts"/>
/// <reference path="definitions/promise.ts"/>
// Sould be ws://borsti1.inf.fh-flensburg.de:8080
var SocketManager = (function () {
    function SocketManager(url) {
        this.cryptoDefault = new defaultEncryptionHandler();
        //Öffentliche Property an die sich andere Objekte per Object.Observe anhängen können.
        this.LatestMessages = {};
        this.ws = new WebSocket(url);
        var self = this;
        //Messagetyp Broadcast Registrieren
        this.LatestMessages["broadcast"] = { "topic": 'broadcast', "data": undefined };
        this.ws.onopen = function (params) {
            console.log("Verbindung Geöffnet.");
            //Generellen CryptoManager laden.
            self.cryptoManager = self.cryptoDefault;
        };
        this.ws.addEventListener('message', function (message) {
            //Nachricht enschlüsseln
            self.cryptoManager.decryptJSON(message.data).then(function (params) {
                var envelope = JSON.parse(params);
                //Wenn die Nachrricht Registiert werden sollen, speichern
                if (self.LatestMessages[envelope.topic] != undefined) {
                    self.LatestMessages[envelope.topic].data = envelope.data;
                }
            }).catch(function (error) {
                //Mit anderem Schlüssel verschlüsselt oder unverschlüsselte Daten
                // werden unter Brodcast abgelegt. 
                self.LatestMessages["broadcast"].data = message.data;
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
    SocketManager.prototype.sendDefaultEncryptedMessage = function (topic, data) {
        //Benutzt immer den Allgemeinen AES-Key zum verschlüsseln.
        var self = this;
        var envelope = {
            'topic': topic,
            'data': data
        };
        this.cryptoDefault.encryptString(JSON.stringify(envelope)).then(function (encryptedMessage) {
            self.ws.send(encryptedMessage);
        }).catch(function (params) {
            throw new Error("Konnte nicht Verschlüsseln");
        });
    };
    SocketManager.prototype.sendBroadcast = function (data) {
        //Sendet unverschlüsselt
        this.ws.send(data);
    };
    SocketManager.prototype.setEncryptionHandler = function (v) {
        if (v == null || v == undefined) {
            this.cryptoManager = this.cryptoDefault;
        }
        else {
            this.cryptoManager = v;
        }
    };
    SocketManager.prototype.registerMessageType = function (s) {
        //Wenn im Message Register der Typ nicht defniert ist einen erstellen
        // damit der Gespeichert wird und andere Objekte es Observen können.
        if (this.LatestMessages[s] == undefined) {
            this.LatestMessages[s] = new Object;
            this.LatestMessages[s].topic = s;
        }
    };
    SocketManager.prototype.unRegisterMessageType = function (s) {
        // MessageTyp unregistrieren damit er nicht mehr gespeichert wird. 
        // Observer werden dabei mit entfernt.
        this.LatestMessages[s] = undefined;
    };
    return SocketManager;
})();
