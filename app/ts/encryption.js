/// <reference path="definitions/textencoder.ts"/>
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var EncryptionHandler = (function () {
    function EncryptionHandler(keydata, initVektor) {
        var self = this;
        if (initVektor == undefined || initVektor.length == 0) {
            //Einen initierungsvektor erstellen, wenn keiner übergeben.
            this.iv = window.crypto.getRandomValues(new Uint8Array(16));
        } else {
            this.iv = initVektor;
        }

        //Aus dem Raumnamen einen 256bit Hash erstellen.
        this.sha256(keydata).then(function (digest) {
            crypto.subtle.importKey("raw", digest, "AES-CBC", true, ["encrypt", "decrypt"]).then(function (keyObj) {
                //Aus dem Hash einen Cryptokey für AEC-CBC erstellen.
                self.key = keyObj;
            });
        });
    }
    EncryptionHandler.prototype.sha256 = function (str) {
        // String in einen Arraybuffer umwandeln
        var buffer = new TextEncoder("utf-8").encode(str);
        return window.crypto.subtle.digest("SHA-256", buffer).then(function (hash) {
            return hash;
        });
    };

    EncryptionHandler.prototype.encrypt = function (message) {
        if (this.key == null) {
            throw new Error("Cryptokey ist nicht initialisiert.");
        }
        if (message.length == 0) {
            throw new Error("Leere Nachrrichten können nicht verschlüsselt werden");
        }
        var buffer = new TextEncoder("utf-8").encode(message);
        return crypto.subtle.encrypt({ name: "AES-CBC", iv: this.iv }, this.key, buffer);
    };

    EncryptionHandler.prototype.decrypt = function (data) {
        if (this.iv == null) {
            throw new Error("Initialisierungsvektor nicht Gesetzt");
        }
        var self = this;
        var vektor = self.iv;
        var buffer = new TextEncoder("utf-8").encode(data);

        //Neuen Promise erstellen, welcher bei Erfolg den String zurück gibt
        return new Promise(function (resolve, reject) {
            crypto.subtle.decrypt({ name: "AES-CBC", iv: vektor }, self.key, buffer).then(function (msg) {
                var byteArray = new Uint8Array(msg);
                var encodedMsg = '';

                for (var i in byteArray) {
                    encodedMsg = encodedMsg + String.fromCharCode(byteArray[i]);
                }
                if (encodedMsg.length > 0) {
                    resolve(encodedMsg);
                } else {
                    reject();
                }
            }, function (params) {
                reject(params);
            });
        });
    };

    Object.defineProperty(EncryptionHandler.prototype, "initVektor", {
        //IV Lesbar machen
        get: function () {
            return this.iv;
        },
        enumerable: true,
        configurable: true
    });
    return EncryptionHandler;
})();

var defaultEncryptionHandler = (function (_super) {
    __extends(defaultEncryptionHandler, _super);
    function defaultEncryptionHandler() {
        var vek = new Uint8Array([38, 86, 215, 184, 230, 210, 185, 187, 139, 141, 157, 192, 67, 41, 251, 58]);
        _super.call(this, "none", vek);
    }
    return defaultEncryptionHandler;
})(EncryptionHandler);
