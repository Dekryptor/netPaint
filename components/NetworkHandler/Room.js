    (function() {
    	
    	
    //Den Protoypen Erstellen und Erweitern
    var Room = Object.create(HTMLElement.prototype);
    
    Room.notifyMessage = function(envelope) {
        //Ein Event schicken, an alle Elemente die sich an den Typ der Message gebunden haben.
        var event = new CustomEvent(envelope.topic, { 'detail': envelope.data });
        this.dispatchEvent(event);
    };
    
    
    Room.sendKeepAlive = function() {
        var name = this.getAttribute("username");
        this.Network.sendMessage("keepAlive",name);
    };
    Room.cleanKeepAliveArray = function() {
        //Clients die innerhalb von 10s kein keepAlive geschickt haben, löschen
        var persons = this.persons;
        var now = new Date().getTime();
        for (var i in persons){
            if(persons[i] <= now-10000 ){
                delete persons[i]; //Das Element entfernen
            }
        }
    };
    
    Room.getPersonCount = function() {
         return Object.keys(this.persons).length;  
    };
    
    Room.init =function() {
        var self = this;
        self.persons = {};
        //Webworker Erstellen 
        var worker = new Worker("components/NetworkHandler/RoomWorker.js");
        worker.addEventListener("message",function(msg) {
            if(msg.data.data == self.getAttribute('room')){
                // Enschlüsselte "join"-Anfrage für den Aktuellen Raum bekommen.
                if(self.getPersonCount() < 3){
                    //Join Anfrage Bestätigen
                    self.Network.sendDefaultEncryptedMessage(self.getAttribute('room'),self.Network.cryptoManager.getInitVektor()); 
                }
                else{
                    self.Network.sendDefaultEncryptedMessage(self.getAttribute('room'),undefined);
                }
            }
        });
        
        //An die Broadcastnachrrichten des Parent-Elements binden.
        this.Network.addEventListener("broadcast",function(msg) {
            //Wenn eine nicht entschlüsselbare Nachrricht gefunden wird, auf "join"" Nachrrichten untersuchen.
            worker.postMessage((msg.detail));
        });
        
        this.Network.addEventListener("keepAlive",function(msg) {
            //Der KeepAlive wird Periodisch gesendet um anderen Mitgliedern im Raum zu signalisieren das man noch da ist.  
            //TODO: Handeln
            self.persons[msg.detail] = new Date().getTime();
        });
        
        window.setInterval(this.sendKeepAlive.bind(this),5000); //Alle 5s ein Keepalive Schicken
        window.setInterval(this.cleanKeepAliveArray.bind(this),8000); //Alle 8s das Keepalive array aufräumen
        
    };
 
    	
    Room.createdCallback = function() 
    {
        if(this.Network == undefined && this.parentNode != undefined){
            this.Network = this.parentNode;
            this.init();
        }
    };
    Room.attachedCallback = function() {
        if(this.Network == undefined && this.parentNode != undefined){
            this.Network = this.parentNode;
            this.init();
        }
    };
        
   
     document.registerElement('x-room', {prototype: Room});
    }());