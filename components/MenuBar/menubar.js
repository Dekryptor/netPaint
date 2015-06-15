
(function() {
  
  	var menu = Object.create(HTMLElement.prototype);
  	menu.createdCallback = function() {
          this.tree      = this.createShadowRoot();
          var template  = document.querySelector('link[rel="import"]').import.querySelector('#menu-template');
          var clone = document.importNode(template.content, true);
          this.tree.appendChild(clone);
          
          //
          var visibilityswitch = this.tree.querySelector('#toggle-view');
          visibilityswitch.addEventListener
          ("click",function(e) {
             var sidebar = this.tree.querySelector('#sidebar');
             if(sidebar.getAttribute("class") != "hidden"){ sidebar.setAttribute ('class','hidden');}
             else {sidebar.setAttribute ('class','');}
          }.bind(this));
          
    };
      
      
    menu.attributeChangedCallback = function (attribute, oldVal, newVal) {
          var sidebar = this.tree.querySelector('#sidebar');
        if(attribute=="class" && newVal== "collapsed"){
        
          sidebar.setAttribute ('class','hidden');
        }
         else {sidebar.setAttribute ('class','');}
    };	


    document.registerElement('x-Menu', {prototype: menu});
}());