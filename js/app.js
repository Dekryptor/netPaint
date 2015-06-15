window.addEventListener("load", function () {

	var draw = document.querySelector("x-draw");
	var network = document.querySelector("x-network");
	var penEditor = document.querySelector('x-PenEditor');
	var lastIdSend;
	var roomList = {};
	var listTemplate = document.querySelector("#room-list template");
	var opened = false;
	
	
	function hideCreateUI(p) {
		//Versteckt den Öffnen / Schließen dialog und zeigt den Schließen dialog.
		
		if(p){
			opened=true;
			document.querySelector("#openMenu").setAttribute("class","button hidden");
			document.querySelector("#newMenu").setAttribute("class","button hidden");
			document.querySelector("#closeMenu").setAttribute("class","button");
			
		}
		else{
			document.querySelector("#openMenu").setAttribute("class","button ");
			document.querySelector("#newMenu").setAttribute("class","button ");
			document.querySelector("#closeMenu").setAttribute("class","button hidden");
			
		}
		
	}
	
	
	
	
	function initXDraw() {
		//Initialisiert ein neu erstelltes X-Draw Element. Es wird mit dem Netzwerk verbunden und der Menubar
		//Alten Canvas Löschen
		var container = document.querySelector(".container");
		while (container.hasChildNodes()) {
			container.removeChild(container.firstChild);
		}
		var roomElement 	= document.querySelector("x-room");
		var breite 			= roomElement.getAttribute("width");
		var hohe 			= roomElement.getAttribute("height");
		var bg 				= roomElement.getAttribute("color");
		
		//Neues x-Draw Element erstellen
		draw = document.createElement("x-draw");
			draw.setAttribute("width", breite);
			draw.setAttribute("height", hohe);
			draw.setAttribute("bg-color", bg);
		
		//Ins Dokument Einfügen und an Eventhandler Binden
		container.appendChild(draw);
		
		
		
		//Undo mit x-Draw Verbinden
			document.querySelector("#undo").addEventListener("click", function () {
				//Letzten Strick entfernen
				if (lastIdSend) {
					draw.undo(lastIdSend);
					//Im Netzwerk senden
					network.sendMessage("undo", lastIdSend);
					lastIdSend = undefined;
				}
			}.bind(this));

			network.addEventListener("undo", function (msg) {
				//Undo Nachrricht bekommen
				console.log("undo:" + msg.detail);
			}.bind(this));
		//Löschen Eventhandler
			document.querySelector("#delete").addEventListener("click", function () {
				draw.delete();
			});
		//Neue Striche von X-draw im Netzwerk verbreiten
			draw.addEventListener("newLine", function () {
				var stroke = draw.drawCandidate;
				lastIdSend = stroke.id;
				var paket;
				paket = {
					"id": stroke.id,
					"xPoints": stroke.xPoints[stroke.xPoints.length - 1],
					"yPoints": stroke.yPoints[stroke.yPoints.length - 1]
				};
				if (stroke.xPoints.length <= 1) {
					paket = stroke;
				}
				var strStroke = JSON.stringify(paket);
				network.sendMessage("paint", strStroke);
			}.bind(this));
	
			//Neuen Strich aus dem Netzwerk erhalten
			network.addEventListener("paint", function (msg) {
				var stroke = JSON.parse(msg.detail);
				draw.add(stroke);
			}.bind(this));

		//Stift wurde geändert
			penEditor.addEventListener("newPen", function () {
				draw.setPen(penEditor.penProto);
			});
	}

//EventHandler für den "Erstellen" Knopf des "neu" dialogs
	document.querySelector("#createCanvas").addEventListener("click", function (e) {
		//Formular auslesen
		var x = document.querySelectorAll(".newForm div input");
		var name	 = x[0].value;
		var breite 	 = x[4].value;
		var hohe 	 = x[5].value;
		var bg 		 = x[6].value;
		var username = x[7].value;
		//Im Netzwerk einen Neuen Raum erstellen
		network.createRoom(name, username, breite, hohe, bg);

		initXDraw();
		hideCreateUI(true);
	}.bind(this));

	function changeSizePreset(event) {
		var w; 
		var h;
		if		(event.target.value =="min"){w= 300; h=300;}
		else if (event.target.value =="medium"){w= 500; h=500;}
		else if (event.target.value =="max"){w= 800; h=800;}
		
		var x = document.querySelectorAll(".newForm div input");
		x[4].value =w; //Breite Im Formular
		x[5].value =h; //Höhe
		
	};
	
	for(var i =0; i<document.querySelectorAll("#sizeButtons input").length;i++){
		document.querySelectorAll("#sizeButtons input")[i].addEventListener("click",changeSizePreset);
	}



//Die Events für den "Open"-Dialog erstellen
	//Sich an Announce Nachrrichten anderer clients binden - Wenn eine Empfangen wird, sie in das roomList - Directory einfügen
	network.addEventListener("announce", function (msg) {
		var room = msg.detail;
		roomList[room.room] = room;
		roomList[room.room].timestamp = Date.now();
	});

	//Alle 10s alte Einträge aus der Roomlist löschen
	window.setInterval(function () {
		for (var i in roomList) {
			if (roomList[i].timestamp+ 10000< Date.now() ) {
				delete roomList[i];
			}
		}
	}.bind(this), 10000);
	
	
	
	//Die RoomList Überwachen
	Object.observe(roomList,function(changes) {

		function clickhandler(e) {
			//Namen des Geklickten Raumes herausfinden
			var room = roomList[e.target.parentElement.getAttribute("name")];
			//Dem Raum Beitreten
			network.joinRoom(room.room).then(function(p) {
				//Bei erfolg, das Raum-Element erweitern
				var roomElement = document.querySelector("x-room");
				var name  = roomElement.getAttribute("room");
				roomElement.setAttribute("width",roomList[name].width);
				roomElement.setAttribute("height",roomList[name].height);
				roomElement.setAttribute("color",roomList[name].background);
				//Den Canvas Initialisieren.
				initXDraw();
				
			}.bind(this));
		}


		for(var i=0; i< changes.length;i++){
			
			//Wenn ein neues Hinzugefügt worden ist
			if(changes[i].type === "add"){
				var elem = document.createElement("li");
	            var clone       = document.importNode(listTemplate.content, true);
	            elem.appendChild(clone);
				
				elem.querySelector("p").textContent = changes[i].name;
				elem.setAttribute("name",changes[i].name);
				
				elem.querySelector("input").addEventListener("click",clickhandler.bind(this));
				
				document.querySelector("#room-list").appendChild(elem);
			}
			else if(changes[i].type == "delete" ){
				//Element Entfernen wenn es aus dem Model entfernt wurde
				var elem =document.querySelector("#room-list li[name='"+changes[i].name+"']");
				var root = elem.parentElement;
				root.removeChild(elem);
			}
			
			
		}


	}.bind(this));


//Der Programmteil für die "Close-UI"
function closeDraw() {
	var container = document.querySelector(".container");
		while (container.hasChildNodes()) {
			container.removeChild(container.firstChild);
		}
		network.joinRoom(); //Dem Broadcast Channel Joinen
	hideCreateUI(false);
}


document.querySelector("#close").addEventListener("click",closeDraw.bind(this));



document.querySelector("#save").addEventListener("click",function() {
	var self = document.querySelector("#save");
	var lnk = draw.getFile();
	self.href = lnk;
	var name = prompt("Geben sie Einen Dateinamen ein:");
	if(name.length==0){name = document.querySelector("x-room").getAttribute("room");}
	self.download = name+".png";
		
}.bind(this));

document.querySelector("#pause").addEventListener("click",function() {
	//Paintstack Stringifyen
	var ps = new Array(draw.paintstack.length);
	for (var i = 0; i < draw.paintstack.length; i++) {
		//Kopie des Arrays Erstellen aber die X/Y-Punkte Stringifyen
		ps[i]={
			"id"		: draw.paintstack[i].id,
			"color"		: draw.paintstack[i].color,
			"size"		: draw.paintstack[i].size,
			"special" 	: draw.paintstack[i].special,
			"time"		: draw.paintstack[i].time,
			"xPoints"	: JSON.stringify(draw.paintstack[i].xPoints),
			"yPoints"	: JSON.stringify(draw.paintstack[i].yPoints)
			
		};

	}
	var roomElement 	= document.querySelector("x-room");
				
	var picture = {
		"paintstack" : JSON.stringify(ps),
		"pens"		: JSON.stringify(penEditor.recentPens.slice(0,4)),
		"width": roomElement.getAttribute("width"),
		"height": roomElement.getAttribute("height"),
		"color": roomElement.getAttribute("color"),
		"name"	: roomElement.getAttribute("room")
		
	};
	localStorage["latestStack"] = JSON.stringify(picture);
	
	closeDraw();
		
}.bind(this));


document.querySelector("#resume").addEventListener("click",function() {
		var settings = JSON.parse( localStorage["latestStack"]);
		var tempstack = JSON.parse(settings.paintstack);
		var paintstack = new Array(tempstack.length);
		var pens 		= JSON.parse(settings.pens);
		
		for(var i in pens){
			penEditor.savePen(pens[i]);
		}
		
		
		for(var i in tempstack){
			paintstack[i]= {
			"id"		: tempstack[i].id,
			"color"		: tempstack[i].color,
			"size"		: tempstack[i].size,
			"special" 	: tempstack[i].special,
			"time"		: tempstack[i].time,
			"xPoints"	: JSON.parse(tempstack[i].xPoints),
			"yPoints"	: JSON.parse(tempstack[i].yPoints)
			};
		} 
		
		network.createRoom(settings.name, "admin", settings.width, settings.height, settings.color);
		initXDraw();
		draw.paintstack = paintstack;
		hideCreateUI(true);

}.bind(this));



});