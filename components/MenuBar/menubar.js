
(function() {
  
  	var menu = Object.create(HTMLElement.prototype);
  	menu.createdCallback = function() {
          var tree      = this.createShadowRoot();
          var template  = document.querySelector('link[rel="import"]').import.querySelector('#menu-template');
          var clone = document.importNode(template.content, true);
          tree.appendChild(clone);
          
          //
          var visibilityswitch = tree.querySelector('#toggle-view');
          visibilityswitch.addEventListener
          ("click",function(e) {
             var sidebar = tree.querySelector('#sidebar');
             if(sidebar.getAttribute("class") != "hidden"){ sidebar.setAttribute ('class','hidden');}
             else {sidebar.setAttribute ('class','');}
          });
          
    };
      	


    document.registerElement('x-Menu', {prototype: menu});
}());