/// <reference path="EncryptionHandler.ts"/>
/// <reference path="definitions/message.ts"/>
/// <reference path="definitions/promise.ts"/>
// Sould be ws://borsti1.inf.fh-flensburg.de:8080
class SocketManager {
	ws : WebSocket;
	cryptoManager: EncryptionHandler;
	session : String;
	MessageListners = new Array;
	
	
	constructor(url :string){
		this.ws= new WebSocket(url);
		var self = this; 
			
		this.ws.onopen = function(params) {
			console.log("Verbindung Geöffnet.");
			//Generellen CryptoManager laden.
			self.cryptoManager = new defaultEncryptionHandler();
			self.session="none";
		}
	
		this.ws.addEventListener('message',  function (message :MessageEvent) {
			//Nachricht enschlüsseln
			self.cryptoManager.decryptJSON(message.data)
			.then(function(params : string) 
				{
			  	var envelope : Message = JSON.parse(params);
				console.log("Topic:" +envelope.topic);
				console.log("Data: " +envelope.data);
				
				//
				var event = new CustomEvent(envelope.topic, envelope.data); 	
				}, 
				function(error) 
				{
				//Catch the Unsucsessful Decryption
				var event = new CustomEvent("unencrypted", message.data);
				
				});
		} );
		
		
	}
	
	sendMessage(topic : String, data:String){
		var self = this;
		var envelope = {
			'topic': topic,
			'data' : data
		};
		this.cryptoManager.encryptString(JSON.stringify(envelope)).then(function(encryptedMessage :string) {
		
			self.ws.send(encryptedMessage);
			console.log("Send:" + envelope +" as :" +encryptedMessage);
		})
	}
	
	addMessageListner(topic: String, callback: Function){
		this.MessageListners.push({'topic':topic,'func':callback});
	}
	
	removeEventListener(callback: Function){
		
	}
	
	
}