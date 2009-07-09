/**
 * Z-index table
 * 100 - UI
 * 1000 - login
 * 10000 - UI Lock
 */

Map = ( function() {

    var MapCreator = function() {};

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
        $(this.viewport).bind("mousedown", this, this.down);
        $(document).bind("mousemove", this, this.move);
        $(document).bind("mouseup", this, this.up);
        $(window).bind("resize", this, this.resize);
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

    MapCreator.prototype.draw = function() {
        if(this.objects) {
            universe = this.objects[0];
            for(var i in universe.contains) {
                galaxy = this.objects[universe.contains[i]];
                for(var j in galaxy.contains) {
                    obj = this.objects[galaxy.contains[j]];
                    var x = (obj.pos[0] / universe.size) * 120000;
                    var y = (obj.pos[1] / universe.size) * 120000;
                    if(obj.type.name == 'Star System') {
                        this.drawstarsystem(x, y, obj.id);
                    } else if(obj.type.name == 'Fleet') {
                        this.drawfleet(x, y, obj.id);
                    }
                }
            }
        }
    };

    MapCreator.prototype.drawstarsystem = function(x, y, id) {
        var test = $(document.createElement('div'));
        test.attr('id', id).attr('class', 'starsystem');
        test.css({'position': 'absolute', 'top': -y+'px', 'left': x+'px', 'background-color': 'red', 
                'width': '10px', 'height': '10px', 'font-size': '8px', 'z-index': '100'});
        this.canvas.append(test);
    };

    MapCreator.prototype.drawfleet = function(x, y, id) {
        var test = $(document.createElement('div'));
        test.attr('id', id).attr('class', 'fleet');
        test.css({'position': 'absolute', 'top': -y+'px', 'left': x+'px', 'background-color': 'green', 
                'width': '10px', 'height': '10px', 'font-size': '8px', 'z-index': '100'});
        this.canvas.append(test);
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
            $(".turn-component").html('Turn <span class="turn">'+turn+'</span> will end in <span class="timeleft">'+timeleft+'</span> s');

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
                $(".turn-component .timeleft").text(--timeleft);
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

                if(match) {
                    if(temp.name.toLowerCase().indexOf(match) == 0) {
                        ul.append(
                            $(document.createElement('li')).addClass(UserInterface.classes[temp.type.id]).append(
                                $(document.createElement('a'))
                                    .attr({'href': '#info/'+temp.id, 'id': temp.id})
                                    .addClass(UserInterface.classes[temp.type.id])
                                    .text(temp.name)
                            )
                        );
                    }
                    if(temp.contains.length > 0) {
                        createList(temp, ul, match);
                    }
                } else {
                    li = $(document.createElement('li')).addClass(UserInterface.classes[temp.type.id]).append(
                        $(document.createElement('a'))
                            .attr({'href': '#info/'+temp.id, 'id': temp.id})
                            .addClass(UserInterface.classes[temp.type.id])
                            .text(temp.name)
                    );
                    ul.append(li);

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
        var onResize = function(e) {
            $('#system-component').css('height', jQuery(window).height() - jQuery('#overlay-content').offset().top);
            $('#system-component-content').css('height', jQuery(window).height() - jQuery('#overlay-content').offset().top - 30);
        };


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
                $('#system-component-content a').unbind('click');
                $('#system-component-content').html('');
                ul = $(document.createElement('ul')).addClass('tree-list');
                createList(objects[0], ul, searchString.toLowerCase());
                $('a', ul).bind('click', UserInterface.objclicked);
                $('#system-component-content').append(ul);
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

            $(window).bind('resize', onResize);

            SystemComponent.objects = objects;
            var system = $(document.createElement('div')).attr('id', 'system-component').css({
                'height': jQuery(window).height() - jQuery('#overlay-content').offset().top});

            var systemsearch = $(document.createElement('div')).attr('id', 'system-component-search');
            var input = $(document.createElement('input')).attr({'id': 'system-search-input', 'type': 'text'});
            input.bind('keyup', onSearch);
            systemsearch.append(input);

            var systemcontent = $(document.createElement('div')).attr('id', 'system-component-content').css({
                'height': (jQuery(window).height() - jQuery('#overlay-content').offset().top) - 30});

            ul = $(document.createElement('ul')).addClass('tree-list');
            createList(objects[0], ul);
            $('a', ul).bind('click', UserInterface.objclicked);
            
            $('#overlay-content').append(system.append(systemsearch, systemcontent.append(ul)));

            // Make it resizable
            $('#system-component').resizable({
                handles: 'w,n,e,s',
                maxWidth: 400,
                maxHeight: jQuery(window).height() - jQuery('#overlay-content').offset().top,
                minWidth: 200,
                minHeight: jQuery(window).height() - jQuery('#overlay-content').offset().top
            });

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

        if(host == '' || user == '' || pass == '') {
            UILock.error('No empty fields are allowed.', true);
        } else {
            $.ajax({type: "POST", dataType: 'json', data: {'host': host, 'user': user, 'pass': pass}, url: "/json/login/", 
                error: function(req, textstatus) { 
                    UILock.error('Something went wrong, contact administrator or try again later.', true);
                }, 
                success: function(data, textstatus) { 
                    if(data.auth === true) {
                        UILock.notice('Please wait while loading user interface <img src="/images/loading.gif" />');
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

        var onNext = function() {
            messageNumber++;
            if(messageNumber > (messages[0].number - 1)) {
                messageNumber = 0;
            }
            redraw();
        };

        var onPrev = function() {
            messageNumber--;
            if(messageNumber < 0) {
                messageNumber = messages[0].number-1;
            }
            redraw();
        };

        var redraw = function() {
            $('#message-component-container li.center span').text(messages[0].messages[messageNumber].subject + ' (' + (messageNumber+1) + '/' + messages[0].number + ')');
            messageBodyElement.text(messages[0].messages[messageNumber].body);
        };

        var MessageComponentClass = function(){};

        MessageComponentClass.prototype.setup = function(data) {
            messages = data;
            messageNav = $(document.createElement('ul'))
                .append($(document.createElement('li')).addClass('left').append(
                    $(document.createElement('a')).text('Previous').bind('click', onPrev)
                ))
                .append($(document.createElement('li')).addClass('center').append(
                    $(document.createElement('span')).text(messages[0].messages[messageNumber].subject + ' (' + (messageNumber+1) + '/' + messages[0].number + ')')
                ))
                .append($(document.createElement('li')).addClass('right').append(
                    $(document.createElement('a')).text('Next').bind('click', onNext)
                ));
            messageBodyElement = $(document.createElement('p')).text(messages[0].messages[messageNumber].body);
            $('#message-component-content').empty().append(messageNav, messageBodyElement);
        };

        return new MessageComponentClass();

    } )();

    /**
     * Store all objects
     */
    var objects = null;

    var constructor = function(){};

    constructor.prototype.MessageComponent = MessageComponent;
    constructor.prototype.objects = null;
    constructor.prototype.orders = null;
    constructor.prototype.classes = ['universe', 'galaxy', 'starsystem', 'planet', 'fleet'];

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
        UILock.create().notice('Please wait while loading user interface <img src="/images/loading.gif" />');

        // Hide loginbox and show UI
        $('#loginbox').hide();
        $('#ui').show();

        // Get objects with ajax call
        UserInterface.getObjects(function(data) {

            // Add objects to map
            Map.addObjects(data.objects);

            // Draw Map
            Map.draw();

            // Hack to fix height and width
            jQuery('#overlay-content').css('height', (jQuery(window).height() - jQuery('#overlay-content').offset().top));
            jQuery('#overlay-content').css('width', jQuery(window).width());

            // Setup SystemComponent
            SystemComponent.setup(data.objects);

            // Get orders with ajax call
            UserInterface.getOrders(function(data) {

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
    };

    /**
     * getMessages
     *
     * Get messages from server using a ajax call to backend.
     */
    constructor.prototype.getMessages = function(callback) {
         $.ajax({type: "GET", dataType: 'json', url: "/json/get_messages/", 
            error: function(data, textstatus) { }, 
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
            error: function(data, textstatus) { }, 
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
            error: function(data, textstatus) { }, 
            success: function(data, textstatus) {
                if(data.auth === true) {
                    TurnHandler.setup(data.turn.time, data.turn.current);
                    objects = data.objects;
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

    constructor.prototype.objclicked = function(e) {
        id = parseInt(e.target.id);
        object = objects[id];


        orderComponent = $('#order-component-content').html('');
        if(UserInterface.orders[id]) {
            dl = $(document.createElement('dl'));
            for(var i in UserInterface.orders[id]['orders']) {
                order = UserInterface.orders[id]['orders'][i];
                dt = $(document.createElement('dt')).text(order.turns + ' turns');
                dd = $(document.createElement('dd')).html(order.name + '<br />' + order.description);
                dl.append(dt).append(dd);
            }
            orderComponent.append(dl);

            select = $(document.createElement('select'));
            for(var i in UserInterface.orders[id].order_type) {
                order_type = UserInterface.orders[id].order_type[i];
                option = $(document.createElement('option')).text(order_type.name);
                select.append(option);
            }
            orderComponent.append(select);
        }

        infoComponent = $("#info-component-content").html("");
        h4 = $(document.createElement("h4")).text(object.name).addClass(UserInterface.classes[object.type.id]);
        dl = $(document.createElement("dl"));
        infoComponent.append(h4).append(dl);

        if(object.type.name == 'Fleet') {
            base = {'parent': 'Parent', 'pos': 'Position', 'vel': 'Velocity', 'size': 'Size', 'owner': 'Owner', 'damage': 'Damage', 'ships': 'Ships'}
        } else if(object.type.name == 'Planet') {
            base = {'parent': 'Parent', 'pos': 'Position', 'vel': 'Velocity', 'size': 'Size', 'owner': 'Owner', 'resources': 'Resources'}
        } else if(object.type.name == 'Star System') {
            base = {'parent': 'Parent', 'pos': 'Position', 'vel': 'Velocity', 'size': 'Size'}
        } else if(object.type.name == 'Galaxy') {
            base = {'parent': 'Parent', 'pos': 'Position', 'vel': 'Velocity', 'size': 'Size'}
        } else {
            base = {'parent': 'Parent', 'size': 'Size'}
        }
        for(var attr in base) {
            dt = $(document.createElement('dt')).text(base[attr]);
            if(attr == 'parent') {
                o = objects[object[attr]];
                if(o.id > 0) {
                    a = $(document.createElement('a')).attr({'href': '#info/' + o.id, 'id': o.id}).addClass(UserInterface.classes[o.type.id]).text(o.name);
                    a.one('click', UserInterface.objclicked);
                    dd = $(document.createElement('dd')).append(a);
                } else {
                    dd = $(document.createElement('dd')).text(o.name);
                }
            } else {
                if(object[attr].length == 0) {
                    dd = $(document.createElement('dd')).text('-');
                } else {
                    dd = $(document.createElement('dd')).text(object[attr].toString());
                }
            }
            dl.append(dt).append(dd);
        }

        // What objects are contained inside this object
        if(object.contains.length > 0) {
            dt = $(document.createElement('dt')).text('Contains');
            dd = $(document.createElement('dd'));
            ul = $(document.createElement('ul')).addClass('tree-list');
            for(var i in object.contains) {
                toplevel = objects[object.contains[i]];
                li = $(document.createElement('li')).addClass(UserInterface.classes[toplevel.type.id]);
                a = $(document.createElement('a')).attr({'href': '#info/' + toplevel.id, 'id': toplevel.id})
                    .addClass(UserInterface.classes[toplevel.type.id]).text(toplevel.name).one('click', UserInterface.objclicked);
                ul.append(li.append(a));
                if(toplevel.contains.length > 0) {
                    subul = $(document.createElement('ul'));
                    li.append(subul);
                    for(var j in toplevel.contains) {
                        sublevel = objects[toplevel.contains[j]];
                        subli = $(document.createElement('li')).addClass(UserInterface.classes[sublevel.type.id]);
                        a = $(document.createElement('a')).attr({'href': '#info/' + sublevel.id, 'id': sublevel.id}).text(sublevel.name)
                            .addClass(UserInterface.classes[sublevel.type.id]).one('click', UserInterface.objclicked);
                        subul.append(subli.append(a));
                    }
                }
            }
            dl.append(dt).append(dd.append(ul));
        }
        return false;
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

        $('#logout').bind('click', UserInterface.logout);
        $('#loginform').bind("submit", this, login);
        $('#mapdiv .starsystem, #mapdiv .fleet').live("click", this.objclicked);

        // Menu - download universe
        $('#menu-bar li.download-universe').bind('click', function() {
            NotifyComponent.notify('Started downloading the Universe', 'Universe');
            UserInterface.cache_update(function() {
                NotifyComponent.notify('Finished downloading the Universe, click here to reload the UI', 'Universe', function() {
                    UserInterface.drawUI();   
                });
            });
        });
    };

    return new constructor();
} )();
