window.addEventListener("load",function(){
	
	var draw =document.querySelector("x-draw");
	var network =document.querySelector("x-network");
	
	document.querySelector("#delete").addEventListener("click",function() {
		draw.delete();
	});
	
	
	document.querySelector("#undo").addEventListener("click",function() {
		draw.undo();
	});
	
	draw.addEventListener("newLine",function() {
		 var stroke = draw.drawCandidate;
		 var paket;	 
		 paket = {
				 "id" 		: stroke.id,
				 "xPoints" 	: stroke.xPoints[stroke.xPoints.length-1],
				 "yPoints"  : stroke.yPoints[stroke.yPoints.length-1]
		};
		
		if(stroke.xPoints.length <=1){
			paket = stroke;
		} 
		 
		 var strStroke = JSON.stringify(paket);
		 console.log(paket);
		 network.sendMessage("paint",strStroke);
	}.bind(this));
	
	
	
	network.addEventListener("paint",function(msg) {
		 var stroke = JSON.parse(msg.detail);
		 draw.add(stroke);
		 console.log(stroke);
	}.bind(this));
	
	
});