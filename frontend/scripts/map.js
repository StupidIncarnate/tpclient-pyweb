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
            
            if($('#shiplines').length != 0)
            	$('#shiplines').remove();
            
            var shiplines = $(document.createElement('div')).attr({'id': 'shiplines'});
            this.canvas.append(shiplines);
            
            for(var i in universe.contains) {
                galaxy = this.objects[universe.contains[i]];
                for(var j in galaxy.contains) { 
                	system = this.objects[galaxy.contains[j]];
                    
                    var pixelPos = SpacePostoPixel(system.Position.x, system.Position.y)
                    
                    var destPos = null;
                    
                    //Determines if an object has a move order and proceeds to draw the path if it does.
                    /*MapCreator.prototype.drawCoordinatePath = function(object, pixelPos) {
                    	if(object["Order Queue"] != undefined && object["Order Queue"]["queueid"] != undefined && parseInt(object["Order Queue"]["queueid"]) != 0) {
	                    	queueid = parseInt(object["Order Queue"]["queueid"]);
	                    	if(queueid != undefined) {
		                    	subid = OrderPosition2OrderId(this.orders[queueid].orders, 0);
		                    	if(subid != undefined) {
		                    		var order = this.orders[queueid].orders[subid]
	                    			if(order.args[0].name == "Pos") {
	                    				destPos = SpacePostoPixel(order.args[0].value[0][0], order.args[0].value[0][1])
	                    				this.drawpath(object.id, pixelPos, destPos)
	                    			}
		                    	}
	                    	}
	                    }
                    }
                    
                    this.drawCoordinatePath(system, pixelPos)
                    
                    for(var k in system.contains) { 
                    	object = this.objects[system.contains[k]];
                    	this.drawCoordinatePath(object, pixelPos)
                    }*/
                    this.drawobject(pixelPos, system.id, system.name, system.type.name, system.Media);
                    
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
    MapCreator.prototype.drawpath = function(id, objpos, destpos) {
    	var width = Math.abs(objpos.x - destpos.x); 
        var height = Math.abs(objpos.y - destpos.y);
        
    	var shapli = $(document.createElement('div')).attr({'id': 'shipline'+id});
        $('#shiplines').append(shapli);
        
        var r = Raphael('shipline'+id, width, height);
        r.clear();
        //Determine the placement of the line shape
        shapli.css({'top': determineLesserNumber(objpos.y, destpos.y),'left': determineLesserNumber(objpos.x, destpos.x), 'position': 'absolute'});
        
        if((objpos.x < destpos.x && objpos.y < destpos.y) || (objpos.x > destpos.x && objpos.y > destpos.y))
        	r.path("M 0 0 L " + width + " " + height).attr("stroke", "#f00");
        else 
        	r.path("M 0 "+height+ " L " + width *2+ " " + -height).attr("stroke", "#f00");
        
        
       
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
