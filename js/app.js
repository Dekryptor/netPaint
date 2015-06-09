window.addEventListener("load",function(){
	
	document.querySelector("#delete").addEventListener("click",function() {
		document.querySelector("x-draw").delete();
	});
	
	var draw =document.querySelector("x-draw");
	draw.addEventListener("newLine",function() {
		 stroke = draw.paintstack[draw.paintstack.length-1];
		console.log(stroke);
	}.bind(this));
	
	
	var network =document.querySelector("x-network");
	draw.addEventListener("paint",function() {
		 console.log("i got a message for you");
	}.bind(this));
	
	
});