/// <reference path="EncryptionHandler.ts"/>
importScripts('EncryptionHandler.js');
var enc = new EncryptionHandler("none", new Uint8Array([38, 86, 215, 184, 230, 210, 185, 187, 139, 141, 157, 192, 67, 41, 251, 58]));
self.addEventListener('message', function (msg) {
    //Verschlüsselte Nachrricht auf Zweitem Thread Enschlüsseln
    var me = self;
    enc.decryptJSON(msg.data).then(function (params) {
        var envelope = JSON.parse(params);
        if (envelope.topic == "join") {
            self.postMessage(envelope);
        }
    }).catch(function (reason) {
        //Konnte Nicht Entschlüsselt werden.
    });
});
