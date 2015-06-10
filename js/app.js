window.addEventListener("load",function(){
	
	var draw =document.querySelector("x-draw");
	
	document.querySelector("#delete").addEventListener("click",function() {
		draw.delete();
	});
	
	
	document.querySelector("#undo").addEventListener("click",function() {
		draw.undo();
	});
	
	draw.addEventListener("newLine",function() {
		 stroke = draw.paintstack[draw.paintstack.length-1];
		console.log(stroke);
	}.bind(this));
	
	
	var network =document.querySelector("x-network");
	draw.addEventListener("paint",function() {
		 console.log("i got a message for you");
	}.bind(this));
	
	
});