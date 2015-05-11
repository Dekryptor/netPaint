/// <reference path="encryption.ts"/>
/// <reference path="definitions/message.ts"/>
/// <reference path="definitions/promise.ts"/>
// Sould be ws://borsti1.inf.fh-flensburg.de:8080
class NetworkManager {
	ws : WebSocket;
	cryptoManager: EncryptionHandler;
	session : String;
	
	constructor(url){
		this.ws= new WebSocket(url);
		var self = this; 
			
		this.ws.onopen = function(params) {
			console.log("Verbindung Geöffnet.");
			//Generellen CryptoManager laden.
			self.cryptoManager = new defaultEncryptionHandler();
			this.session="none";
		}
	
		this.ws.onmessage = function (message :MessageEvent) {
			//Nachricht enschlüsseln
			self.cryptoManager.decrypt(message).then(function(params : string) {
			  	var envelope : Message = JSON.parse(params);
				console.log("Topic:" +envelope.topic);
				console.log("Data: " +envelope.data); 	
			}, function(error) {
				console.log("Recived: "+ message)
				console.log("Apperently i recived a not encrypted Message: ");
			})
		}
		
	}
	
	sendMessage(topic : String, data:String){
		var self = this;
		var envelope = {
			'topic': topic,
			'data' : data
		};
		this.cryptoManager.encrypt(JSON.stringify(envelope)).then(function(encryptedMessage) {
			self.ws.send(encryptedMessage);
			console.log("Send:" + envelope +" as :" +encryptedMessage);
		})
	}
	
	
}