/// <reference path="definitions/textencoder.ts"/>

class EncryptionHandler {
	private key: CryptoKey;
	private iv;

	constructor(keydata: string, initVektor?: Int8Array) {
		var self = this;
		if (initVektor == undefined || initVektor.length == 0) {
			//Einen initierungsvektor erstellen, wenn keiner übergeben.
			this.iv = window.crypto.getRandomValues(new Uint8Array(16));
		}
		else {
			this.iv = initVektor;
		}
		//Aus dem Raumnamen einen 256bit Hash erstellen.
		this.sha256(keydata).then(function(digest) {
			crypto.subtle.importKey("raw", digest, "AES-CBC", true, ["encrypt", "decrypt"]).then(function(keyObj) {
				//Aus dem Hash einen Cryptokey für AEC-CBC erstellen.
				self.key = keyObj;
			});
		});
	}


	sha256(str) {
		// String in einen Arraybuffer umwandeln
		var buffer = new TextEncoder("utf-8").encode(str);
		return window.crypto.subtle.digest("SHA-256", buffer).then(function(hash) {
			return hash;
		});
	}

	encrypt(message: string) {
		if (this.key == null) {
			throw new Error("Cryptokey ist nicht initialisiert.");
		}
		if (message.length == 0) {
			throw new Error("Leere Nachrrichten können nicht verschlüsselt werden");
		}
		var buffer = new TextEncoder("utf-8").encode(message);
		return crypto.subtle.encrypt({ name: "AES-CBC", iv: this.iv }, this.key, buffer);
	}

	decrypt(data) {
		if (this.iv == null) {
			throw new Error("Initialisierungsvektor nicht Gesetzt");
		}
		var self = this;
		var vektor = self.iv;
		var buffer = new TextEncoder("utf-8").encode(data);
		//Neuen Promise erstellen, welcher bei Erfolg den String zurück gibt
		return new Promise(function(resolve, reject) {

			crypto.subtle.decrypt({ name: "AES-CBC", iv: vektor }, self.key, buffer).then(function(msg) {
				var byteArray = new Uint8Array(msg);
				var encodedMsg = '';
				//Byte Array zu String codieren
				for (var i in byteArray) {
					encodedMsg = encodedMsg + String.fromCharCode(byteArray[i]);
				}
				if (encodedMsg.length > 0) {
					resolve(encodedMsg);
				}
				else {
					reject();
				}
			}, function(params) {
					reject(params);
				});
		});
	}
	
	//IV Lesbar machen
	public get initVektor(): string {
		return this.iv;
	}


}

class defaultEncryptionHandler extends EncryptionHandler {
	constructor() {
		var vek = new Uint8Array([38, 86, 215, 184, 230, 210, 185, 187, 139, 141, 157, 192, 67, 41, 251, 58])
		super("none", vek);
	}

}