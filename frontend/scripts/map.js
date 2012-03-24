/**
 * Z-index table
 * 100 - UI
 * 1000 - login
 * 10000 - UI Lock
 */

Map = ( function() {

    var MapCreator = function() {};

    MapCreator.prototype.UniverseSize = 0; 
    
    MapCreator.prototype.init = function(target, x, y) {
        this.map = $(target);

        // Create viewport
        this.viewport = $(document.createElement('div')).attr('id', 'map-viewport')
            .css({'position': 'relative', 'overflow': 'hidden', 'height': ($(window).height() - parseInt(this.map.offset().top, 10))+'px'});
        this.map.append(this.viewport);

        // Create scroll
        this.scroll = $(document.createElement('div')).attr('id', 'map-scroll')
            .css({'position': 'absolute', 'top': '0px', 'left': '0px'});
        this.viewport.append(this.scroll);

        // Create canvas
        this.canvas = $(document.createElement('div')).attr('id', 'map-canvas')
            .css({'position': 'absolute', 'top': '0px', 'left': '0px', 'zIndex': '5'});
        this.scroll.append(this.canvas);

        // If possible at this stage, center map on x,y coordinates
        if(x !== undefined && y !== undefined) {
            this.scroll.css('top', (((this.map.height()/2) + y))+'px');
            this.scroll.css('left', ((this.map.width()/2) + -x)+'px');
        }
        
        this.shippaths = $(document.createElement('div')).attr('id', 'shiplines')
        	.css({'position': 'absolute', 'top':'0px', 'left':'0px'});
        this.map.append(this.shippaths);
        this.paper = Raphael("shiplines", this.shippaths.width(), this.shippaths.height());
                
        // Setup event handlers
        /*$(this.viewport).bind("mousedown", this, this.down);
        $(document).bind("mousemove", this, this.move);
        $(document).bind("mouseup", this, this.up);
        $(window).bind("resize", this, this.resize);*/
    };

    MapCreator.prototype.down = function(e) {
        e.data.mapOffset = e.data.map.offset();
        var page = [e.pageX - e.data.mapOffset.left, e.pageY - e.data.mapOffset.top];

        var xpos = page[0] - parseInt(e.data.scroll.css('left'), 10);
        var ypos = parseInt(e.data.scroll.css('top'), 10) - page[1];

        if(!e.data.moving) {
            e.data.posx = page[0];
            e.data.posy = page[1];
            e.data.moving = true;
        }
        return false;
    };

    MapCreator.prototype.move = function(e) {
        if(e.data.moving) {
            var cposx = e.pageX - e.data.mapOffset.left;
            var cposy = e.pageY - e.data.mapOffset.top;
            e.data.scroll.css('top', (parseInt(e.data.scroll.css('top'), 10) + (cposy - e.data.posy))+'px');
            e.data.scroll.css('left', (parseInt(e.data.scroll.css('left'), 10) + (cposx - e.data.posx))+'px');
            e.data.posx = cposx;
            e.data.posy = cposy;
        }
        return false;

    };

    MapCreator.prototype.up = function(e) {
        if(e.data.moving) {
            e.data.moving = false;
        }
        return false;
    };

    MapCreator.prototype.resize = function(e) {
        e.data.viewport.css('height', ($(window).height() - parseInt(e.data.map.offset().top, 10))+'px');
    };

    MapCreator.prototype.addObjects = function(objects) {
        this.objects = objects;
    };
    MapCreator.prototype.addOrders = function(orders) {
    	this.orders = orders;
    };

    MapCreator.prototype.draw = function() {
    	var boundaryOffset = 50; //pixels
    	
        if(this.objects) {
        	
        	this.canvas.empty();
            this.paper.clear();
        	
            universe = this.objects[0];
            
            var viewH = $(window).height();

            viewH = (viewH / 2) - (viewH / 16);
            //viewH = (viewH / 2);
            
            //Universe Radiuses
            var URH = 0;
            var URW = 0;
            var UniverseRadius = 0
            
            
            minX = universe.Size.minX;
            maxX = universe.Size.maxX;
            minY = universe.Size.minY;
            maxY = universe.Size.maxY;
            
            if(-minX > maxX)
            	URW = -minX;
            else 
            	URW = maxX;
            if(-minY > maxY)
            	URH = -minY;
            else
            	URH = maxY;
            
            //Determine the biggest dimension
            if(URW > URH)
            	UniverseRadius = URW;
            else
            	UniverseRadius = URH;
            
            var digitNum = countNumberDigits(UniverseRadius, viewH);
            
            Map.UniverseSize = digitNum;
            
            for(var i in universe.contains) {
                galaxy = this.objects[universe.contains[i]];
                for(var j in galaxy.contains) { 
                	system = this.objects[galaxy.contains[j]];
                    
                    var pixelPos = SpacePostoPixel(system.Position)
                    
                    var destPos = null;
                   
                    this.drawobject(pixelPos, system.id, system.name, system.type.name, system.Media);                    
                    
                }
                
            }            
            for( var obj in this.objects ){
            	if(this.objects[obj]["Order Queue"] != undefined && this.objects[obj]["Order Queue"]["queueid"] != undefined) {
		            if( (queueid = this.objects[obj]["Order Queue"]["queueid"]) != 0) {
		            	
		            	var startPos = this.objects[obj].Position;
		            	for(var i = 0; i < objKeyCount(this.orders[queueid].orders); i++) {
		            		
		            		var orderID = OrderPosition2OrderId(this.orders[queueid].orders, i);
		        			var order = this.orders[queueid].orders[orderID];
		        			if(order.name == "Move"){
		        				for(var h in order.args) {
		        					var movePos = order.args[h].value[0];
		        					movePos = {x:movePos[0], y: movePos[1]};
		        					
		        					this.drawpath(this.objects[obj].id, startPos, movePos);
		        					
		        					startPos = movePos;
		        				}
		        			}   				
		    			}
		            	
		            	this.paper.path("Z");
		            }
            	}
            }
            
        }
    };
    
    MapCreator.prototype.drawobject = function(pos, id, name, type, image, destPos) {
    	
    	//Shift the icons so they're directly over they're coodinate point 
    	var shifted = {};
    	shifted.x = pos.x - 50;
    	shifted.y = pos.y - 25;

    	var $mapObj = ObjectClass.constructDOMSystem(id, shifted);
    	this.canvas.append($mapObj);
    	
    };
    MapCreator.prototype.drawpath = function(id, startpos, destpos) {
    	//console.log(objpos)
    	//console.log(destpos)
    	
    	var startposPix = SpacePostoPixel(startpos);
    	var destposPix = SpacePostoPixel(destpos);
    
    	var width = Math.abs(startposPix.x - destposPix.x); 
        var height = Math.abs(startposPix.y - destposPix.y);
        
    	//var shapli = $(document.createElement('div')).attr({'id': 'shipline'+id});
        //$('#shiplines').append(shapli);
        
        //Determine the placement of the line shape
        //shapli.css({'top': determineLesserNumber(startposPix.y, destposPix.y),'left': determineLesserNumber(startposPix.x, destposPix.x), 'position': 'absolute'});
        var centerPos = { y: this.scroll.position().top, x: this.scroll.position().left };
        
        var transStartPos = PixelCoortoPixelPos(centerPos, startposPix);
        var transEndPos = PixelCoortoPixelPos(centerPos, destposPix);
        
        this.paper.path("M " + transStartPos.x + ", " + transStartPos.y + " L " + transEndPos.x + ", " + transEndPos.y ).attr("stroke", "#f00");
        
        /*
        if((startposPix.x < destposPix.x && startposPix.y < destposPix.y) || (startposPix.x > destposPix.x && startposPix.y > destposPix.y))
        	r.path("M 0 0 L " + width + " " + height).attr("stroke", "#f00");
        else 
        	r.path("M 0 "+height+ " L " + width *2+ " " + -height).attr("stroke", "#f00");
        */
        
       
    };
    
    MapCreator.prototype.hideSystemTitles = function(id) {
    	$('#map-canvas .name').css({'color': 'grey', 'z-index': '99'});
    	$('#map-canvas #'+id+' .name').css({'color':'white'});
    };
    MapCreator.prototype.showSystemTitles = function() {
    	$('#map-canvas .name').css('color', 'white');
    };
    
    
    return new MapCreator();
} )();
