/// <reference path="EncryptionHandler.ts"/>
/// <reference path="definitions/message.ts"/>
/// <reference path="definitions/promise.ts"/>
// Sould be ws://borsti1.inf.fh-flensburg.de:8080
class SocketManager {
	private ws : WebSocket;
	private cryptoManager: EncryptionHandler;
	
	Messages :Array<Message> = new Array();
	
	
	constructor(url :string){
		this.ws= new WebSocket(url);
		var self = this; 
			
		this.ws.onopen = function(params) {
			console.log("Verbindung Geöffnet.");
			//Generellen CryptoManager laden.
			self.cryptoManager = new defaultEncryptionHandler();
		}
	
		this.ws.addEventListener('message',  function (message :MessageEvent) {
			//Nachricht enschlüsseln
			self.cryptoManager.decryptJSON(message.data)
			.then(function(params : string) 
				{
			  	var envelope : Message = JSON.parse(params);
				//Speichere die Letzten 10 Nachrrichten im Speicher
				self.Messages.unshift(envelope);
				if(self.Messages.length>=10){
					self.Messages.splice(10,1);
				}
				console.log(self.Messages);
				})
				 
			.catch(	function(error) 
				{
				//Catch the Unsucsessful Decryption

				});
		} );
		
		
	}
	
	sendMessage(topic : String, data:String){
		var self = this;
		var envelope = {
			'topic': topic,
			'data' : data
		};
		this.cryptoManager.encryptString(JSON.stringify(envelope))
			.then(function(encryptedMessage :string) 
			{
				self.ws.send(encryptedMessage);
			})
			.catch(function(params) {
				throw new Error("Konnte nicht Verschlüsseln");
			})
	}
	
	
	public set EncryptionHandler(v : EncryptionHandler) {
		if(v == null || v== undefined){
			this.cryptoManager = new defaultEncryptionHandler();
		}
		else{
			this.cryptoManager = v;	
		}
	}
	
	
	
	
	
}