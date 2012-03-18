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
    TurnHandler = ( function() {
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
    
  
    var ClickManagerComponent = TaskManager.Click;
    var WindowManagerComponent = TaskManager.Window;
    


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
     * Store all objects
     */
    var constructor = function(){};
    constructor.prototype.UILock = UILock;
    constructor.prototype.NotifyComponent = NotifyComponent;
    constructor.prototype.TurnHandler = TurnHandler;
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
                    MessageComponent.setup(data.messages)
                    
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
