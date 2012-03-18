
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
    		if(ClickManagerComponent.coordinateOrder == true)
    			ClickManagerComponent.objectClicked(id);
    		else {
    			if(ClickManagerComponent.clickObjectDisabled != parseInt(id)) {
    				  WindowClass.InfoWindow.onItemClick(id);
    			}
    		}
    	};
    	ClickManagerClass.prototype.launchOrderMenu = function(eventData, cssobject) {
    		if(ClickManagerComponent.coordinateOrder == true)
    			ClickManagerComponent.objectClicked(id);
    		else {
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
    		if(ClickManagerComponent.coordinateOrder == true) {
	    		var destX = (eventData.clientX - $("#map-scroll").position().left) * Map.UniverseSize;
	    		var destY = (eventData.clientY - $("#map-scroll").position().top) * Map.UniverseSize;
	    		
	    		ClickManagerComponent.coordinateOrder = false;
	    		
	    		OrderComponent.coordinates = [destX, destY, 0];
	    		OrderComponent.updateOrder(ClickManagerComponent.orderType);
	    		
	    		ClickManagerComponent.orderType = null;
	    		
	    		alert("You have sent your ship on location.")
	    		
	    		shippos = SystemObjectComponent.objects[OrderComponent.objid].Position;
	    		var originPos = SpacePostoPixel(shippos.x, shippos.y);
	    		var destpos = {'x': destX, 'y': destY};
	    		
	    		Map.drawpath(OrderComponent.objid, originPos, destpos);

    		}
    		else if(WindowManagerComponent.registeredWindow() == "#order-menu") {
    			WindowManagerComponent.removeObject();
    		}
    	};
    	ClickManagerClass.prototype.objectClicked = function(id) {
    		ClickManagerComponent.coordinateOrder = false;
    		var objPos = SystemObjectComponent.objects[id].Position
    		OrderComponent.coordinates = [objPos.x, objPos.y, 0];
    		
    		OrderComponent.updateOrder(ClickManagerComponent.orderType);
    		
    		ClickManagerComponent.orderType = null;
    		
    		shippos = SystemObjectComponent.objects[OrderComponent.objid].Position;
    		objdest = SystemObjectComponent.objects[id].Position;
    		var originPos = SpacePostoPixel(shippos.x, shippos.y);
    		var destpos = SpacePostoPixel(objdest.x, objdest.y);
    		
    		Map.drawpath(OrderComponent.objid, originPos, destpos);
    		
    		
    		//alert(SystemObjectComponent.objects[id].Position.x);
    		
    	};
    	ClickManagerClass.prototype.setCoordinateOrder = function() {
    		ClickManagerComponent.coordinateOrder = true;
    	};
    	ClickManagerClass.prototype.getCoordinateOrder = function() {
    		return ClickManagerComponent.coordinateOrder;
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

