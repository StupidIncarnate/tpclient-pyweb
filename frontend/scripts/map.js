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

        console.log(xpos, ypos);

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
                    if(obj.type == 'Star System') {
                        this.drawstarsystem(x, y, obj.id);
                    } else if(obj.type == 'Fleet') {
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

Logger = ( function() {
    var LoggerClass = function(){};

    var container = null;
    var content = null;
    var active = false;

    LoggerClass.prototype.info = function(message) {
        if(active) {
            var d = new Date();
            var date = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + ':' + d.getMilliseconds();
            message = date + ' ' + message + "\n";
            if(window.console) {
                console.info(message);
            } else {
                $('pre', content).prepend(message);
            }
        }
    };

    LoggerClass.prototype.setup = function() {
        active = true;

        if(!window.console) {
            container = $(document.createElement('div'));
            container.attr('id', 'log-container').css({
                'position': 'absolute',
                'bottom': '3em',
                'right': '3em',
                'width': '400px',
                'height': '150px',
                'background-color': 'red'
            });
            content = $(document.createElement('div'));
            content.attr('id', 'log-content').css({
                'width': '380px',
                'height': '130px',
                'margin': '10px',
                'overflow': 'auto'
            }).html("<pre style=\"margin: 0;\"></pre>");
            container.append(content);
            $('body').append(container);
        }

        this.info('Starting Logger');
    };

    return new LoggerClass();
} )();

/**
 * A simple Event handler
 * Following the subscribe and publish pattern
 */
EventHandler = ( function(jQuery) {
    var EventHandlerClass = function(){};

    /**
     * Handler can be:
     *  - a function
     *  - an array [object, method, arg]
     */
    EventHandlerClass.prototype.subscribe = function(eventName, handler, data) {
        if(jQuery.isArray(handler)) {
            newhandler = function(event, data) {
                return handler[0][handler[1]](handler[2], data);
            }
            jQuery(document).bind(eventName, data, newhandler);
        } else {
            jQuery(document).bind(eventName, data, handler);
        }
        return this;
    };

    EventHandlerClass.prototype.unsubscribe = function(eventName) {
        jQuery(document).unbind(eventName);
        return this;
    };

    EventHandlerClass.prototype.notify = function(eventName, data) {
        Logger.info("Triggered event: " + eventName);
        jQuery(document).trigger(eventName, data);
        return this;
    };

    return new EventHandlerClass();
} )(jQuery);

UserInterface = ( function() {
    /**
     * User Interface Lock
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
                this.lock.one("click", this, function(e) { e.data.clear(); });
                this.content.one("click", this, function(e) { e.data.clear(); });
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
        var TurnHandlerClass = function(){};

        var turntime = 0;
        var element = null;
        var callback = null;

        TurnHandlerClass.prototype.register = function(elem, cb) {
            element = $(elem);
            callback = cb;
        };

        TurnHandlerClass.prototype.setTime = function(time) {
            turntime = parseInt(time); 
            element.text(turntime);

            $(window).stopTime('turnhandler');
            $(window).oneTime(time*1000, 'turnhandler', callback);
            $(window).everyTime("1s", 'turnhandler', function() {
                turntime--;
                element.text(turntime);
            }, turntime);
        };

        TurnHandlerClass.prototype.notice = function() {
            $('#turn .info').text('Finished downloading the Universe, click here if you want the changes');
        };

        return new TurnHandlerClass();
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
                        EventHandler.notify("login.complete");
                    } else {
                        UILock.error(data.error, true);
                    }
                }
            });
        }
        return false;
    };

    /**
     * Logout handler
     */
    var logout = function(e) {
        $.ajax({type: "GET", dataType: "json", url: "/json/logout/",
            complete: function() {
                $.cookies.del('tpclient-pyweb');
                window.location.reload();
            }
        });
        return false;
    };

    var ObjectHandler = ( function() {
        var ObjectHandlerClass = function(){};
        var objects = null;
        ObjectHandlerClass.prototype.load = function() {
            $.ajax({type: "GET", dataType: 'json', url: "/json/get_objects/", 
                error: function(data, textstatus) { }, 
                success: function(data, textstatus) {
                    if(data.auth === true) {
                        TurnHandler.setTime(data.time);
                        objects = data.objects;
                        UILock.clear();
                    } else {
                        this.logout();
                    }
                }
            });
        };
        return new ObjectHandlerClass();
    } )();

    /**
     * Store all objects
     */
    var objects = null;

    var constructor = function(){};

    constructor.prototype.drawUI = function() {
        UILock.create().notice('Please wait while loading user interface <img src="/images/loading.gif" />');
        $('#loginbox').hide();
        $('#ui').show();
        this.getObjects();
        Map.init("#mapdiv", 0, 0);
        Map.draw();
        UILock.clear();
    };

    constructor.prototype.getObjects = function() {
        $.ajax({async: false, type: "GET", dataType: 'json', url: "/json/get_objects/", 
            error: function(data, textstatus) { }, 
            success: function(data, textstatus) {
                if(data.auth === true) {
                    console.dir(this);
                    TurnHandler.setTime(data.time);
                    Map.addObjects(data.objects);
                    objects = data.objects;
                } else {
                    this.logout();
                }
            }
        });
    };

    constructor.prototype.isLoggedin = function() {
        if($.cookies.get('tpclient-pyweb') == null) {
            return false;
        } else { 
            return true;
        }
    };

    constructor.prototype.cache_update = function(forceRedraw) {
        $.ajax({type: "GET", dataType: 'json', url: "/json/cache_update/", 
            error: function(data, textstatus) { 
                this.logout();
            }, 
            success: function(data, textstatus) {
                if(data.auth === true && data.cache === true) {
                    if(forceRedraw === true) {
                        this.drawUI();
                    } else {
                        TurnHandler.notice();   
                    }
                    TurnHandler.setTime(data.time);
                 } else {
                    this.logout();
                }
            }
        });
    };

    constructor.prototype.objclicked = function(e) {
        id = parseInt(e.target.id);
        object = objects[id];

        infoComp = $("#info-comp");
        $("h4", infoComp).text(object.name);
        dl = $("dl", infoComp).html("");

        base = {'name': 'Name', 'id': 'Id', 'parent': 'Parent', 'pos': 'Position', 'vel': 'Velocity', 'size': 'Size'}
        for(var attr in base) {
            dt = $(document.createElement('dt')).text(base[attr]);
            dd = $(document.createElement('dd')).text(object[attr].toString());
            dl.append(dt).append(dd);
        }


        dt = $(document.createElement('dt')).text('Contains');
        dd = $(document.createElement('dd'));
        text = "";
        for(var i in object.contains) {
            lone = objects[object.contains[i]];
            text += lone.name + "<br />";
            for(var j in lone.contains) {
                ltwo = objects[lone.contains[j]];
                text += "&nbsp;&nbsp;" + ltwo.name + "<br />";
            }
        }
        dd.html(text);
        dl.append(dt).append(dd);
    };

    constructor.prototype.setup = function() {


        // Setup event subscribers
        EventHandler.subscribe("login.complete", [this, 'cache_update', true]);
        EventHandler.subscribe("login.complete", function() { UILock.notice('Please wait while the user interface is loading <img src="/images/loading.gif" />'); });

        TurnHandler.register("#turn span.time", this.cache_update);

        $('#logout').bind("click", this, logout);
        $('#loginform').bind("submit", this, login);
        $('.starsystem, .fleet').live("click", this.objclicked);
    };

    return new constructor();
} )();
