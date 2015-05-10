function NetworkManager(url) {
	 var ws = new WebSocket("ws://borsti1.inf.fh-flensburg.de:8080");
	
	ws.onopen = function(params) {
		console.log(params);	
	}
	
	ws.onmessage = function (params) {
		console.log(params);
	}
	
}