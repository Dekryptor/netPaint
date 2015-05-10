var EncryptionHandler = (function () {
    function EncryptionHandler(keydata, initVektor) {
        this.sha256 = function (str) {
            // String in einen Arraybuffer umwandeln
            var buffer = new TextEncoder("utf-8").encode(str);
            return crypto.subtle.digest("SHA-256", buffer).then(function (hash) {
                return hash;
            });
        };
        this.encrypt = function (message) {
            if (this.key == null) {
                throw new Error("Cryptokey ist nicht initialisiert.");
            }
            if (message.length == 0) {
                throw new Error("Leere Nachrrichten können nicht verschlüsselt werden");
            }
            var buffer = new TextEncoder("utf-8").encode(message);
            return crypto.subtle.encrypt({ name: "AES-CBC", iv: this.iv }, this.key, buffer);
        };
        this.decrypt = function (data) {
            if (this.iv == null) {
                throw new Error("Initialisierungsvektor nicht Gesetzt");
            }
            var self = this;
            var vektor = self.iv;

            //Neuen Promise erstellen, welcher bei Erfolg den String zurück gibt
            return new Promise(function (resolve, reject) {
                crypto.subtle.decrypt({ name: "AES-CBC", iv: vektor }, self.key, data).then(function (msg) {
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
                });
            });
        };
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
