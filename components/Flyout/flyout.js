 (function() {
    	var flyout = Object.create(HTMLElement.prototype);


    	flyout.createdCallback = function() {
            this.tree       = this.createShadowRoot();
            var template    = document.querySelector('link[rel="import"]').import.querySelector('#flyout-template');
            var clone       = document.importNode(template.content, true);
            this.visibility= false;
            this.tree.appendChild(clone);
      };
      
      flyout.toggleVisibility = function() {
         if(this.getAttribute("class") != "hidden")
         {
           this.setAttribute('class','hidden');
         }
         else
         {
           this.setAttribute('class','');
         }
      };
      
      flyout.attachedCallback = function (params) {
            var self = this;
            try{
              //Versuchen sich an die EventHandler zu binden.
      
              var target = self.parentElement;
              target.addEventListener('click', 
                function(params) {
                  //An das Elternelement Binden um die Sichtbarkeit zu toggeln
                   if(target == event.target || target.contains(event.target)){
                    // self.setAttribute('class','');
                }});
                // Wenn im Fenster nicht auf das Eltern Element und nicht auf das Flyout geklickt wird, ausblenden
              window.addEventListener("click",function() {
                   // if(self != event.target && self.parentElement != event.target && self.contains(event.target) == false){
                   // self.setAttribute('class','hidden');
                   //}
                   
                   if( self.visibility && self.contains(event.target) || !(self.visbility) && self.parentElement.contains(event.target) ){
                      self.visiblity=true;
                      self.setAttribute('class','');
                   }
                   else{
                     self.visiblity=false;
                     self.setAttribute('class','hidden');
                   }
                   
                   
                   
              });
            }
            catch(e){
               throw new Error("Couldnt Attach to parent");
            }
      };
       
    
        	
  
  
  	document.registerElement('x-Flyout', {prototype: flyout});
  }());