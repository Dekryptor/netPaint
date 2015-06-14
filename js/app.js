window.addEventListener("load", function () {

	var draw = document.querySelector("x-draw");
	var network = document.querySelector("x-network");
	var penEditor = document.querySelector('x-PenEditor');
	var lastIdSend;
	var roomList = {};
	
	function initXDraw() {
		//Initialisiert ein neu erstelltes X-Draw Element. Es wird mit dem Netzwerk verbunden und der Menubar
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
		//Alten Canvas Löschen
		var container = document.querySelector(".container");
		while (container.hasChildNodes()) {
			container.removeChild(container.firstChild);
		}
		var x = document.querySelectorAll(".inputForm div input");

		var name	 = x[0].value;
		var breite 	 = x[1].value;
		var hohe 	 = x[2].value;
		var bg 		 = x[3].value;
		var username = x[4].value;
		//Im Netzwerk einen Neuen Raum erstellen
		network.createRoom(name, username, breite, hohe, bg);

		//Neues x-Draw Element erstellen
		draw = document.createElement("x-draw");
			draw.setAttribute("width", breite);
			draw.setAttribute("height", hohe);
			draw.setAttribute("bg-color", bg);
		
		//Ins Dokument Einfügen und an Eventhandler Binden
		container.appendChild(draw);
		initXDraw();
	}.bind(this));

	//Sich an Announce Nachrrichten anderer clients binden - Wenn eine Empfangen wird, sie in das roomList - Directory einfügen
	network.addEventListener("announce", function (msg) {
		var room = msg.detail;
		roomList[room.room] = room;
		roomList[room.room].timestamp = Date.now();
		console.log(roomList);
	});

	//Alle 10s alte Einträge aus der Roomlist löschen
	window.setInterval(function () {
		for (var i in roomList) {
			if (roomList[i].timestamp < Date.now() + 10000) {
				delete roomList[i];
			}
		}
	}.bind(this), 10000);
	
	//Das Model Überwachen
	Object.observe(roomList,function(changes) {
		console.log("something changed");
	});









});