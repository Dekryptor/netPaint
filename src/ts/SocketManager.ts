/// <reference path="EncryptionHandler.ts"/>
/// <reference path="definitions/message.ts"/>
/// <reference path="definitions/promise.ts"/>
// Sould be ws://borsti1.inf.fh-flensburg.de:8080
class SocketManager {
	private ws: WebSocket;
	private cryptoManager: EncryptionHandler;
	private cryptoDefault: EncryptionHandler = new defaultEncryptionHandler();
	
	//Öffentliche Property an die sich andere Objekte per Object.Observe anhängen können.
	LatestMessages = {};

	constructor(url: string) {
		this.ws = new WebSocket(url);
		var self = this; 
		
		//Messagetyp Broadcast Registrieren
		this.LatestMessages["broadcast"] = { "topic": 'broadcast', "data": undefined };

		this.ws.onopen = function(params) {
			console.log("Verbindung Geöffnet.");
			//Generellen CryptoManager laden.
			self.cryptoManager = self.cryptoDefault;
		}

		this.ws.addEventListener('message', function(message: MessageEvent) {
			//Nachricht enschlüsseln
			self.cryptoManager.decryptJSON(message.data)
				.then(function(params: string) {
				var envelope: Message = JSON.parse(params);
				//Wenn die Nachrricht Registiert werden sollen, speichern
				if (self.LatestMessages[envelope.topic] != undefined) {
					self.LatestMessages[envelope.topic].data = envelope.data;
				}
			})

				.catch(function(error) {
				//Mit anderem Schlüssel verschlüsselt oder unverschlüsselte Daten
				// werden unter Brodcast abgelegt. 
				self.LatestMessages["broadcast"].data = message.data;
			});
		});


	}

	sendMessage(topic: String, data: String) {
		var self = this;
		var envelope = {
			'topic': topic,
			'data': data
		};
		this.cryptoManager.encryptString(JSON.stringify(envelope))
			.then(function(encryptedMessage: string) {
			self.ws.send(encryptedMessage);
		})
			.catch(function(params) {
			throw new Error("Konnte nicht Verschlüsseln");
		})
	}

	sendDefaultEncryptedMessage(topic: String, data: String) {
		//Benutzt immer den Allgemeinen AES-Key zum verschlüsseln.
		var self = this;
		var envelope = {
			'topic': topic,
			'data': data
		};
		this.cryptoDefault.encryptString(JSON.stringify(envelope))
			.then(function(encryptedMessage: string) {
			self.ws.send(encryptedMessage);
		})
			.catch(function(params) {
			throw new Error("Konnte nicht Verschlüsseln");
		})
	}

	sendBroadcast(data: String) {
		//Sendet unverschlüsselt
		this.ws.send(data);
	}

	setEncryptionHandler(v: EncryptionHandler) {
		if (v == null || v == undefined) {
			this.cryptoManager = this.cryptoDefault;
		}
		else {
			this.cryptoManager = v;
		}
	}


	registerMessageType(s: string) {
		//Wenn im Message Register der Typ nicht defniert ist einen erstellen
		// damit der Gespeichert wird und andere Objekte es Observen können.
		if (this.LatestMessages[s] == undefined) {
			this.LatestMessages[s] = new Object;
			this.LatestMessages[s].topic = s;
		}
	}

	unRegisterMessageType(s: string) {
		// MessageTyp unregistrieren damit er nicht mehr gespeichert wird. 
		// Observer werden dabei mit entfernt.
		this.LatestMessages[s] = undefined;
	}


}