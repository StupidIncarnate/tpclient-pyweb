
TaskManager = ( function() {
	
	var Manager = function() {};
	/*
     * Click Manager
     * 
     * Manages the click focus
     * 
     */
    var ClickManagerComponent = ( function() {
    	
    	var ClickManagerClass = function(){};
    	ClickManagerClass.prototype.coordinateOrder = false; //The move order
    	ClickManagerClass.prototype.orderType = null;
    	ClickManagerClass.prototype.objid = 0; //Object id that is being issued an order
    	ClickManagerClass.prototype.clickObjectDisabled = 0; //Object that gets right-clicked
    	
    	ClickManagerClass.prototype.launchInfoComponent = function(id){
    		if(ClickManagerComponent.coordinateOrder == true) {
    			ClickManagerComponent.objectClicked(id);
    		} else {
    			if(ClickManagerComponent.clickObjectDisabled != parseInt(id)) {
    				  WindowClass.InfoWindow.onItemClick(id);
    			}
    		}
    	};
    	ClickManagerClass.prototype.launchOrderMenu = function(eventData, cssobject) {
    		if(ClickManagerComponent.coordinateOrder == true) {
    			ClickManagerComponent.objectClicked(id);
    		} else {
    			ClickManagerComponent.clickObjectDisabled = parseInt(cssobject.attr('id'));
    			OrderComponent.constructOrdersMenu(eventData, cssobject);
    		}
    	};
    	ClickManagerClass.prototype.closeWindow = function(eventData, id) {
    		if(id == "map-viewport") {
    			if(ClickManagerComponent.coordinateOrder == true)
        			ClickManagerComponent.mapClicked(eventData);
        		else {
        			//alert($("#map-scroll").position().left + " " + eventData.pageX);
        			WindowManagerComponent.removeObject();
        		}
	    	}
    	};
    	ClickManagerClass.prototype.closeMenu = function(eventData, id) {
    		if(id == "system-bar" && WindowManagerComponent.registeredWindow() == "") {
    			WindowManagerComponent.removeObject();
    		}
    	};
    	//These two functions are for when a coordinate order is issued, such as move. 
    	ClickManagerClass.prototype.mapClicked = function(eventData) {
    		console.log("MAP CLICKED");
    		if(ClickManagerComponent.coordinateOrder == true) {
	    		var destX = (eventData.clientX - $("#map-scroll").position().left) * Map.UniverseSize;
	    		var destY = (eventData.clientY - $("#map-scroll").position().top) * Map.UniverseSize;
	    			    		
	    		ClickManagerComponent.coordinateOrder = false;
	    		
	    		OrderComponent.setCoordinates([destX, destY, 0]);
	    		//OrderComponent.coordinates = [destX, destY, 0];
	    		//OrderComponent.updateOrder(ClickManagerComponent.orderType);
	    		
	    		ClickManagerComponent.orderType = null;
	    		
	    		//alert("You have sent your ship on location.")
	    		
	    		//shippos = SystemObjectComponent.objects[OrderComponent.objid].Position;
	    		//var originPos = SpacePostoPixel(shippos.x, shippos.y);
	    		var shippos = Map.getShipPosition(OrderComponent.objid);
	    		var destpos = {'x': destX, 'y': destY};
	    		
	    		Map.drawpath(OrderComponent.objid, shippos, destpos);

    		}
    		else if(WindowManagerComponent.registeredWindow() == "#order-menu") {
    			WindowManagerComponent.removeObject();
    		}
    	};
    	ClickManagerClass.prototype.objectClicked = function(id) {
    		console.log("PLANET CLICKED");
    		ClickManagerComponent.coordinateOrder = false;
    		var objPos = SystemObjectComponent.objects[id].Position
    		
    		OrderComponent.setCoordinates([objPos.x, objPos.y, 0]);
    		//alert("#map-canvas #"+id);
    		
    		/*
    		var objT = $("#map-canvas").children("#"+id).position().top + 25;
    		var objL = $("#map-canvas").children("#"+id).position().left + 50;
    		var destX = (objL - $("#map-canvas").position().left) * Map.UniverseSize;
    		var destY = (objT - $("#map-canvas").position().top) * Map.UniverseSize;
    		var objDest = SystemObjectComponent.objects[id].Position;
    		console.log("x" + destX + "y" + destY);
    		console.log(objDest.x + " " + objDest.y);*/
    		
    		//OrderComponent.updateOrder(ClickManagerComponent.orderType);
    		
    		ClickManagerComponent.orderType = null;
    		
    		var shippos = SystemObjectComponent.objects[OrderComponent.objid].Position;
    		var objdest = SystemObjectComponent.objects[id].Position;
    		
    		//var originPos = SpacePostoPixel(shippos.x, shippos.y);
    		//var destpos = SpacePostoPixel(objdest.x, objdest.y);
    		
    		Map.drawpath(OrderComponent.objid, shippos, objdest);
    		
    		
    		//alert(SystemObjectComponent.objects[id].Position.x);
    		
    	};
    	ClickManagerClass.prototype.setCoordinateOrder = function() {
    		ClickManagerComponent.coordinateOrder = true;
    		//Map.viewport.css("cursor:crosshair")
    	};
    	ClickManagerClass.prototype.getCoordinateOrder = function() {
    		return ClickManagerComponent.coordinateOrder;
    	};
    	ClickManagerClass.prototype.removeCoordinateCommand = function() {
    		ClickManagerComponent.coordinateOrder = false;
    	};
    	
    	return new ClickManagerClass();
    })();
    
    /*
     * Window Manager
     * 
     * Manages what dialog is currently displayed. THe mediator when anywhere on the mapdiv is clicked
     * 
     */
    var WindowManagerComponent = ( function() {
    	
    	var WindowManagerClass = function(){};
    	
    	var displayedObjectName = ""; //Must be #idname
    	
    	WindowManagerClass.prototype.removeObject = function() {
    		if(displayedObjectName != "") {
    			$(displayedObjectName).remove();
    			displayedObjectName = "";
    		}
    	};
    	WindowManagerClass.prototype.registerObject = function(objectName) {
    		WindowManagerComponent.removeObject();
    		displayedObjectName = objectName;
    	};
    	WindowManagerClass.prototype.registeredWindow = function() {
    		return displayedObjectName;
    	}
    	
    	return new WindowManagerClass();
    })();
	
    Manager.prototype.Click = ClickManagerComponent;
    Manager.prototype.Window = WindowManagerComponent;
    
    return new Manager();
	
}) ();

