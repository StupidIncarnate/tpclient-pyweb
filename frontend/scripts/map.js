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
                    MapCreator.prototype.drawCoordinatePath = function(object, pixelPos) {
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
                    }
                    this.drawobject(pixelPos, system.id, system.name, system.type.name, system.Media);
                    
                }
                
            }            
            
        }
    };
    
    MapCreator.prototype.drawobject = function(pos, id, name, type, image, destPos) {
    	//alert(pos.x + " " + pos.y);
    	type = type.toLowerCase().replace(" ", "");
    	
    	//Shift the icons so they're directly over they're coodinate point 
    	var shiftedX = pos.x - 50;
    	var shiftedY = pos.y - 25;
    	
    	var container = $(document.createElement('div')).attr('id', id).attr('class', type + " container").css({'top': shiftedY+'px', 'left': shiftedX+'px', 'width': '100px'});
    	this.canvas.append(container);
    	var objectdiv = $(document.createElement('div'));
    	objectdiv.attr('class', 'mapsystem').attr('id', id);
    	
    	var objectIcon = $(document.createElement('img')).attr('src', image);
    	
    	var objectText = $(document.createElement('div'));
    	objectText.attr('class', 'name').attr('id', id);
    	objectText.text(name);
    	container.append(objectdiv.append(objectIcon).append(objectText));    	
    	
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
    
    
    return new MapCreator();
} )();

/**
 * User Interface
 *
 * A container for all User Interface functionality
 */
UserInterface = ( function() {
    /**
     * User Interface Lock
     *
     * Creates a div elemenet over the whole screen making it impossible to
     * click on any elements below the ui lock.
     */
    var UILock = ( function() {
        
        var UILockClass = function(){};

        var active = false;

        UILockClass.prototype.create = function() {
            if(active === false) {
                this.lock = $(document.createElement('div')).attr('id', 'uilock').addClass('transparent');
                this.content = $(document.createElement('div')).attr('id', 'uilock-content');
                $("body").append(this.lock).append(this.content);
                active = true;
            }
            return this;
        };

        UILockClass.prototype.clear = function(e) {
            if(this.lock) { this.lock.remove(); }
            if(this.content) { this.content.remove(); }
            active = false;
        };

        UILockClass.prototype.text = function(text, remove) {
            if(active === false) {
                this.create();
            }
            if(remove === true) {
                this.lock.one("click", function(e) { UILock.clear(); });
                this.content.one("click", function(e) { UILock.clear(); });
                text = text + " Click anywhere to go back.";
            }
            this.content.html(text);
        };

        UILockClass.prototype.error = function(error, remove) {
            this.content.attr('class', 'error');
            this.text(error, remove);
        };

        UILockClass.prototype.notice = function(notice, remove) {
            this.content.attr('class', 'notice');
            this.text(notice, remove);
        };
        return new UILockClass();
    } )();


    /**
     * End of Turn Handler
     */
    var TurnHandler = ( function() {
        var TurnHandler = function(){};
        var timeleft = 0;
        TurnHandler.prototype.setup = function(time, turn) {
            timeleft = parseInt(time);
            $("#turn-component").html('Turn <span class="turn">'+turn+'</span> will end in <span class="timeleft">'+timeleft+'</span> s');

            $(window).stopTime("turntimer");
            $(window).oneTime(timeleft * 1000, "turntimer", function() {
                NotifyComponent.notify('Started downloading the Universe', 'Universe');
                UserInterface.cache_update(function() {
                    NotifyComponent.notify('Finished downloading the Universe, click here to reload the UI', 'Universe', function() {
                        UserInterface.drawUI();   
                    });
                });
            });
            $(window).everyTime("1s", "turntimer", function() {
                $("#turn-component .timeleft").text(--timeleft);
            }, timeleft);
        };
        return new TurnHandler();
    } )();


    /**
     * Notify component
     *
     * Notify the users of actions running in the background.
     */
    var NotifyComponent = ( function() {

        var rows = 0;
        var notify = null;

        var NotifyComponentClass = function(){};

        NotifyComponentClass.prototype.notify = function(text, category, callback) {
            var date = new Date();
            var hours = date.getHours();
            var mins = date.getMinutes();
            if(mins < 10) {
                mins = '0' + mins;
            }

            if(!callback) {
                var callback = function(){};
            }

            notify.append($(document.createElement('div')).one('click', callback).append(
                $(document.createElement('span')).addClass('category').text(hours + ':' + mins + ' ' + category),
                $(document.createElement('span')).addClass('text').text(text)
            ));

            rows++;
            if(rows >= 4) {
                notify.find('div:first').animate({'margin-top': '-18px'}, 600, function() { $(this).remove(); });
                rows = 3;
            }
        };

        NotifyComponentClass.prototype.setup = function() {
            notify = $(document.createElement('div')).attr('id', 'notify-component');
            $('body').append(notify);
        };

        return new NotifyComponentClass();
    } )();
    
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
    				  InfoComponent.onItemClick(id);
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
                createList(ObjectComponent.objects[0], ul, searchString.toLowerCase());
                $('a', ul).bind('click', function(eventData) {
                	//Tells the info panel not to load panel above system panel
                	eventData.clickThrough = "sysPanel";
                	
                	InfoComponent.onItemClick($(this).attr('id'));
                	//ObjectComponent.onMapClick(eventData);
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
            	
				  ClickManagerComponent.launchOrderMenu(eventData, $(this));
  				  
				  	//cancel the default context menu
			        return false;
			   }).bind('click', function(eventData) {
				   ClickManagerComponent.launchInfoComponent($(this).attr('id'));
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
     * Login handler
     */
    var login = function(e) {
        UILock.create().notice('Please wait while connecting to host <img src="/images/loading.gif" />');

        var host = $("input[name='tphost']", this).val();
        var user = $("input[name='tpuser']", this).val();
        var pass = $("input[name='tppass']", this).val();
        
        UserInterface.username = user;
        
        if(host == '' || user == '' || pass == '') {
            UILock.error('No empty fields are allowed.', true);
        } else {
            $.ajax({type: "POST", dataType: 'json', data: {'host': host, 'user': user, 'pass': pass}, url: "/json/login/", 
                error: function(req, textstatus) { 
                    UILock.error('Something went wrong, contact administrator or try again later.', true);
                }, 
                success: function(data, textstatus) { 
                    if(data.auth === true) {
                        UILock.notice('Please wait while loading user interface <img src="/images/loading.gif" /><br>Orclick here to log out.');
								
                        UserInterface.cache_update(function(data) {
                            UserInterface.drawUI();
                        });
                    } else {
                        UILock.error(data.error, true);
                    }
                }
            });
        }
        return false;
    };

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

    /**
     * Order component
     */
    var OrderComponent = (function() {

        /**
         * Inline class: object argument panel
         * Old
         */
        function ObjectArgumentPanel() {
            this.object = null;
            this.order_type = null;

            this.build = function(order_type, orderpanel) {
                this.order_type = order_type;
                
                if(this.order_type.value != null) {
                    var value = this.order_type.value[0];
                } else {
                    var value = -1;
                }
                this.object = $(document.createElement('select'));
                for(var i in ObjectComponent.objects) {
                    if(ObjectComponent.objects[i].id == value) {
                        this.object.append($(document.createElement('option')).attr({'selected': 'selected', 'value': ObjectComponent.objects[i].id}));
                    } else {
                        this.object.append($(document.createElement('option')).attr({'value': ObjectComponent.objects[i].id}));
                    }
                }
                orderpanel.append(this.order_type.name, this.order_type.description, this.object);
            };

            this.getValue = function() {
                return array2json([parseInt(this.object.val())]);
            };
        };

        /**
         * Inline class: list argument panel
         * Old
         */
        function ListArgumentPanel() {
            this.order_type = null;
            this.type = null;

            this.buildSelect = function(type) {
                this.type = type;

                var optionsElement = $(document.createElement('select'));
                for(var i in this.__options) {
                    if(type == i) {
                        optionsElement.append($(document.createElement('option')).attr({'value': i, 'selected': 'selected'}).text(this.__options[i][0]));
                    } else {
                        optionsElement.append($(document.createElement('option')).attr({'value': i}).text(this.__options[i][0]));
                    }
                }

                this.numberElement = $(document.createElement('input')).attr({'type': 'text', 'size': 3, 'value': 1});

                // Add button
                var helper = this;
                var add = $(document.createElement('input')).attr({'type': 'submit', 'value': 'Add'}).click(function(eventData) {
                    var amount = parseInt(helper.numberElement.val());
                    if(amount <= 0) {
                        return false;
                    }

                    var type = parseInt(optionsElement.val());
                    if(helper.__selections[type] == null || helper.__selections[type] == undefined) {
                        helper.__selections[type] = 0;

                        var dt = $(document.createElement('dt')).text(amount);
                        var dd = $(document.createElement('dd')).append(
                            $(document.createElement('a')).attr({'id': type, 'href': '#'}).text(helper.__options[type][0]).click(function(eventData) {
                                $('#list-argument-panel-options').html('').append(
                                    helper.buildSelect(this.id)
                                );
                            }));
                        helper.selectionsElement.append(dt, dd);
                        helper.choices[type] = [dt, dd];
                    }

                    helper.__selections[type] = parseInt(helper.__selections[type]);
                    helper.__selections[type] += parseInt(amount);
                    helper.__selections[type] = Math.max(Math.min(helper.__selections[type], helper.__options[type][1]), 0);

                    if(helper.__selections[type] == 0) {
                        helper.__selections.splice(type, 1);
                        $(helper.choices[type][0]).remove();
                        $(helper.choices[type][1]).remove();
                    } else {
                        $(helper.choices[type][0]).text(helper.__selections[type]);
                    }
                });

                // Del button
                var del = $(document.createElement('input')).attr({'type': 'submit', 'value': 'Del'}).data('hack', this).click(function(eventData) {
                    var hack = $(this).data('hack'); 
                    $(hack.choices[hack.type][0]).remove();
                    $(hack.choices[hack.type][1]).remove();
                    hack.__selections.splice(hack.type, 1);
                });

                if(this.type == null) {
                    del.attr('disabled', 'disabled');
                }

                return $(document.createElement('div')).append(optionsElement, this.numberElement, add, del);
            };


            this.build = function(order_type, orderpanel) {
                this.order_type = order_type;

                this.choices = [];

                this.options_list = order_type.value[0];
                this.selections_list = order_type.value[1];

                var options = [];
                for(var i in this.options_list) {
                    options[this.options_list[i][0]] = [this.options_list[i][1], this.options_list[i][2]];
                }

                var selections = [];
                for(var i in this.selections_list) {
                    selections[this.selections_list[i][0]] = this.selections_list[i][1];
                }


                if(this.__options != options) {
                    this.__options = options;

                    this.optionsElement = $(document.createElement('div')).attr('id', 'list-argument-panel-options');
                    this.optionsElement.append(this.buildSelect());
                }

                if(this.__selections != selections) {
                    this.__selections = selections;

                    this.selectionsElement = $(document.createElement('dl'));
                    for(var i in selections) {
                        var dt = $(document.createElement('dt')).text(selections[i]);
                        var dd = $(document.createElement('dd')).append(
                            $(document.createElement('a')).attr({'id': i, 'href': '#'}).data('hack', this).text(options[i][0]).click(function(eventData) {
                                $('#list-argument-panel-options').html('').append(
                                    $(this).data('hack').buildSelect(this.id)
                                );
                            }));
                        this.selectionsElement.append(dt, dd);
                        this.choices[i] = [dt, dd];
                    }
                }

                orderpanel.append(
                    $(document.createElement('div')).append(this.order_type.name, this.selectionsElement, this.optionsElement)
                );
            };

            this.getValue = function() {
                var options = [];
                for(var i in this.__options) {
                    options.push([i, this.__options[i][0], this.__options[i][1]]);
                }
                var selections = [];
                for(var i in this.__selections) {
                    selections.push([i, this.__selections[i]]);
                }
                return array2json([options, selections]);
            };
        };

        /**
         * Inline class: string argument panel
         * Old
         */
        function StringArgumentPanel() {
            this.string = null;
            this.order_type = null;

            this.build = function(order_type, orderpanel) {
                this.order_type = order_type;
                
                if(this.order_type.value != null) {
                    var value = this.order_type.value[1];
                } else {
                    var value = '';
                }
                this.string = $(document.createElement('input')).attr({'type': 'text', 'value': value});
                orderpanel.append($(document.createElement('div')).append(this.order_type.name, this.string)
                );
            };

            this.getValue = function() {
                return array2json([0, this.string.val()]);
            };
        };

        /**
         * Inline class: coordinate argument panel
         * Old
         */
        function CoordinateArgumentPanel() {
        	this.order_type = null;
        	
        	this.getValue = function() {
        		return array2json(OrderComponent.coordinates);
        	}
        	this.initiateOrder = function(orderType, id) {
        		ClickManagerComponent.orderType = orderType;
        		ClickManagerComponent.setCoordinateOrder();
        	}
        	
        };

        /**
         * Inline class: time argument panel
         * Old
         */
        function TimeArgumentPanel() {
            this.time = null;
            this.order_type = null;

            this.build = function(order_type, orderpanel) {
                this.order_type = order_type;

                if(this.order_type.value != null) {
                    this.time = $(document.createElement('input')).attr({'type': 'text', 'value': this.order_type.value[0], 'size': 12});
                } else {
                    this.time = $(document.createElement('input')).attr({'type': 'text', 'value': 0, 'size': 12});
                }
                orderpanel.append(this.order_type.name, this.order_type.description, this.time);
            };

            this.getValue = function() {
                if(this.value != null) {
                    return array2json([parseInt(this.time.val()), this.order_type.value[1]]);
                } else {
                    return array2json([parseInt(this.time.val()), 1000]);
                }
            };
        };

        /**
         * Main order component
         */
        var OrderComponentClass = function(){};
        OrderComponentClass.prototype.objid = null;
        OrderComponentClass.prototype.queueid = null;
        OrderComponentClass.prototype.type = null;
        OrderComponentClass.prototype.args = null;
        OrderComponentClass.prototype.orders = null;
        
        OrderComponentClass.prototype.coordinateOrder = false;
        OrderComponentClass.prototype.coordinates = [];
        
        OrderComponentClass.prototype.setup = function(data) {
            OrderComponent.orders = data;
        };
        //old
        OrderComponentClass.prototype.updateOrder = function(order) {
            var temp = new Array();
            for(var i in this.args) {
                temp = temp.concat(this.args[i].getValue());
            }
            var order_position = OrderId2OrderPosition(OrderComponent.orders[OrderComponent.queueid].orders, order.order_id);
            $.ajax({type: "POST", dataType: 'json', data: {'action': 'create before', 'id': OrderComponent.queueid, 'type': parseInt(order.type), 'order_position': order_position, 'args': temp}, url: "/json/order/update/", 
                error: function(req, textstatus) { 
                    UILock.error('Something went wrong, contact administrator or try again later.', true);
                }, 
                success: function(data, textstatus) { 
                    if(data.auth === true) {
                        UserInterface.getOrders(function(data) {
                            OrderComponent.setup(data.orders);
                            InfoComponent.onItemClick(InfoComponent.id);
                            
                            // Add orders to map for coordinate drawing
                            Map.addOrders(data.orders);
                            
                            // Draw Map
                            Map.draw();
                            
                            //Reinstigate css event elements
                            UserInterface.initCssEvents();
                        });
                    } else {
                        UILock.error(data.error, true);
                    }
                }
            });
        };
        //Old
        OrderComponentClass.prototype.removeOrder = function(order_id) {
        	//FIX: Does not remove when send order and then press remove
        	 var order_position = OrderId2OrderPosition(OrderComponent.orders[OrderComponent.queueid].orders, order_id);
             $.ajax({type: "POST", dataType: 'json', data: {'action': 'remove', 'id': OrderComponent.queueid, 'order_position': order_position}, url: "/json/order/remove/", 
                error: function(req, textstatus) { 
                    UILock.error('Something went wrong, contact administrator or try again later.', true);
                }, 
                success: function(data, textstatus) { 
                    if(data.auth === true) {
                        UserInterface.getOrders(function(data) {
                            OrderComponent.setup(data.orders);
                            InfoComponent.onItemClick(InfoComponent.id);
                            
                            // Add orders to map for coordinate drawing
                            Map.addOrders(data.orders);
                            
                            // Draw Map
                            Map.draw();
                            
                            //Reinstigate css event elements
                            UserInterface.initCssEvents();
                            
                        });
                    } else {
                        UILock.error(data.error, true);
                    }
                }
            });          
        };
        OrderComponentClass.prototype.ascendOrder = function(order_id) {
        	var order_position = OrderId2OrderPosition(OrderComponent.orders[order_id].orders, order_id);
        	
        };
        OrderComponentClass.prototype.descendOrder = function(order_id) {
        	var order_position = OrderId2OrderPosition(OrderComponent.orders[order_id].orders, order_id);
        	
        };
        /*
        //Old
        OrderComponentClass.prototype.buildOrder = function(subid) {
            this.args = new Array();

            $('#order-component-create-order').html('').append('Create a new order: ', OrderComponent.buildOrderList());
            if(subid == null && OrderComponentClass.type != null) {
                var orderType = OrderComponent.orders[OrderComponent.queueid].order_type[OrderComponentClass.type];
            } else if(subid != null) {
            	var orderType = OrderComponent.orders[OrderComponent.queueid].orders[subid];
            } else {
                return false;
            }
            $('#order-component-create-order').append($(document.createElement('h5')).css({'margin': 0, 'padding': 0}).text(orderType.name));
            
            if(orderType != null) {
                for(var i in orderType.args) {
                    var argument = null;
                    // If argument type is coordinate, build a coordinate panel
                    if(orderType.args[i].type == 'coordinate') {
                        argument = new CoordinateArgumentPanel();
                        argument.build(orderType.args[i]);

                    // Else if argument type is time, build a time panel
                    } else if(orderType.args[i].type == 'time') {
                        argument = new TimeArgumentPanel();
                        argument.build(orderType.args[i]);

                    // Else if argument type is string, build a string panel
                    } else if(orderType.args[i].type == 'string') {
                        argument = new StringArgumentPanel();
                        argument.build(orderType.args[i]);

                    // Else if argument type is object, build a object panel
                    } else if(orderType.args[i].type == 'object') {
                        argument = new ObjectArgumentPanel();
                        argument.build(orderType.args[i]);

                    // Else if argument type is list, build a list panel
                    } else if(orderType.args[i].type == 'list') {
                        argument = new ListArgumentPanel();
                        argument.build(orderType.args[i]);
                    }

                    if(argument != null) {
                        this.args[orderType.args[i].type] = argument;
                    }
                }
            }
            
            if(subid != null) {
                update = $(document.createElement('input')).attr({'type': 'submit', 'value': 'Update Order'}).click(function(eventData) {
                    OrderComponent.updateOrder(orderType);
                    return false;
                });
                remove = $(document.createElement('input')).attr({'type': 'submit', 'value': 'Remove Order'}).click(function(eventData) {
                    OrderComponent.removeOrder(orderType.order_id);
                    return false;
                });
                $('#order-component-create-order').append(update, remove);
            }
        };*/
        /*
         * TODO: Convert this to rightlicck menu
         * Old
         */
        /*OrderComponentClass.prototype.buildOrderList = function() {
        	var counter = 0;
            select = $(document.createElement('select')).attr('id', 'order_list');
            for(var i in OrderComponent.orders[OrderComponent.queueid].order_type) {
                order_type = OrderComponent.orders[OrderComponent.queueid].order_type[i];
                option = $(document.createElement('option')).attr('value', i).text(order_type.name);
                select.append(option);
                counter++;
            }
            if(counter > 0) {
	            return $(document.createElement('div')).append(select,
	                $(document.createElement('input')).attr({'type': 'submit', 'value': 'New order'}).click(function(eventData) {
	                    OrderComponentClass.type = $('#order_list').val();
	                    var sendType = OrderComponent.orders[OrderComponent.queueid].order_type[OrderComponentClass.type].type;
	                    $.ajax({type: "POST", dataType: 'json', data: {'action': 'create before', 'id': OrderComponent.queueid, 'type': sendType}, url: "/json/order/send/", 
	                        error: function(req, textstatus) { 
	                            UILock.error('Something went wrong, contact administrator or try again later.', true);
	                        }, 
	                        success: function(data, textstatus) {
	                            if(data.auth === true) {
	                                UserInterface.getOrders(function(data_extra) {
	                                    OrderComponent.setup(data_extra.orders);
	                                    subid = OrderPosition2OrderId(OrderComponent.orders[OrderComponent.queueid].orders, data.order_position);
	                                	if(subid != undefined) { 
	                                		OrderComponent.buildOrder(subid);
	                                	}
	                                    
	                                });
	                            } else {
	                                UILock.error(data.error, true);
	                            }
	                        }
	                    });
	                }));
            }
        	return false;
        };*/
        /*
        //Old
        OrderComponentClass.prototype.onMapClick = function(eventData) {
        	var queueid = 0;
        	if(ObjectComponent.objects[eventData.target.id] != undefined &&
        			ObjectComponent.objects[eventData.target.id]["Order Queue"] != undefined && 
        			ObjectComponent.objects[eventData.target.id]["Order Queue"]["queueid"] != undefined) 
        		queueid = ObjectComponent.objects[eventData.target.id]["Order Queue"]["queueid"];
            OrderComponent.buildOrderPanel(parseInt(queueid));
        };*/
        /*
        //Old
        OrderComponentClass.prototype.buildOrderPanel = function(id) {
            // Store selected object id
            OrderComponent.queueid = id;
            
            // Reset selected order
            OrderComponentClass.type = null;

            OrderComponentClass.args = new Array();

            // Reset order component content
            orderComponent = $('#order-component-content').html('');

            // If this object has orders continue
            if(OrderComponent.queueid > 0 && OrderComponent.orders[OrderComponent.queueid]) {
                dl = $(document.createElement('dl'));
                
                OrderComponent.orders[OrderComponent.queueid]['orders'] = 
                	sortArrByKey(OrderComponent.orders[OrderComponent.queueid]['orders']);
                
                for(var i in OrderComponent.orders[OrderComponent.queueid]['orders']) {
                    var order_id = OrderComponent.orders[OrderComponent.queueid]['orders'][i].order_id;
                    order = OrderComponent.orders[OrderComponent.queueid]['orders'][i];
                    dt = $(document.createElement('dt')).text(order.turns + ' turns');
                    dd = $(document.createElement('dd')).append(
                        $(document.createElement('a')).attr({'id': order.order_id, 'href': '#'}).text(order.name).click(function(eventData) {
                        	OrderComponent.buildOrder(eventData.currentTarget.id);
                            //OrderComponent.buildOrder(eventData.currentTarget.id);
                        }),
                        $(document.createElement('br')),
                        order.description);
                    dl.append(dt).append(dd);
                }
                orderComponent.append(dl, $(document.createElement('div')).attr('id', 'order-component-create-order'));
                OrderComponent.buildOrder();
            } else {
                orderComponent.text('No orders for this object');
            }

        };*/
        OrderComponentClass.prototype.buildOrderPanel = function(subid) {
        	//Reinitiate Clicking for the object that was right-clicked
        	ClickManagerComponent.clickObjectDisabled = 0;
        	
        	this.args = new Array();
            
            if(subid == null && OrderComponentClass.type != null) {
                var orderType = OrderComponent.orders[OrderComponent.queueid].order_type[OrderComponentClass.type];
            } else if(subid != null) {
            	var orderType = OrderComponent.orders[OrderComponent.queueid].orders[subid];
            } else {
                return false;
            }

            if(orderType != null) {
            	var orderdata = $(document.createElement('div'));
            	
                for(var i in orderType.args) {
                    var argument = null;
                    
                    // If argument type is coordinate, build a coordinate panel
                    if(orderType.args[i].type == 'coordinate') {
                        argument = new CoordinateArgumentPanel();
                        argument.initiateOrder(orderType);

                    // Else if argument type is time, build a time panel
                    } else if(orderType.args[i].type == 'time') {
                        argument = new TimeArgumentPanel();
                        argument.build(orderType.args[i], orderdata);

                    // Else if argument type is string, build a string panel
                    } else if(orderType.args[i].type == 'string') {
                        argument = new StringArgumentPanel();
                        argument.build(orderType.args[i], orderdata);

                    // Else if argument type is object, build a object panel
                    } else if(orderType.args[i].type == 'object') {
                        argument = new ObjectArgumentPanel();
                        argument.build(orderType.args[i], orderdata);

                    // Else if argument type is list, build a list panel
                    } else if(orderType.args[i].type == 'list') {
                        argument = new ListArgumentPanel();
                        argument.build(orderType.args[i], orderdata);
                    }

                    if(argument != null) {
                        this.args[orderType.args[i].type] = argument;
                    }
                }
            }
            if(subid != null && ClickManagerComponent.getCoordinateOrder() != true) {
            	orderpanel = InfoComponent.constructBase("order-panel");
            	orderpanel.append($(document.createElement('h5')).css({'margin': 0, 'padding': 0}).text(orderType.name));
            	
            	orderpanel.append(orderdata);
            	
            	update = $(document.createElement('input')).attr({'type': 'submit', 'value': 'Update Order'}).click(function(eventData) {
            		parent = $(this).parent();
            		$(this).empty();
            		parent.append($(document.createElement('img')).attr({'src': "/images/loadingCircle.gif"}).css({ 'width': '20px', 'height': '20px'}))
                    OrderComponent.updateOrder(orderType);
                    return false;
                });
                
                orderpanel.append(update);
                
            }
        };
        OrderComponentClass.prototype.constructOrdersMenu = function(eventData, cssobject) {
        	/*
        	 * parentContainer - Must be something like #id
        	 */
        	
        	id = parseInt(cssobject.attr('id'))
        	obj = SystemObjectComponent.objects[id];
        	
        	if(obj != undefined && 
        	  obj["Order Queue"] != undefined && 
        	  obj["Order Queue"]["queueid"] != undefined && 
        	  obj["Order Queue"]["queueid"] != 0) {		    		
	    		queueid = obj["Order Queue"]["queueid"];
	    		var x = eventData.pageX;
	    		var y = eventData.pageY;
	    		if(queueid != undefined && queueid != null) {
	    			OrderComponent.objid = id;
	    			OrderComponent.queueid = queueid;
	    			
	    			WindowManagerComponent.registerObject("#order-menu");
	    			
	        		div = $(document.createElement('div')).attr('id', 'order-menu').css({'top': y+'px', 'left': x+'px'});
	        		ul = $(document.createElement('ul'));
	        		div.append(ul);
		        	for(var i in OrderComponent.orders[queueid].order_type) {
		                order_type = OrderComponent.orders[queueid].order_type[i];
		                li = $(document.createElement('li')).attr('value', order_type.type).attr('queueid', queueid).text(order_type.name).click(function(eventData){
		                	menuId = $(this).attr('value');
		                	queueId = parseInt($(this).attr('queueid'));

		                	$.ajax({type: "POST", dataType: 'json', data: {'action': 'create before', 'id': queueId, 'type': menuId}, url: "/json/order/send/", 
		                        error: function(req, textstatus) { 
		                            UILock.error('Something went wrong, contact administrator or try again later.', true);
		                        }, 
		                        success: function(data, textstatus) {
		                            if(data.auth === true) {

		                                UserInterface.getOrders(function(data_extra) {
		                                	OrderComponent.setup(data_extra.orders);
		                                    subid = OrderPosition2OrderId(OrderComponent.orders[OrderComponent.queueid].orders, data.order_position);
		                                    		                                    
		                                	if(subid != undefined) { 
		                                		OrderComponent.buildOrderPanel(subid);
		                                	}
		                                    
		                                });
		                            } else {
		                                UILock.error(data.error, true);
		                            }
		                        }
		                    });
		                }).mouseenter(function() {  
		                	  $(this).addClass("order-menu-roll")
		    	          }).mouseleave(function() {
		    	        	  $(this).removeClass("order-menu-roll");
		    	          });
		                ul.append(li);
		            }
		        	cssobject.append(div);
	        	}
	    	}
        	
        };
        OrderComponentClass.prototype.currentOrderList = function(id) {
        	div = $(document.createElement('div'));
            div.attr('id','order-list');
            div.append($(document.createElement('h4')).text("Orders"));
            
        	obj = SystemObjectComponent.objects[id];
            if(obj != undefined && 
              obj["Order Queue"] != undefined && 
              obj["Order Queue"]["queueid"] != undefined && 
              obj["Order Queue"]["queueid"] != 0) {		    		
	    		queueid = obj["Order Queue"]["queueid"];
	    		// Store selected object id
	            OrderComponent.queueid = queueid;
	    		
	            OrderComponentClass.args = new Array();
	
	            // If this object has orders continue
	            if(OrderComponent.queueid > 0 && OrderComponent.orders[OrderComponent.queueid] != undefined) {	                
	                OrderComponent.orders[OrderComponent.queueid]['orders'] = 
	                	sortArrByKey(OrderComponent.orders[OrderComponent.queueid]['orders']);
	                
	                counter = 0;
	                numorders = objKeyCount(OrderComponent.orders[OrderComponent.queueid]['orders']);
	                for(var i in OrderComponent.orders[OrderComponent.queueid]['orders']) {
	                    var order_id = OrderComponent.orders[OrderComponent.queueid]['orders'][i].order_id;
	                    order = OrderComponent.orders[OrderComponent.queueid]['orders'][i];
	                    
	                    dh = $(document.createElement('dh'));
	                    dt = $(document.createElement('dt')).text(order.turns + ' turns');
	                    dd = $(document.createElement('dd'));
	                    
	                    orderControl = $(document.createElement('div')).attr('id', 'ordercontrols');
	                    dd.append(orderControl);
	                    
	                    asc = $(document.createElement('img')).attr({'src': '/images/asc.png'});
    	                desc = $(document.createElement('img')).attr({'src': '/images/desc.png'});
    	            	remove = $(document.createElement('img')).attr({'src': '/images/delete.png'});
	                    
    	            	//Determine which buttons to disable
	                    if(counter == 0) { 
	                    	asc.attr('class', 'disabled');
	                    }else {
	                    	asc.one('click', OrderComponent.ascendOrder);
	                    }
	                    	
	                    if(counter + 1 == numorders) 
	                    	desc.attr('class', 'disabled');
	                    else 
	                    	desc.one('click', OrderComponent.descendOrder);
                    	
	                    
	                    orderControl.append(asc).append(desc).append(
	                    		$(document.createElement('a')).attr({'id': order.order_id, 'href': '#'}).append(remove).click(function(eventData) {
	                    			$(this).parent().empty().append($(document.createElement('img')).attr({'src': "/images/loadingCircle.gif"}).css({ 'width': '20px', 'height': '20px'})) 
	                    			//alert($(this).parent().attr('id'));
	                    			OrderComponent.removeOrder(eventData.currentTarget.id);
			                    })
			            );
	                    
	                    if(order.name != "Move") {
	                    	ordername = order.name;
	                    	if(order.name.length > 10)
	                    		ordername = ordername.substring(0, 9) + "...";
	                    	
	                        dd.append($(document.createElement('a')).attr({'id': order.order_id, 'href': '#', 'title': order.description}).text(ordername).click(function(eventData) {
	                        	OrderComponent.buildOrderPanel(eventData.currentTarget.id);
	                        }));
	                    } else
	                    	dd.append($(document.createElement('span')).attr({'id': order.order_id, 'title': order.description}).text(order.name));
	                    
	                    
	                    //orderControl.append(asc).append(desc).append(remove);
	                    
	                    div.append(dh.append(dt).append(dd));
	                    counter++;
	                }
	                
	                //OrderComponent.buildOrder();
	            } else {
	                div.append('No orders for this object');
	            }
            } else {
	            div.append('No orders for this object');
	        }
            return div;
        };
        
        return new OrderComponentClass();
    } )();

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
    		WindowManagerComponent.registerObject("#"+windowName);
    		
    		panel = $(document.createElement("div")).attr('id', windowName);
    		$('#overlay').append(panel)
    		
    		closebutton = $(document.createElement("div")).attr('id', 'closebutton');
			a = $(document.createElement('a')).one("click",function(eventData){
				WindowManagerComponent.removeObject();
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
    			WindowManagerComponent.removeObject();
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
	    	    	ClickManagerComponent.launchOrderMenu(eventData, $(this));
	    	    	
	    	    	//cancel the default context menu
	    	        return false;
	    	    }).click(function(eventData) {
	    	    	ClickManagerComponent.launchInfoComponent($(this).attr('id'));

	    		  });
		    }		    
        	
        };
        

        return new SystemObjectComponentClass();
    } )();

    /**
     * Store all objects
     */
    var constructor = function(){};

    constructor.prototype.MessageComponent = MessageComponent;
    constructor.prototype.objects = null;
    constructor.prototype.orders = null;
    constructor.prototype.username = null;
    
    /**
     * Logout handler
     */
    constructor.prototype.logout = function() {
        $.ajax({type: "GET", dataType: "json", url: "/json/logout/",
            complete: function() {
                $.cookies.del('tpclient-pyweb');
                window.location.reload();
            }
        });
        return false;
    };
    
    /**
     * Draw UI
     */
    constructor.prototype.drawUI = function() {
        // Create UI Lock
        UILock.create().notice('Please wait while loading user interface <img src="/images/loading.gif" /> <br><a href="#logout">Or</a> click here to log out.');

        // Hide loginbox and show UI
        $('#loginbox').hide();
        $('#ui').show();

        // Get objects with ajax call
        UserInterface.getObjects(function(data) {
            
            // Get orders with ajax call
            UserInterface.getOrders(function(orderdata) {
            	
            	// Setup ObjectComponent
                ObjectComponent.setup(data.objects);
                
            	// Setup OrderComponent
                OrderComponent.setup(orderdata.orders);
                
                //Setup SystemObjectComponent
                SystemObjectComponent.setup(data.objects);
                
                //Setup InfoComponent
                InfoComponent.setup(data.objects);

                // Add objects to map
                Map.addObjects(data.objects);
                
                // Add orders to map for coordinate drawing
                Map.addOrders(orderdata.orders);
                
                // Draw Map
                Map.draw();
                
                //Initiate the event actions for css objects
                UserInterface.initCssEvents();
                
                // Setup SystemComponent
                SystemComponent.setup(data.objects);
                
                
                // Get messages with ajax call
                UserInterface.getMessages(function(data) {

                    // Setup MessageComponent
                    UserInterface.MessageComponent.setup(data.messages)
                    
                    // We are done, clear UI Lock
                    UILock.clear();

                    // Notify user that we are done
                    NotifyComponent.notify('Finished drawing user interface', 'User Interface');
                    
                });
            });
        });
        UserInterface.initCssEvents = function() {
        	$('#system-bar').live("click", function(eventData) {
            	ClickManagerComponent.closeMenu(eventData, $(this).attr('id'));
            });
            
            //Bind rollover sytem object menu to mapobjects
            $('#map-canvas .starsystem').mouseenter(function() {  
            	if(SystemObjectComponent.displaySubPanel != true) {
                	SystemObjectComponent.displaySubPanel = true;
                	SystemObjectComponent.showObjects($(this));
                	
                	//Displays children of a starsystem 
                	$(this).css({'width': '200px'});
            	}
              }).mouseleave(function() {
            	  $('#map-canvas').children('#'+SystemObjectComponent.currentId).css('z-index', '100');
            	  SystemObjectComponent.displaySubPanel = false;
            	  SystemObjectComponent.hideObjects();
            	  ClickManagerComponent.clickObjectDisabled = 0;
            	  $(this).css({'width': '100px'});
              });
            
            $('.mapsystem').click(function(eventData) {
  			  	ClickManagerComponent.launchInfoComponent($(this).attr('id'));
  			 
            	
    		  }).bind("contextmenu",function(eventData){
    			ClickManagerComponent.launchOrderMenu(eventData, $(this));
    		  
    		  	//cancel the default context menu
    	        return false;
    	   });
    	    
    	    
    	    $('#map-viewport').bind('click', function(eventData) {
    	    	ClickManagerComponent.mapClicked(eventData);
    	    	
            });
            
            // Hack to fix height and width
            jQuery('#overlay-content').css('height', (jQuery(window).height() - jQuery('#overlay-content').offset().top));
            jQuery('#overlay-content').css('width', jQuery(window).width());

        };
        var menuWidth = $('#menu-bar').width() - $('#menu-bar-title').width();
        $('#menu-bar').css('left', -menuWidth);
        
        var messageWidth = $('#message-bar').width() - $('#message-bar-title').width();
        $('#message-bar').css('left', -messageWidth);
    };

    /**
     * getMessages
     *
     * Get messages from server using a ajax call to backend.
     */
    constructor.prototype.getMessages = function(callback) {
         $.ajax({type: "GET", dataType: 'json', url: "/json/get_messages/", 
            error: function(data, textstatus) { 
                UserInterface.logout();
            }, 
            success: function(data, textstatus) {
                if(data.auth === true) {
                    callback(data);
                } else {
                    UserInterface.logout();
                }
            }
        });      
    };
     
    /**
     * getOrders
     *
     * Get orders from server using a ajax call to backend.
     */
    constructor.prototype.getOrders = function(callback) {
         $.ajax({type: "GET", dataType: 'json', url: "/json/get_orders/", 
            error: function(data, textstatus) { 
                UserInterface.logout();
            }, 
            success: function(data, textstatus) {
                if(data.auth === true) {
                    TurnHandler.setup(data.turn.time, data.turn.current);
                    UserInterface.orders = data.orders;
                    callback(data);
                } else {
                    UserInterface.logout();
                }
            }
        });      
    };

    /**
     * getObjects
     *
     * Get objects from server using a ajax call to backend.
     */
    constructor.prototype.getObjects = function(callback) {
        $.ajax({type: "GET", dataType: 'json', url: "/json/get_objects/", 
            error: function(data, textstatus) { 
                UserInterface.logout();
            }, 
            success: function(data, textstatus) {
                if(data.auth === true) {
                    TurnHandler.setup(data.turn.time, data.turn.current);
                    UserInterface.objects = data.objects;
                    callback(data);
                } else {
                    UserInterface.logout();
                }
            }
        });
    };

    /**
     * isLoggedin
     *
     * Check if the user is logged in or not.
     * TODO: is it enough to check cookie?
     */
    constructor.prototype.isLoggedin = function() {
        if($.cookies.get('tpclient-pyweb') == null) {
            return false;
        } else { 
            return true;
        }
    };

    /**
     * cache_update
     *
     * Tell the backend to update the cache
     */
    constructor.prototype.cache_update = function(callback) {
        $.ajax({type: "GET", dataType: 'json', url: "/json/cache_update/", 
            error: function(data, textstatus) { 
                UserInterface.logout();
            }, 
            success: function(data, textstatus) {
                if(data.auth === true && data.cache === true) {
                    callback(data);
                    TurnHandler.setup(data.turn.time, data.turn.current);
                 } else {
                    UserInterface.logout();
                }
            }
        });
    };

    constructor.prototype.setup = function() {

        // Setup notify component
        NotifyComponent.setup();
    
        // Hack (fix later)
        $("#ui").show();
        Map.init("#mapdiv", 0, 0);
        $("#ui").hide();

        // Sets width and height correctly on resize
        jQuery(window).bind('resize', function(e) {
            jQuery('#overlay-content').css('height', (jQuery(window).height() - jQuery('#overlay-content').offset().top));
            jQuery('#overlay-content').css('width', jQuery(window).width());
        });

        // Setup draggables
        jQuery('#order-component').draggable({
            containment: '#overlay-content',
            handle: 'h3',
            cursor: 'move',
            stack: { group: '.component', min: 50 }
        });

        jQuery('#message-component').draggable({
            containment: '#overlay-content',
            handle: 'h3',
            cursor: 'move',
            stack: { group: '.component', min: 50 }
        })

        jQuery('#info-component').draggable({
            containment: '#overlay-content',
            handle: 'h3',
            cursor: 'move',
            stack: { group: '.component', min: 50 }
        });

        jQuery('#system-planet-component').draggable({
        	containment: '#overlay-content',
        	handle: 'h3',
        	cursor: 'move',
        	stack: {group: '.component', min: 50}
        });
	
        $('#logout').bind('click', UserInterface.logout);
        $('#loginform').bind("submit", this, login);
        /*$('#mapdiv').live('click', function(eventData) {
        	eventData.clickThrough = "mapobj";
        	InfoComponent.onMapClick(eventData);
        	//SystemObjectComponent.onMapClick(eventData);
        });*/


        /*$('#name').hover(function(eventData) {
        	alert("ey");
        	// do something on mouseover
        	SystemObjectComponent.showObjects(eventData);
      	}, 
      	function(eventData){
      		// do something on mouseout
      		SystemObjectComponent.hideObjects(eventData);
      	});
        /*$('.name').live('mouseover', function(eventData) {
        	if(eventData.type == 'mouseover') {
	        	// do something on mouseover
	        	SystemObjectComponent.showObjects(eventData);
        	}
        	else{
        		alert("abnormal in mouseover");
        	}
      	}).live('mouseout', function(eventData){
      		if(eventData.type == 'mouseout') {
	  		  	// do something on mouseout
      			SystemObjectComponent.hideObjects(eventData);
      		}
      		else {
      			alert("abnormal in mouseout");
      		}
      	});
        /*
        $('#mapcanvas div').live('mouseover mouseout', function(event) {
        	  if (event.type == 'mouseover') {
        		    // do something on mouseover
        		  SystemObjectComponent.showObjects(eventData);
    		  } else {
    		    // do something on mouseout
    			  $('#system-planet-panel').hide(); 
    		  }
        });
        
         * .bind('click', function(eventData) {
            OrderComponent.onMapClick(eventData);
            //ObjectComponent.onMapClick(eventData);
            eventData.clickThrough = "mapobj";
            InfoComponent.onMapClick(eventData);
            //SystemObjectComponent.onMapClick(eventData);
        })
         */
        
        
        $('#menu-bar-title').bind('click', function() {
        	var width = $('#menu-bar').width() - $('#menu-bar-title').width();
        	if($('#menu-bar').position().left < 0) {
        		width = "+=" + width + "px";            		
        	} else {
        		width = "-=" + width + "px";
        	}
        	$('#menu-bar').animate({"left": width}, "fast");
        	
        });
        
        
        $('#message-bar-title').bind('click', function() {
        	var width = $('#message-bar').width() - $('#message-bar-title').width();
        	if($('#message-bar').position().left < 0) {
        		width = "+=" + width + "px";            		
        	} else {
        		width = "-=" + width + "px";
        	}
        	$('#message-bar').animate({"left": width}, "fast");
        	
        });

        // Menu - download universe
        $('#menu-bar li.download-universe').bind('click', function() {
            NotifyComponent.notify('Started downloading the Universe', 'Universe');
            UserInterface.cache_update(function() {
            	UserInterface.drawUI();
            	/*NotifyComponent.notify('Finished downloading the Universe, click here to reload the UI', 'Universe', function() {
                    UserInterface.drawUI();   
                });*/
            });
        });
    };

    return new constructor();
} )();
