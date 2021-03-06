   // Prototypen des EncryptionHandlers Definieren
    (function() {
    	var EncryptionHandler = (function () {
        function EncryptionHandler(keydata, initVektor) {
            var self = this;
            if (initVektor == undefined || initVektor.length == 0) {
                //Einen initierungsvektor erstellen, wenn keiner übergeben wurde.
                this.iv = window.crypto.getRandomValues(new Uint8Array(16));
            }
            else {
                this.iv = initVektor;
            }
            //Aus dem Raum-Namen einen 256bit Hash erstellen.
            this.sha256(keydata).then(function (digest) {
                //Aus dem Hash und den Vektor einen Cryptokey für AEC-CBC erstellen und Speichern.
                crypto.subtle.importKey("raw", digest, "AES-CBC", true, ["encrypt", "decrypt"]).then(function (keyObj) {
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
        EncryptionHandler.prototype.encryptString = function (data) {
            //Einen String mit dem AES-Key Verschlüsseln. 
            //Gibt einen Promise zurück - Welcher einen JSONifed String zurück gibt
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
            //Einen Buffer mit dem AES-Key Verschlüsseln. 
            //Gibt einen Promise zurück mit einem Buffer als Argument
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
            //Einen JSON-String mit dem AES-Key Entschlüsseln. 
            //Gibt einen Promise zurück - Welcher den UR - String zurück gibt
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
            //Einen Buffer entschlüsseln. 
            //Rückgabewert ist ein Promise mit Buffer als Argument.
            var self = this;
            return new Promise(function (resolve, reject) {
                crypto.subtle.decrypt({ name: "AES-CBC", iv: self.iv }, self.key, data).then(function (decryptedBuffer) {
                    resolve(decryptedBuffer);
                }).catch(function (reason) {
                    reject(reason);
                });
            });
        };
        EncryptionHandler.prototype.getInitVektor = function () {
            //Den IV Lesbar machen
            return this.iv;
        };
        return EncryptionHandler;
    })();
    	
    //Den Protoypen Erstellen und Erweitern
    var Network = Object.create(HTMLElement.prototype);
    
    Network.notifyMessage = function(envelope) {
        //Ein Event schicken, an alle Elemente die sich an den Typ der Message gebunden haben.
        var event = new CustomEvent(envelope.topic, { 'detail': envelope.data });
        this.dispatchEvent(event);
    };
    
    
    Network.init = function(url) { 
       var self    = this;
       //Standard CryptoObjekt Erstellen
       var defaultvek      = new Uint8Array([38, 86, 215, 184, 230, 210, 185, 187, 139, 141, 157, 192, 67, 41, 251, 58]);
       this.cryptoDefault  = new EncryptionHandler("none",defaultvek);
        
       //Einen neuen WebSocket Öffnen
       this.ws = new WebSocket(url);
       this.ws.onopen = function(params) {
    	   console.log("Verbindung Geöffnet.");
    	   //Generellen CryptoManager laden.
    	   self.cryptoManager = self.cryptoDefault;
           self.setAttribute("connected","true");
    	};
        
       //Eventlistner für das Empfangen erstellen
       this.ws.addEventListener('message', function(message) {
    			//Nachricht enschlüsseln
    			self.cryptoManager.decryptJSON(message.data)
    		      .then(function(decryptedMessage) {
        				var envelope = JSON.parse(decryptedMessage);
        				self.notifyMessage(envelope);    
        			     })
                  .catch(function(reason) {
                        //Konnte Nicht Entschlüsselt werden, als broadcast weiterleiten. 
                        self.notifyMessage({"topic":"broadcast","data":message.data});
                       });
            
        });
        
    };
    
    
       Network.createdCallback = function() 
    {
        //Eigenschaften Prüfen, wenn gefunden übernehmen.
        var url     = this.getAttribute('url');
        this.setAttribute("connected","false");
        if(url != undefined){
            this.init(url);    
        }
      };
      
    Network.attributeChangedCallback = function(attribute, oldValue, newValue) {
      if(attribute=="url"){
          this.setAttribute("connected","false");
          this.init(newValue);
      }  
    };
        
      
    
    
    
    
    
    Network.sendMessage = function(topic,data) {
        //Nachrricht mit dem Aktuellen AES Key Verschlüsseln
        var self = this;
		var envelope = {
			'topic': topic,
			'data': data
		};
		this.cryptoManager.encryptString(JSON.stringify(envelope))
			.then(function(encryptedMessage) {
			self.ws.send(encryptedMessage);
		})
			.catch(function(params) {
			throw new Error("Konnte nicht Verschlüsseln");
		});
    };
    
    Network.sendDefaultEncryptedMessage = function(topic,data){
        //Benutzt immer den Allgemeinen AES-Key zum verschlüsseln.
		var self = this;
		var envelope = {
			'topic': topic,
			'data': data
		};
		this.cryptoDefault.encryptString(JSON.stringify(envelope))
			.then(function(encryptedMessage) {
			self.ws.send(encryptedMessage);
		})
			.catch(function(params) {
			throw new Error("Konnte nicht Verschlüsseln");
		});
    };
    
    Network.sendBroadcast = function(data) {
		//Sendet unverschlüsselt
		this.ws.send(data);
	};
    
    Network.createRoom = function(name,username,width,height,color) {
        var self = this;
         //Den Einen neuen EncryptionHandler für den Raum Erstellen
         self.cryptoManager = new EncryptionHandler(name);
         //  ROOM Objekt erstellen
        while(self.hasChildNodes()){
            self.removeChild(self.firstChild);
        }
         var room = document.createElement('x-room');
             room.setAttribute('room',name);
             room.setAttribute('username',username);
             room.setAttribute('width',width);
             room.setAttribute('height',height);
             room.setAttribute('color',color);  
         self.appendChild(room);
                
    
        
    };
    
    
    
    
    Network.joinRoom = function(name) {
        var self = this;
        //Die Verschlüsselung wieder auf Default setzten
        this.cryptoManager = this.cryptoDefault; 
        
        if(self.firstChild){this.removeChild(this.firstChild);
        }
        
        if(name != undefined){
            return new Promise(function(resolve,reject) {
                 //Aysnchron auf eine Antwort der Clienten Warten
                var listner = self.addEventListener(name,function(msg) {
                    window.clearTimeout(timeoutID);
                    if(msg.detail){
                        console.log("Confirm Erhalten -> IV :" + msg.detail);
                        //Aus der JSON wieder ein UINT8 Array erzeugen
                        var arr =[];
                        for(var i in msg.detail)
                        {
                            arr[i]=msg.detail[i];
                        }
                        var iv = new Uint8Array(arr);
                        self.removeEventListener(listner); // Wir mögen keine Speicherlecks
                        resolve(iv);
                    }
                    else{
                        console.log("Antwort ohne IV erhalten");
                        reject("Full");
                    }
                });
                
                
                //Nach 10 Sekunden das Verbinden beenden
                var timeoutID = window.setTimeout(function() {
                    self.removeEventListener(listner); //Verhindern das verspätet noch der IV Übernommen wird
                    console.log("Join Timeout");
                    reject("Timeout");
                }, 10000);
                
               
                
                self.sendDefaultEncryptedMessage('join',name);
                
            }).then(function(iv) {
                    //Erfolgreich einen IV bekommen.
                    //Den Einen neuen EncryptionHandler für den Raum Erstellen
                    self.cryptoManager = new EncryptionHandler(name,iv);
            
                    //Room Objekt erstellen
                        var room = document.createElement('x-room');
                        room.setAttribute('room',name);
                        self.appendChild(room);
                    
                 
            });
        }
        //Wenn kein Name übergeben wurde einfach wieder in den Default room wechseln
        else{
            //Einen Promise der Sofort true gibt zurückgeben
            return new Promise(function(resolve) {
                resolve("fake");
            });
        }
    };
    
    	
   
       
       
     document.registerElement('x-network', {prototype: Network});
    }());