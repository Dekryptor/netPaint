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
        }
        else {
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
    EncryptionHandler.prototype.arrayBufferToString = function (buf) {
        return new TextDecoder('utf-8').decode(buf);
    };
    EncryptionHandler.prototype.encryptString = function (data) {
        var self = this;
        var buffer = new TextEncoder('utf-8').encode(data);
        return new Promise(function (resolve, reject) {
            self.encryptBuffer(buffer).then(function (ergebnis) {
                var bufferArray = new Uint8Array(ergebnis);
                resolve(JSON.stringify(bufferArray));
            }).catch(function (reason) {
                reject(reason);
            });
        });
    };
    EncryptionHandler.prototype.encryptBuffer = function (data) {
        var self = this;
        if (this.key == null) {
            throw new Error("Cryptokey ist nicht initialisiert.");
        }
        return new Promise(function (resolve, reject) {
            crypto.subtle.encrypt({ name: "AES-CBC", iv: self.iv }, self.key, data).then(function (encryptedBuffer) {
                resolve(encryptedBuffer);
            }, function (params) {
                reject(params);
            });
        });
    };
    EncryptionHandler.prototype.decryptJSON = function (data) {
        var self = this;
        return new Promise(function (resolve, reject) {
            //Aus der JSON wieder einen Buffer erzeugen - Da der Server keine Binäre Übertragung unterstüzt.
            var obj = JSON.parse(data);
            var arr = [];
            for (var i in obj) {
                arr[i] = obj[i];
            }
            var buffer = new Uint8Array(arr).buffer;
            //Buffer entschlüsseln
            self.decryptBuffer(buffer).then(function (decryptedBuffer) {
                //Aus Buffer wieder einen String machen
                resolve(new TextDecoder('utf-8').decode(decryptedBuffer));
            }).catch(function (reason) {
                reject(reason);
            });
        });
    };
    EncryptionHandler.prototype.decryptBuffer = function (data) {
        var self = this;
        if (this.iv == null) {
            throw new Error("Initialisierungsvektor nicht Gesetzt");
        }
        else if (self.key == null) {
            throw new Error("Key ist nicht initialisiert");
        }
        //var buffer : ArrayBufferView = new TextEncoder("utf-8").encode(data);
        //Neuen Promise erstellen, welcher bei Erfolg den String zurück gibt
        return new Promise(function (resolve, reject) {
            crypto.subtle.decrypt({ name: "AES-CBC", iv: self.iv }, self.key, data).then(function (decryptedBuffer) {
                resolve(decryptedBuffer);
            }, function (params) {
                console.log("Etwas lief falsch");
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
