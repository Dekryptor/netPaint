 (function() {
      function Pen(gr,r,g,b,s) {
        this.size = gr;
        this.red = r;
        this.blue = b;
        this.green = g;
        this.special = s ;
        this.getColor = function() {
          var rs,bs,gs;
          if(this.red <16){
              rs = "0"+this.red.toString(16);
          }
          else{
              rs = this.red.toString(16);
          }
          if(this.blue <16){
              bs = "0"+this.blue.toString(16);
          }
          else{
              bs = this.blue.toString(16);
          }
          if(this.green <16){
              gs = "0"+this.green.toString(16);
          }
          else{
              gs = this.green.toString(16);
          }
         
          return('#'+rs+gs+bs);
          };
      };
      
      function drawPenExample(canvas,p) {
          var ctx = canvas.getContext('2d');
          ctx.clearRect(0,0,canvas.width,canvas.height);
          ctx.fillStyle = p.getColor();
          ctx.beginPath();
          
            ctx.arc(canvas.width/2, canvas.height/2, p.size, 0, 2*Math.PI);
            ctx.fill();
          ctx.closePath();
      }

    	var penEditor = Object.create(HTMLElement.prototype);


    	penEditor.createdCallback = function() {
            this.tree       = this.createShadowRoot();
            var template    = document.querySelector('link[rel="import"]').import.querySelector('#pen-template');
            var clone       = document.importNode(template.content, true);
            this.tree.appendChild(clone);
            this.recentPens = new Array(4);
            this.penProto   = new Pen(1,0,0,0,false);
      };
      
      
      penEditor.savePen= function(p) {
           
            var copyPen = new Pen(p.size,p.red,p.green,p.blue,p.special);
           
            this.recentPens.unshift(copyPen);
            for(var i=0; i<4; i++){
               var can = this.tree.querySelectorAll('canvas')[1+i];
               try{
                 drawPenExample(can,this.recentPens[i]);
               }
               catch(e){}
            }
      };
      
  
      
      penEditor.attachedCallback = function (params) {
            var self = this;
            var canv = this.tree.querySelector("canvas");
            drawPenExample(canv,self.penProto);
            function modifyPenProto(e) {
                //Pen Bei Verändernung Anpassen
                self.penProto.size  =   parseInt(self.tree.querySelectorAll("input")[0].value);
                self.penProto.red   =   parseInt(self.tree.querySelectorAll("input")[1].value);
                self.penProto.green =   parseInt(self.tree.querySelectorAll("input")[2].value);
                self.penProto.blue  =   parseInt(self.tree.querySelectorAll("input")[3].value);
                self.penProto.special  =   self.tree.querySelector("input[type='checkbox']").checked;
               drawPenExample(canv,self.penProto);
               self.dispatchEvent(new Event("newPen"));
             }
           for(var i =0; i<4; i++){
             //Bei Allen Reglern Darauf reagieren
             self.tree.querySelectorAll("input")[i].addEventListener("input",modifyPenProto.bind(this));
           
           }
           
           function restoreFromRecent(event) {
             var index = parseInt(event.target.getAttribute("data"));
             var p = self.recentPens[index];
             self.penProto.size  =   p.size;
             self.penProto.red   =   p.red;
             self.penProto.green =   p.green;
             self.penProto.blue  =   p.blue;
             self.penProto.special = p.special;
             
             //UI Updaten
             self.tree.querySelectorAll("input")[0].value = p.size.toString();
             self.tree.querySelectorAll("input")[1].value = p.red.toString();
             self.tree.querySelectorAll("input")[2].value = p.green.toString();
             self.tree.querySelectorAll("input")[3].value = p.blue.toString();
             self.tree.querySelector("input[type='checkbox']").value = p.special;
             drawPenExample(canv,self.penProto);
           }
           
           for(var i =1; i<5; i++){
             //Bei Allen Canvas Clicks den gespeicherten Pen wieder laden
             self.tree.querySelectorAll("canvas")[i].addEventListener("click",restoreFromRecent.bind(this));
           }
           
           
           
           
          //Bei Save Speichern
          self.tree.querySelector("input[type='button']").addEventListener("click",function() {
                self.savePen(self.penProto);
           }.bind(this));
             
             
             
      };
       
    
        	
  
  
  	document.registerElement('x-PenEditor', {prototype: penEditor});
  }());