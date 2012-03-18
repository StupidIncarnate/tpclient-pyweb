/**
     * Object component
     * Handles all object business
     */
    var ObjectComponent = (function() {
        var ObjectComponentClass = function(){};

        // List of all objects
        ObjectComponentClass.prototype.objects = null;

        /**
         * Setup object component
         */
        ObjectComponentClass.prototype.setup = function(data) {
            ObjectComponent.objects = data
        };
        
           
        /**
         * Event: onMapClick
         */
        
        /*
        ObjectComponentClass.prototype.onMapClick = function(eventData) {
            id = parseInt(eventData.target.id);
            object = ObjectComponent.objects[id];
            infoComponent = $("#info-component-content").html("");
            h4 = $(document.createElement("h4")).text(object.name).addClass("icon").css("background-image", "url("+object.Icon+")");
            dl = $(document.createElement("dl"));
            infoComponent.append(h4).append(dl);
            if(object != undefined) {
	            for(key in object){
	            	if (key != "contains" && key != "Order Queue" && key != "name" && key != "Icon") {
		            	dt = $(document.createElement('dt')).text(key);
		                if(key == 'parent') {
		                    o = ObjectComponent.objects[object[key]];
		                    if(o.id > 0) {
		                    	h4 = $(document.createElement("h4")).addClass("icon").css("background-image", "url("+o.Icon+")");
		                        a = $(document.createElement('a')).attr({'href': '#info/' + o.id, 'id': o.id}).text(o.name);
		                        a.one('click', ObjectComponent.onMapClick);
		                        dd = $(document.createElement('dd')).append(h4.append(a));
		                    } else {
		                        dd = $(document.createElement('dd')).text(o.name);
		                    }
		                } else {
		                    if(object[key].length == 0) {
		                        dd = $(document.createElement('dd')).text('-');
		                    } else {
		                    	var objText = object[key].toString();
		                    	//Checks if the thing has an image
		                    	if(objText.substring(0,4) == "http"){
		                    		dd = $(document.createElement('dd')).html("<img src=\""+ objText +"\">");
		                    	} else if(typeof object[key] == "object") {
		                    		var text = "";
		                    		for(vars in object[key]){
		                    			text += vars.toUpperCase() + ": " + object[key][vars] + ", ";
		                    		}
		                    		dd = $(document.createElement('dd')).text(text);
		                    	} else {
		                    		dd = $(document.createElement('dd')).text(objText);
		                    	}
		                    }
		                }
		                dl.append(dt).append(dd);
	            	}
	            	
	            }
	            
	            // What objects are contained inside this object
	            if(object.contains.length > 0) {
	                dt = $(document.createElement('dt')).text('Contains');
	                dd = $(document.createElement('dd'));
	                ul = $(document.createElement('ul')).addClass('tree-list');
	                for(var i in object.contains) {
	                    toplevel = ObjectComponent.objects[object.contains[i]];
	                    li = $(document.createElement('li')).addClass("icon").css("background-image", "url("+toplevel.Icon+")");
	                    a = $(document.createElement('a')).attr({'href': '#info/' + toplevel.id, 'id': toplevel.id})
	                        .addClass(toplevel.type.name.toLowerCase().replace(" ", "")).text(toplevel.name).one('click', ObjectComponent.onMapClick);
	                    ul.append(li.append(a));
	                    if(toplevel.contains.length > 0) {
	                        subul = $(document.createElement('ul'));
	                        li.append(subul);
	                        for(var j in toplevel.contains) {
	                            sublevel = ObjectComponent.objects[toplevel.contains[j]];
	                            subli = $(document.createElement('li')).addClass("icon").css("background-image", "url("+sublevel.Icon+")");
	                            a = $(document.createElement('a')).attr({'href': '#info/' + sublevel.id, 'id': sublevel.id}).text(sublevel.name)
	                                .addClass(sublevel.type.name.toLowerCase().replace(" ", "")).one('click', ObjectComponent.onMapClick);
	                            subul.append(subli.append(a));
	                        }
	                    }
	                }
	                dl.append(dt).append(dd.append(ul));
	            }
            }
            
            return false;
        };*/

        return new ObjectComponentClass();
    } )();
    
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
        	if(SystemObjectComponent.displayPanel == true && SystemObjectComponent.currentId != -1) 
        		id = SystemObjectComponent.currentId;
        	else 
        		id = parseInt(systemobject.attr('id'));
        	
		    object = SystemObjectComponent.objects[id];
		    
		    if((object != undefined && !isNaN(id) && parseInt(object.contains.length) > 0)) {
		    	$('#system-planet-panel').remove(); 
		    	SystemObjectComponent.displayPanel = true;
		    	SystemObjectComponent.currentId = id;
		    	
		    	/*posX = systemobject.position().left;
		    	posY = systemobject.position().top;
			    */
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
        	
        };
        

        return new SystemObjectComponentClass();
    } )();