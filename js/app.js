window.addEventListener("load", function () {

	var draw = document.querySelector("x-draw");
	var network = document.querySelector("x-network");
	var penEditor = document.querySelector('x-PenEditor');
	var lastIdSend;
	var roomList = {};
	var listTemplate = document.querySelector("#room-list template");
	var opened = false;
	var passive = false;

	function getSettings() {
		var formular = document.querySelectorAll(".newForm div input");
		var roomElement = document.querySelector("x-room");
		var name,color,username,width,height;
		if(roomElement){
			//Wenn gejoined wurde die einstellungen aus dem Raum übernehmen
			name 		= roomElement.getAttribute("name");
			username 	= roomElement.getAttribute("username"); 
			color 		= roomElement.getAttribute("color");
			width		= roomElement.getAttribute("width");
			height		= roomElement.getAttribute("height");	
		}
		//Wenn nicht gejoined wurde
		else{
			name 		= formular[0].value;
			username 	= formular[7].value; 
			color 		= formular[6].value;
			width		= formular[4].value;
			height		= formular[5].value;	
		}
		
		
		return {
				"pens"		: JSON.stringify(penEditor.recentPens.slice(0, 4)),
				"width"		: width,
				"height"	: height,
				"color"		: color,
				"username"	: username,
				"name"		: name
		};		
	};
	
	function setSettings(setting) {
		var pens = JSON.parse(setting.pens);
		for (var i in pens) {
			if(pens[i]){
				penEditor.savePen(pens[i]);
			}
		}

		var formular = document.querySelectorAll(".newForm div input");
		formular[4].value = setting.width; //Breite ins Formular schreineb
		formular[5].value = setting.height; //Höhe ebenso
		formular[6].value = setting.color;
		formular[7].value = setting.username;

	};
	
	
	


	function hideCreateUI(p) {
		//Versteckt den Öffnen / Schließen dialog und zeigt den Schließen dialog.
		if (p) {
			opened = true;
			document.querySelector("#openMenu").setAttribute("class", "button hidden");
			document.querySelector("#newMenu").setAttribute("class", "button hidden");
			document.querySelector("#closeMenu").setAttribute("class", "button");

		}
		else {
			document.querySelector("#openMenu").setAttribute("class", "button ");
			document.querySelector("#newMenu").setAttribute("class", "button ");
			document.querySelector("#closeMenu").setAttribute("class", "button hidden");
		}

	}

	function initXDraw() {
		//Initialisiert ein neu erstelltes X-Draw Element. Es wird mit dem Netzwerk verbunden und der Menubar
		//Alten Canvas Löschen
		var container = document.querySelector(".container");
		while (container.hasChildNodes()) {
			container.removeChild(container.firstChild);
		}
		var roomElement = document.querySelector("x-room");
		var breite = roomElement.getAttribute("width");
		var hohe = roomElement.getAttribute("height");
		var bg = roomElement.getAttribute("color");
		
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
			if(!passive){
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
			}
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
		var setting = getSettings();
		//Im Netzwerk einen Neuen Raum erstellen
		network.createRoom(setting.name, setting.username, setting.width, setting.height, setting.color);
		initXDraw();
		hideCreateUI(true);
	}.bind(this));

	function changeSizePreset(event) {
		//Passt die Voreinstellungen im "Erstelle ein Bild"-Dialog je nach angeklickten Button an
		var w;
		var h;
		if (event.target.value == "min") { w = 300; h = 300; }
		else if (event.target.value == "medium") { w = 500; h = 500; }
		else if (event.target.value == "max") { w = 800; h = 800; }

		var formular = document.querySelectorAll(".newForm div input");
		formular[4].value = w; //Breite ins Formular schreineb
		formular[5].value = h; //Höhe ebenso
		
	};

	for (var i = 0; i < document.querySelectorAll("#sizeButtons input").length; i++) {
		//Beim Klick auf min/med/max die Größe anpassen
		document.querySelectorAll("#sizeButtons input")[i].addEventListener("click", changeSizePreset);
	}


	network.addEventListener("goPassive", function (msg) {
		if(msg.detail == getSettings().username){
				 passive = true;														//Verhindern das über das Netzwerk Striche Gesendet werden
				 document.querySelector("x-room").setAttribute("passive","true");		//Verhindern das der Client andere in den Passiven Modus Versetzt
				 document.querySelector("x-draw").setAttribute("class","locked");		//Den Canvas rot umleuchten um den Locked Status anzuzeigen
				 document.querySelector("x-menu").setAttribute("class","collapsed");	//Die Menuleiste in der Seite verschwinden lassen
				 
		}
	});



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
			if (roomList[i].timestamp + 10000 < Date.now()) {
				delete roomList[i];
			}
		}
	}.bind(this), 10000);


	function joinClickedRoom(e) {
		//Sorgt dafür, das wenn in der Raumliste ein Element angeklickt wird, der richtige Raum "gejoined" wird.
			
		//Namen des Geklickten Raumes herausfinden
		var room = roomList[e.target.parentElement.getAttribute("name")];
		var username = prompt("Ihr Benutzername zum beitreten:");
		//Dem Raum Beitreten
		network.joinRoom(room.room).then(function (p) {
			//Bei erfolg, das Raum-Element erweitern
			var roomElement = document.querySelector("x-room");
			var name = roomElement.getAttribute("room");
			roomElement.setAttribute("username", username);
			roomElement.setAttribute("width", roomList[name].width);
			roomElement.setAttribute("height", roomList[name].height);
			roomElement.setAttribute("color", roomList[name].background);
			//Den Canvas Initialisieren.
			initXDraw();
			hideCreateUI(true);
		}.bind(this));
	}

	//Die RoomList auf Änderungen überwachen und bei bedarf das DOM anpassen
	Object.observe(roomList, function (changes) {
		for (var i = 0; i < changes.length; i++) {	
			//Wenn ein neues Hinzugefügt worden ist
			if (changes[i].type === "add") {
				var elem = document.createElement("li");
				var clone = document.importNode(listTemplate.content, true);
				elem.appendChild(clone);

				elem.querySelector("p").textContent = changes[i].name;
				elem.setAttribute("name", changes[i].name);

				elem.querySelector("input").addEventListener("click", joinClickedRoom.bind(this));

				document.querySelector("#room-list").appendChild(elem);
			}
			else if (changes[i].type == "delete") {
				//Element Entfernen wenn es aus dem Model entfernt wurde
				var elem = document.querySelector("#room-list li[name='" + changes[i].name + "']");
				var root = elem.parentElement;
				root.removeChild(elem);
			}
		}
	}.bind(this));


	//Der Programmteil für die "Close-UI"
	function closeDraw() {
		//Schließt das Canvas und stellt die Verschlüsselung auf Standart zurück
		var container = document.querySelector(".container");
		while (container.hasChildNodes()) {
			container.removeChild(container.firstChild);
		}
		network.joinRoom(); //Dem Broadcast Channel Joinen
		hideCreateUI(false);
	}
	document.querySelector("#close").addEventListener("click", closeDraw.bind(this));



	document.querySelector("#save").addEventListener("click", function () {
		//Fragt nach einem Dateinamen und Speichert den Canvas als PNG Datei auf dem Computer ab.
		var self = document.querySelector("#save");
		var link = draw.getFile();
		self.href = link;
		var name = prompt("Geben sie Einen Dateinamen ein:");
		if (name.length == 0) { name = document.querySelector("x-room").getAttribute("room"); }
		self.download = name + ".png";
	}.bind(this));

	document.querySelector("#pause").addEventListener("click", function () {
		//Speichert das Bild und die Einstellungen im LocalStorage unter "lastPicture"
		var picture = {
			"paintstack": draw.toString(),
			"settings"	: JSON.stringify(getSettings())

		};
		localStorage["lastPicture"] = JSON.stringify(picture);
		closeDraw();
	}.bind(this));


	document.querySelector("#resume").addEventListener("click", function () {
		//Läd ein altes Bild inkl Einstellungen wieder zum bearbeiten.
		var picture = JSON.parse(localStorage["lastPicture"]);
		var setting = JSON.parse(picture.settings);
		network.createRoom(setting.name, "admin", setting.width, setting.height, setting.color);
		initXDraw();
		draw.fromString(picture.paintstack);
		hideCreateUI(true);

	}.bind(this));

//Teil für Einstellungssätze Speichern / Laden
	var settingStore = {};

	//Den Einstellung-sichern button auswählen und einen Eventhandler anfügen
	document.querySelectorAll("#settingsMenu input[type='button']")[0].addEventListener("click", function (e) {
			//Aktuellen Einstellungen Besorgen	
			var setting =getSettings();
			var settingname = document.querySelectorAll("#settingsMenu input[type='text']")[0].value;
			settingStore[settingname] = setting;
			localStorage["settingStore"] = JSON.stringify(settingStore);
	});

	document.querySelectorAll("#settingsMenu input[type='button']")[1].addEventListener("click", function (e) {
		//Löschen Button.
		var selectElement = document.querySelector("#settingsMenu select");
		var selectedSetting = selectElement.value;
		delete settingStore[selectedSetting];
		localStorage["settingStore"] = JSON.stringify(settingStore);	
	});
	
	document.querySelectorAll("#settingsMenu input[type='button']")[2].addEventListener("click", function (e) {
		//Laden Button.
		var selectElement = document.querySelector("#settingsMenu select");
		var selectedSetting = selectElement.value;
		var setting = settingStore[selectedSetting];
		localStorage["latestSetting"]= selectedSetting;
		setSettings(setting);
	});





Object.observe(settingStore, function (changes) {
	for (var i = 0; i < changes.length; i++) {	
		//Wenn ein neues Hinzugefügt worden ist
		if (changes[i].type === "add") {
			var elem = document.createElement("option");
			elem.setAttribute("value", changes[i].name);

			elem.textContent = changes[i].name;
			document.querySelector("#settingsMenu select").appendChild(elem);
		}
		else if (changes[i].type == "delete") {
			//Element Entfernen wenn es aus dem Model entfernt wurde
			var elem = document.querySelector("#settingsMenu option[value='" + changes[i].name + "']");
			var root = elem.parentElement;
			root.removeChild(elem);
		}
	}
}.bind(this));



(function(){
	//Settings laden
	var localSettingStore = JSON.parse(localStorage["settingStore"]);
	for (var i in localSettingStore) {
		settingStore[i] = localSettingStore[i];
	}

	//Letzte Einstellung Laden
	var latestSetting = localStorage["latestSetting"];
	if(settingStore[latestSetting]){
		setSettings(settingStore[latestSetting]);
	}
})();
	
	
});