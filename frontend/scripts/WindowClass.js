

WindowClass = (function() {
	
	var Components = function() {};
	/**
     * System component
     *
     * A list of objects in the universe, searchable.
     */
    var SystemComponent = ( function() {
        var SystemComponent = function(){};

        var systemElement = null;
        var searchString = '';
        var searchActive = false;

        // Helper method, recursivly create the list of objects
        var createList = function(object, ul, match) {
            for(var i in object.contains) {
                var temp = SystemComponent.objects[object.contains[i]];
                var queueid = 0;
                if(temp["Order Queue"] != undefined && temp["Order Queue"]["queueid"] != undefined) {
                	queueid = temp["Order Queue"]["queueid"];
                }
                if(match) {
                    if(temp.name.toLowerCase().indexOf(match) == 0) {
                    	ul.append(
                            $(document.createElement('li')).addClass("icon").css("background-image", "url("+temp.Icon+")").append(
                                $(document.createElement('a'))
                                    .attr({'href': '#info/'+temp.id, 'id': temp.id, 'queueid': queueid})
                                    .addClass(temp.type.name.toLowerCase().split(' ').join(''))
                                    .text(temp.name)
                            )
                        );
                    }
                    if(temp.contains.length > 0) {
                        createList(temp, ul, match);
                    }
                } else {
                    li = $(document.createElement('li')).addClass("icon").css("background-image", "url("+temp.Icon+")");
                    a = $(document.createElement('a'))
		                    .attr({'href': '#info/'+temp.id, 'id': temp.id, 'queueid': queueid})
		                    .addClass(temp.type.name.toLowerCase().split(' ').join(''))
		                    .text(temp.name);
                    
                    if(temp.Owner != undefined) {
	                    if(temp.Owner == UserInterface.username) {
	    			    	a.addClass('owned');
	    			    } else if(temp.Owner.length  > 1) {
	    			    	a.addClass('enemy');
	    			    }
                    }
                    
                    ul.append(li.append(a));

                    if(temp.contains.length > 0) {
                        subul = $(document.createElement('ul'));
                        li.append(subul);
                        createList(temp, subul, match);
                    }
                    
                }
                
            }
        };

        /**
         * Event: onResize
         *
         * Updates the height of the component on resize events.
         */
        /*
        var onResize = function(e) {
            $('#system-component').css('height', jQuery(window).height() - jQuery('#overlay-content').offset().top);
            $('#system-component-content').css('height', jQuery(window).height() - jQuery('#overlay-content').offset().top - 30);
        };*/


        /**
         * Event: onSearch
         *
         * Search through all objects that match text in search input field
         * TODO: Needs optimization, if you write fast you still get lots of searches where one only is needed
         */
        var onSearch = function(e) {
            searchString = $('#system-component-search input').attr('value');
            if(searchString.length > 0) {
                searchActive = true;
            }
            if(searchActive) {
                $('#system-bar-text a').unbind('click');
                $('#system-component-text').html('');
                ul = $(document.createElement('ul')).addClass('tree-list');
                createList(ObjectClass.objects[0], ul, searchString.toLowerCase());
                $('a', ul).bind('click', function(eventData) {
                	//Tells the info panel not to load panel above system panel
                	eventData.clickThrough = "sysPanel";
                	
                	InfoComponent.onItemClick($(this).attr('id'));
                	//ObjectClass.onMapClick(eventData);
                    OrderComponent.onMapClick(eventData);
                });
                $('#system-component-text').append(ul);
            }
            if(searchString.length <= 0 && searchActive == true) {
                searchActive = false;
            }
        };

        SystemComponent.prototype.setup = function(objects) {

            // Remove previous system component
            if(systemElement) {
                systemElement.remove();
            }

            //$(window).bind('resize', onResize);

            SystemComponent.objects = objects;
            var system = $('system-bar');

            var systemsearch = $(document.createElement('div')).attr('id', 'system-component-search');
            var input = $(document.createElement('input')).attr({'id': 'system-search-input', 'type': 'text'});
            input.bind('keyup', onSearch);
            systemsearch.append(input);

            /*var systemcontent = $(document.createElement('div')).attr('id', 'system-bar-text').css({
                'height': (jQuery(window).height() - jQuery('#overlay-content').offset().top) - 30});*/
            var systemcontent = $(document.createElement('div')).attr('id', 'system-component-text');

            ul = $(document.createElement('ul')).addClass('tree-list');
            createList(objects[0], ul);
            $('a', ul).bind("contextmenu",function(eventData){
            	
				  TaskManager.Click.launchOrderMenu(eventData, $(this));
  				  
				  	//cancel the default context menu
			        return false;
			   }).bind('click', function(eventData) {
				   TaskManager.Click.launchInfoComponent($(this).attr('id'));
            });
            
            //$('#overlay-content').append(system.append(systemsearch, systemcontent.append(ul)));
            
            systemcontent.append(ul);
            systemtext = $('#system-bar-text');
            systemtext.empty().append(systemsearch, systemcontent.append(ul));
            
            //Apply a custom scroll to the component
            systemtext.jScrollPane({scrollbarWidth:28, dragMinHeight:25, dragMaxHeight:25});
            
            /*
            // Make it resizable
            $('#system-component').resizable({
                handles: 'w,n,e,s',
                maxWidth: 400,
                maxHeight: jQuery(window).height() - jQuery('#overlay-content').offset().top,
                minWidth: 200,
                minHeight: jQuery(window).height() - jQuery('#overlay-content').offset().top
            });
			*/
            // Store this system component
            systemElement = system;
        };
        
        return new SystemComponent();
    } )();
    
    /**
     * Message component
     */
    var MessageComponent = ( function() {
        
        var messages = null;
        var messageNumber = 0;
        var messageBodyElement = null;
        
        var MessageComponentClass = function(){};

        MessageComponentClass.prototype.setup = function(data) {
            messages = data;
            var panelText = "";
            var turn = null;
            for(i in messages[0].messages) {
            	message = messages[0].messages[i]
            	if(message.turn != turn) {
            		turn = message.turn;
            		panelText += "<br><br>Turn " + turn;
            	}
            	panelText += "<br>" + message.body;
            }
            messageBodyElement = $(document.createElement('p')).append(panelText); 
            	
            $('#message-bar-text').empty().append(messageBodyElement);
            
            //Apply a custom scroll to the component
            $('#message-bar-text').jScrollPane({scrollbarWidth:28, dragMinHeight:25, dragMaxHeight:25});
            
        };
        

        return new MessageComponentClass();

    } )();
    
 
    var InfoComponent = ( function() {
    	var InfoComponentClass = function(){};
    	
    	InfoComponentClass.prototype.objects = null;
    	InfoComponentClass.prototype.id = null;
    	
    	/*
    	 * Setup the information panel
    	 */
    	InfoComponentClass.prototype.setup = function(data) {
    		InfoComponentClass.prototype.objects = data;	
    		
    	};
    	/*
    	 * Construct the base component. The order portion also uses this panel.
    	 * 
    	 * windowName is the css tag name, without a # before it.
    	 */
    	InfoComponentClass.prototype.constructBase = function(windowName) {
    		TaskManager.Window.registerObject("#"+windowName);
    		
    		panel = $(document.createElement("div")).attr('id', windowName);
    		$('#overlay').append(panel)
    		
    		closebutton = $(document.createElement("div")).attr('id', 'closebutton');
			a = $(document.createElement('a')).one("click",function(eventData){
				TaskManager.Window.removeObject();
			});
			closebutton.append(a.append($(document.createElement("img")).attr('src', 'images/close.png')));
			
			panel.append(closebutton);
			
		    posTop = 5;
			posLeft = ($(window).width() / 2) - (panel.width() / 2);
			
			if(posLeft < 0)
				posLeft = 0;
			
			panel.css("display", "inline").css("top", posTop+"px").css("left", posLeft+"px");
			
			return panel;
    	};
    	
    	/*
    	 * Event: onItemClick
    	 */
    	InfoComponentClass.prototype.onItemClick = function(id) {
    		id = parseInt(id);
    		if(InfoComponent.objects[id] == undefined) {
    			TaskManager.Window.removeObject();
    		}
    		else if(InfoComponent.objects[id] != undefined) {
    			InfoComponent.id = id;
                
    			infopanel = this.constructBase("info-panel");
    			
    			object = InfoComponent.objects[id];
    			
                infoComponent = $(document.createElement("div")).attr('id', 'info-panel-text');
                
                h4 = $(document.createElement("h4")).attr("id", "planet-title").text(object.name);
                
                mediadiv = $(document.createElement("div")).attr("id", "planet-media").html("<img src=\""+ object.Media.toString() +"\">");
                ordersdiv = OrderComponent.currentOrderList(id);
                leftdiv = $(document.createElement("div")).attr("id", "leftcolumn").append(mediadiv).append(ordersdiv);
                
                dl = $(document.createElement("dl")).attr("id", "info-tree");
                
                infopanel.append(infoComponent.append(h4).append(leftdiv).append(dl));
                
                if(object != undefined) {
    	            for(key in object){
    	            	if (key != "contains" && key != "Order Queue" && key != "name" && key != "Icon" && key != "Media" && key != "parent") {
    		            	dt = $(document.createElement('dt')).text(key);
    		                
		                    if(object[key].length == 0) {
		                        dd = $(document.createElement('dd')).text('-');
		                    } else {
		                    	var objText = object[key].toString();
		                    	//Checks if the thing has an image
		                    	if(objText.substring(0,4) == "http"){
		                    		dd = $(document.createElement('dd')).html("<img src=\""+ objText +"\">");
		                    	} else if(typeof object[key] == "object") {
		                    		var text = "";
		                    		
		                    		if(key == "Ship List") {
		                    			for(ships in object[key]){	
	                    					text += object[key][ships][0] + ": " + object[key][ships][1] + ", <br />" 
	                    					//alert (ship +  " "+ object[key][ships])
	                    					//text += object[key][ships]
		                    				
		                    			}
		                    		} else {
			                    		for(vars in object[key]){
			                    			text += vars.toUpperCase() + ": " + object[key][vars] + ", <br />";
			                    		}
		                    		}
		                    		
		                    		dd = $(document.createElement('dd')).html(text);
		                    	} else {
		                    		dd = $(document.createElement('dd')).text(objText);
		                    	}
		                    }
    		                
    		                dl.append(dt).append(dd);
    	            	}
    	            	
    	            }
    	            
                }
                //Apply a custom scroll to the component
                infoComponent.jScrollPane({scrollbarWidth:28, dragMinHeight:25, dragMaxHeight:25});
    		}
    		
    	};
    	
    	
    	return new InfoComponentClass();
    } )();
    
    Components.prototype.SystemMenu = SystemComponent;
    Components.prototype.MessageMenu = MessageComponent;
    Components.prototype.InfoWindow = InfoComponent;
    
    return new Components();
    
}) ();