/**
     * Object component
     * Handles all object business
     */
ObjectClass = (function() {
	
	function constructDOMObject(objID, pos) {
		
		var obj = ObjectClass.objects[objID];
	
		var id = obj.id;
		var type = obj.type.name.toLowerCase().replace(" ", "");
		var name = obj.name;
		var image = obj.Media;
		var icon = obj.Icon;
		var children = obj.contains;
		
		
		var $parentContainer = $(document.createElement("div"))
			.attr("id", obj.id)
			.addClass("container");
		
		var $objContainer = $(document.createElement("div"));
		$objContainer.attr("id", obj.id)
			 		 .addClass(type);
		
		$parentContainer.append($objContainer);
		
		if(pos != undefined) {
			
			var top = pos.y + "px";
			var left = pos.x + "px";
			
			$parentContainer.css({'top': top, 'left': left});
		}
		
		var $objImg = $(document.createElement("img"))
			$objImg.attr({"id": id, "src": image})
				   .addClass("mapsystem");
		
		var $objIcon = $(document.createElement("img"))
			$objIcon.attr({"id": id, "src": icon})
					.addClass("icon");
		
		var $objText = $(document.createElement("span"));
		$objText.attr("id", id)
				.addClass("name")
				.text(name);
		
		if(obj.Owner != undefined) {
			if(obj.Owner == UserInterface.username) {
				$objContainer.addClass('owned');
				//$objImg.addClass('owned');
				//$objText.addClass('owned');
			} else if(obj.Owner.length > 0) {
				$objContainer.addClass('enemy');
				//$objImg.addClass('enemy');
				//$objText.addClass('enemy');
			}
		}
		
		$objContainer.append($objImg).append($objIcon).append($objText);
		
		//Apply orders menu to rightclick and info panel to leftclick of children elements
	    $objContainer.bind("contextmenu",function(eventData){
	    	TaskManager.Click.launchOrderMenu(eventData, $(this));
	    	
	    	//cancel the default context menu
	        return false;
	    }).bind("click", function(eventData) {
	    	
	       	TaskManager.Click.launchInfoComponent($(this).attr('id'));

		});
		
		
		if(children.length > 0) {
			
			var $childUL = $(document.createElement("ul"))
							.addClass("tree-list");
			
			for(var i in children) {
				
				var childID = children[i];
			
				var $childLI = $(document.createElement("li"))
								.append(constructDOMObject(childID));
				
				$childUL.append($childLI);
				
			}
			
			$parentContainer.append($childUL);
			
		}
			 
		return $parentContainer;
		
		
	};
	
	
	var ObjectComponent = function(){};
	ObjectComponent.prototype.objects = null;
		
	/**
     * Setup object component
     */
	ObjectComponent.prototype.setup = function(data){
		ObjectClass.objects = data;		
		console.log(data);
	}
	
	/**
	 * Constructs DOM object with children
	 */
	ObjectComponent.prototype.constructDOMSystem = function(objID, pos) {
		
		var $obj = constructDOMObject(objID, pos);
		
		if($obj.children("ul").length) {
			$obj.hover(
		    		function() {
		    			$(this).addClass("hover");
		    			Map.hideSystemTitles($(this).attr("id"));
		    		}, 
		    		function() {
		    			$(this).removeClass("hover");
		    			Map.showSystemTitles();
		    		}
		    	);
		}
		
		return $obj;
		
		
	} 
	
	return new ObjectComponent();
	
})();

	
   
    /**
     * System object component
     * Handles all the panel for system objects in a system when the system is rolled over on the map
     */
    var SystemObjectComponent = (function() {
        var SystemObjectComponentClass = function(){};

        // List of all objects
        SystemObjectComponentClass.prototype.objects = null;
        SystemObjectComponentClass.prototype.displaySubPanel = false;
        SystemObjectComponentClass.prototype.currentId = -1;
        //SystemObjectComponentClass.prototype.overSubPanel = false;
        /**
         * Setup object component
         */
        SystemObjectComponentClass.prototype.setup = function(data) {
            SystemObjectComponent.objects = data;
        };
                
        SystemObjectComponentClass.prototype.hideSystemTitles = function(id) {
        	$('.name').css({'color': 'black', 'zindex': '99'});
        	$('#map-canvas #'+id+' .name').css({'color':'white'});
        };
        SystemObjectComponentClass.prototype.showSystemTitles = function() {
        	$('.name').css('color', 'white');
        };
        SystemObjectComponentClass.prototype.hideObjects = function() {
        	SystemObjectComponent.displayPanel = false;
	    	SystemObjectComponent.currentId = 0;
	    	$('#system-planet-panel').remove();
	    	SystemObjectComponent.showSystemTitles();
        };
        /**
         * Event: MouseOver
         */
        SystemObjectComponentClass.prototype.showObjects = function(systemobject) {
        	/*
        	if(SystemObjectComponent.displayPanel == true && SystemObjectComponent.currentId != -1) 
        		id = SystemObjectComponent.currentId;
        	else 
        		id = parseInt(systemobject.attr('id'));
        	
		    object = SystemObjectComponent.objects[id];
		    
		    if((object != undefined && !isNaN(id) && parseInt(object.contains.length) > 0)) {
		    	$('#system-planet-panel').remove(); 
		    	SystemObjectComponent.displayPanel = true;
		    	SystemObjectComponent.currentId = id;
		    	
			    var infoComp = $(document.createElement("div")).attr('id', 'system-planet-panel').css('z-index', '300');
			    
			    var dl = $(document.createElement("dl"));
			    infoComp.append(dl);			
			    
				ul = $(document.createElement('ul')).addClass('tree-list');
				for(var i in object.contains) {
				    toplevel = SystemObjectComponent.objects[object.contains[i]];
				    li = $(document.createElement('li')).addClass(toplevel.type.name.toLowerCase().replace(" ", ""));
				    
				    container = $(document.createElement('div')).attr({"id": toplevel.id, "parent": object.id});
				    
				    if(toplevel.Owner == UserInterface.username) {
				    	container.addClass('owned');
				    } else if(toplevel.Owner.length  > 1) {
				    	container.addClass('enemy');
				    }
				    
				    img = $(document.createElement('img'));
				    img.attr('src', toplevel.Media);
				    
				    text = $(document.createElement('p')).text(toplevel.name);
				    ul.append(li.append(container.append(img).append(text)));
				    if(toplevel.contains.length > 0) {
						subul = $(document.createElement('ul')).addClass('tree-list');
						li.append(subul);
						for(var j in toplevel.contains) {
						    sublevel = SystemObjectComponent.objects[toplevel.contains[j]];
						    
						    subli = $(document.createElement('li')).addClass(toplevel.type.name.toLowerCase().replace(" ", ""));
						    subcontainer = $(document.createElement('div')).attr({"id": sublevel.id, "parent": toplevel.id});
						    
						    if(sublevel.Owner == UserInterface.username) {
						    	subcontainer.addClass('owned');
						    } else if(sublevel.Owner.length  > 1) {
						    	subcontainer.addClass('enemy');
						    }
						    
						    img = $(document.createElement('img')).attr('src', sublevel.Media);
						    text = $(document.createElement('p')).text(sublevel.name);
						    subul.append(subli.append(subcontainer.append(img).append(text)));
						}
				    }
				}
				dl.append(ul);
				
				$('#map-canvas').children('#'+id).append(infoComp).css('z-index', '200');
				SystemObjectComponent.hideSystemTitles(id);

	            //Apply orders menu to rightclick and info panel to leftclick of children elements
	    	    $('#system-planet-panel li div').bind("contextmenu",function(eventData){
	    	    	TaskManager.Click.launchOrderMenu(eventData, $(this));
	    	    	
	    	    	//cancel the default context menu
	    	        return false;
	    	    }).click(function(eventData) {
	    	    	TaskManager.Click.launchInfoComponent($(this).attr('id'));

	    		  });
		    }		    
        	*/
        };
        

        return new SystemObjectComponentClass();
    } )();