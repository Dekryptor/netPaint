
(function () {
    function PaintOperation() {
        this.time = Date.now();
        this.xPoints = new Array;
        this.yPoints = new Array;
        this.id = Math.round(Math.random() * 2147483648); //31 Bit 
    };
    
    
    var xdraw = Object.create(HTMLElement.prototype);
    //LifecycleCallbacks Registrieren
    xdraw.attachedCallback = function () {
        var that = this;
        var can = that.shadowDOM.querySelector("canvas");
        can.setAttribute("width", that.getAttribute("width"));
        can.setAttribute("height", that.getAttribute("height"));
        //Rendering Starten
        requestAnimationFrame(this.render.bind(this));
        //Wichtigen Eventlistner Hinzufügen
        var down = false;
        var index = 0;
        function startDraw(event) {
            //Beim Mousedown Zeichnen Initiatisieren
            var index = 0;
            this.drawCandidate = new PaintOperation();
            down = true;
            if (event.type == "touchstart") {
                this.drawCandidate.xPoints[0] = event.changedTouches[0].pageX - this.offsetLeft;
                this.drawCandidate.yPoints[0] = event.changedTouches[0].pageY - this.offsetTop;
            }
            else {
                this.drawCandidate.xPoints[0] = event.pageX - this.offsetLeft;
                this.drawCandidate.yPoints[0] = event.pageY - this.offsetTop;
            }
        }
        that.addEventListener("mousedown", startDraw.bind(this));
        that.addEventListener("touchstart", startDraw.bind(this));
        function doDraw(event) {
            // Bewegung im DrawCandidate Speichern
            if (down) {
                if (event.type == "touchmove") {
                    this.drawCandidate.xPoints[index] = event.changedTouches[0].pageX - this.offsetLeft;
                    this.drawCandidate.yPoints[index] = event.changedTouches[0].pageY - this.offsetTop;
                }
                else {
                    this.drawCandidate.xPoints[index] = event.pageX - this.offsetLeft;
                    this.drawCandidate.yPoints[index] = event.pageY - this.offsetTop;
                }
                index++;
            }
            else {
                index = 0;
            }
            if (index >= 255) {
                console.log("overflow vom index");
            }
        }
        that.addEventListener("touchmove", doDraw.bind(this));
        that.addEventListener("mousemove", doDraw.bind(this));
        function endDraw(event) {
            // Wenn Fertig, den Candiate oben auf den DrawStack Platzieren
            this.paintstack.push(this.drawCandidate);
            this.drawCandidate = null;
            down = false;
        }
        that.addEventListener("touchend", endDraw.bind(this));
        that.addEventListener("mouseup", endDraw.bind(this));
    };
    xdraw.attributeChangedCallback = function (attribute, oldVal, newVal) {
        var that = this;
        var can = that.shadowDOM.querySelector("canvas");
        can.setAttribute("width", that.getAttribute("width"));
        can.setAttribute("height", that.getAttribute("height"));
    };
    xdraw.createdCallback = function () {
        this.shadowDOM = this.createShadowRoot();
        var template = document.querySelector('link[rel="import"]').import.querySelector('#draw-template');
        var clone = document.importNode(template.content, true);
        this.shadowDOM.appendChild(clone);
        this.paintstack = new Array; //Paintstack Hashtable erstellen.
        var renderState = 0;
        var imageBuffer;
        this.drawCandidate = new PaintOperation();
        var canvas = this.shadowDOM.querySelector("canvas");
        var ctx = canvas.getContext("2d");
        var candidate = this.drawCandidate;
        this.render = function () {
      
            var paintstack = this.paintstack;
            if (renderState != paintstack.length) {
                if (renderState > paintstack.length) {
                    ctx.save();
                    
                    ctx.clearRect(0, 0, this.clientWidth, this.clientHeight);
                    for (var i = 0; i < this.paintstack.length; i++) {
                        //Painstack Malen
                        ctx.beginPath();
                        ctx.moveTo(paintstack[i].xPoints[0], paintstack[i].yPoints[0]);
                        for (var x = 1; x < paintstack[i].xPoints.length; x++) {
                            ctx.lineTo(paintstack[i].xPoints[x], paintstack[i].yPoints[x]);
                        }
                        ctx.stroke();
                        ctx.closePath();
                    }
                }
                else if (renderState < paintstack.length) {
                    for (var i = renderState; i < this.paintstack.length; i++) {
                        //Painstack Malen
                        ctx.beginPath();
                        ctx.moveTo(paintstack[i].xPoints[0], paintstack[i].yPoints[0]);
                        for (var x = 1; x < paintstack[i].xPoints.length; x++) {
                            ctx.lineTo(paintstack[i].xPoints[x], paintstack[i].yPoints[x]);
                        }
                        ctx.stroke();
                        ctx.closePath();
                    }
                }
            }
            renderState = paintstack.length;
            if (this.drawCandidate) {
                ctx.beginPath();
                ctx.moveTo(this.drawCandidate.xPoints[0], this.drawCandidate.yPoints[0]);
                for (var x = 1; x < this.drawCandidate.xPoints.length; x++) {
                    ctx.lineTo(this.drawCandidate.xPoints[x], this.drawCandidate.yPoints[x]);
                }
                ctx.stroke();
                ctx.closePath();
            }
            requestAnimationFrame(this.render.bind(this)); //Nächsten Frame anfordern
        };
    };
    
    
    //Öffentlichen Funktionen Definieren
    
    xdraw.delete = function() {
        this.paintstack = new Array;
    };
    xdraw.undo = function() {
        this.paintstack.pop();
    };
    
    xdraw.add = function(line){
        //Fügt eine Linie des Types PaintOperation hinzu
        if ( (line.xPoints.length - line.yPoints.length) == 0 )  {
            //Besitzt Punkte und davon gleichviele
            this.paintstack.push(line);
        }
    };
    
    
    
    document.registerElement('x-Draw', { prototype: xdraw });
}());
