function DragTileMap(target) {

    this.tilesize = 256;

    // general properties
    this.target = $(target);
    this.shownMap = [];

    // dom properties / handlers
    this.vp = $(document.createElement('div'));
    this.vp.attr('id', 'scrollMapViewport');
    this.vp.css({'position': 'relative', 'overflow': 'hidden', 'height': ($(window).height() - parseInt(this.target.offset().top, 10))+'px'});
    this.target.append(this.vp);

    this.mapc = $(document.createElement('div'));
    this.mapc.attr('id', 'scrollMapCanvasContainer');
    this.mapc.css({'position': 'absolute', 'top': '0px', 'left': '0px'});
    this.vp.append(this.mapc);

    this.canvas = $(document.createElement('div'));
    this.canvas.attr('id', 'MapCanvas');
    this.canvas.css({'position': 'absolute', 'top': '0px', 'left': '0px', 'zIndex': '5'});
    this.mapc.append(this.canvas);

    this.map = $(document.createElement('div'));
    this.map.attr('id', 'scrollMapCanvas');
    this.map.css({'position': 'absolute', 'top': '0px', 'left': '0px'});
    this.mapc.append(this.map);

    // handle events
    this.vp.bind("mousedown", this, function(e) {

        e.data.target_offset = e.data.target.offset();
        var page = [e.pageX - e.data.target_offset.left, e.pageY - e.data.target_offset.top];

        var xpos = page[0] - parseInt(e.data.mapc.css('left'), 10);
        var ypos = (e.data.tilesize) + (parseInt(e.data.mapc.css('top'), 10) - page[1]);

        $('#debug-1').text('Position: ('+ xpos + ', ' + ypos + ')');

        var temp = new Array();
        temp = e.target.id.split('_');
        if(temp.length == 3) {
            var xbounds = [(parseInt(temp[1], 10) * e.data.tilesize), (parseInt(temp[1], 10) * e.data.tilesize + (e.data.tilesize-1))];
            var ybounds = [(parseInt(temp[2], 10) * e.data.tilesize), (parseInt(temp[2], 10) * e.data.tilesize + (e.data.tilesize-1))];
            $('#debug-2').text('Tile X: ' + temp[1] + ' [' + xbounds[0] + ', ' + xbounds[1] + ']');
            $('#debug-3').text('Tile Y: ' + temp[2] + ' [' + ybounds[0] + ', ' + ybounds[1] + ']');
        } else {
            $('#debug-2').text('No X tile');
            $('#debug-3').text('No Y tile');
        }

        if(!e.data.mapc.moving) {
            e.data.mapc.posx = page[0];
            e.data.mapc.posy = page[1];
            e.data.mapc.moving = true;
            e.data.target.everyTime(400, function(i) {
                e.data.redraw();
            }, 25);
        }
        return false;
    });
        
    $(document).bind("mousemove", this, function(e) {
        if(e.data.mapc.moving) {
            var cposx = e.pageX - e.data.target_offset.left;
            var cposy = e.pageY - e.data.target_offset.top;
            e.data.mapc.css('top', (parseInt(e.data.mapc.css('top'), 10) + (cposy - e.data.mapc.posy))+'px');
            e.data.mapc.css('left', (parseInt(e.data.mapc.css('left'), 10) + (cposx - e.data.mapc.posx))+'px');
            e.data.mapc.posx = cposx;
            e.data.mapc.posy = cposy;
        }
        return false;
    });

    $(document).bind("mouseup", this, function(e) {
        if(e.data.mapc.moving) {
            e.data.target.stopTime();
            e.data.mapc.moving = false;
            e.data.redraw();
        }
        return false;
    });

    $(window).bind("resize", this, function(e) {
        // Set the height of the viewport
        e.data.vp.css('height', ($(window).height() - parseInt(e.data.target.offset().top, 10))+'px');

        e.data.oldvpCols = e.data.vpCols;
        e.data.oldvpRows = e.data.vpRows;

        // Number of columns and rows in the viewport
        e.data.vpCols = Math.round((e.data.target.width() / e.data.tilesize) + .5)+1;
        e.data.vpRows = Math.round((e.data.target.height() / e.data.tilesize) + .5)+1;

        // First draw of the map
        e.data.redraw();
    });

    // methods
    this.init = function(x, y) {
        // Set center values so we always can get them fast
        this.center = [x, y];

        // Number of columns and rows in the viewport
        this.vpCols = this.oldvpCols = Math.round((this.target.width() / this.tilesize) + .5)+1;
        this.vpRows = this.oldvpRows = Math.round((this.target.height() / this.tilesize) + .5)+1;

        // Center map on x,y
        this.mapc.css('top', (((this.target.height()/2) + y)-(this.tilesize))+'px');
        this.mapc.css('left', ((this.target.width()/2) + -x)+'px');

        // Calculate most left column and most top row
        this.oldStartRow = Math.round((parseInt(this.mapc.css('top'), 10)/this.tilesize)+.5) +1;
        this.oldStartCol = -1*Math.round((parseInt(this.mapc.css('left'), 10)/this.tilesize)+.5) -1;

        // First draw of the map
        this.redraw();
    }
    this.redraw = function() {

        // Calculate most left column and most top row (like in init)
        var startRow = Math.round((parseInt(this.mapc.css('top'), 10)/this.tilesize)+.5) +1;
        var startCol = -1*Math.round((parseInt(this.mapc.css('left'), 10)/this.tilesize)+.5) -1;

        // Calculate most right column and most bottom row
        var endRow = startRow - this.vpRows;
        var endCol = startCol + this.vpCols;

        // Make sure the loop gets as big as possible
        // This is so that we can remove old entries that is offscreen now
        var si = Math.max(this.oldStartRow, startRow);
        var sj = Math.min(this.oldStartCol, startCol);
        var ei = Math.min(this.oldStartRow - Math.max(this.oldvpRows, this.vpRows), endRow);
        var ej = Math.max(this.oldStartCol + Math.max(this.oldvpCols, this.vpCols), endCol);

        // Loop, i = row, j = column
        /*for(var i = si; i >= ei; i--) {
            for(var j = sj; j <= ej; j++) {
                if(i > startRow || i < endRow || j < startCol || j > endCol) {
                    if(this.shownMap[i] && this.shownMap[i][j]) {
                        $('#map_'+j+'_'+i).remove();
                        this.shownMap[i][j] = null;
                    }
                } else {
                    if(!this.shownMap[i]) this.shownMap[i] = [];
                    if(!this.shownMap[i][j]) {
                        var timg = $(document.createElement('img'));
                        timg.attr({'id': 'map_'+j+'_'+i, 'src': 'images/map_'+j+'_'+i+'.png'});
                        timg.css({'position': 'absolute', 
                                  'width': this.tilesize+'px',
                                  'height': this.tilesize+'px', 
                                  'top': (i*this.tilesize*-1)+'px',
                                  'left': (j*this.tilesize)+'px',
                                  'MozUserSelect': 'none'});
                        $(this.map).append(timg);
                        this.shownMap[i][j] = true;
                        timg = null;
                    }
                }
            }
        }*/
        this.oldStartRow = startRow;
        this.oldStartCol = startCol;
    }

    this.drawstarsystem = function(x, y, id) {
        var test = $(document.createElement('div'));
        test.attr('id', id).attr('class', 'starsystem');
        test.css({'position': 'absolute', 'top': (this.tilesize) - y+'px', 'left': x+'px', 'background-color': 'red', 
                'width': '10px', 'height': '10px', 'font-size': '8px', 'z-index': '100'});
        this.canvas.append(test);
    }

    this.drawfleet = function(x, y, id) {
        var test = $(document.createElement('div'));
        test.attr('id', id).attr('class', 'fleet');
        test.css({'position': 'absolute', 'top': (this.tilesize) - y+'px', 'left': x+'px', 'background-color': 'green', 
                'width': '10px', 'height': '10px', 'font-size': '8px', 'z-index': '100'});
        this.canvas.append(test);
    }       
}

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

EventHandler = ( function(jQuery) {
    var EventHandlerClass = function(){};

    EventHandlerClass.prototype.subscribe = function(eventName, handler, data) {
        if(typeof(handler) == 'function') {            
            jQuery(document).bind(eventName, data, handler);                        
        }
    };

    EventHandlerClass.prototype.unsubscribe = function(eventName) {
        jQuery(document).unbind(eventName);
    };

    EventHandlerClass.prototype.notify = function(eventName, data) {
        jQuery(document).trigger(eventName, data);
    };

    return new EventHandlerClass();
} )(jQuery);

UserInterface = ( function() {
    var loggedin = false;

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
                    UILock.error('Something went really wrong, contact administrator.', true);
                }, 
                success: function(data, textstatus) { 
                    if(data.auth === true) {
                        loggedin = true;
                        UILock.notice('Please wait while the user interface is loading <img src="/images/loading.gif" />');
                        e.data.cache_update(true);
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

    var drawUI = function() {
        UILock.create().notice('Please wait while loading user interface <img src="/images/loading.gif" />');

        $('#loginbox').hide();
        $('#ui').show();

        map = new DragTileMap('#mapdiv');
        map.init(0, 0);

        $.ajax({type: "GET", dataType: 'json', url: "/json/get_objects/", 
            error: function(data, textstatus) { }, 
            success: function(data, textstatus) {
                if(data.auth === true) {
                    TurnHandler.setTime(data.time);
                    objects = data.objects;
                    universe = data.objects[0];
                    for(var i in universe.contains) {
                        galaxy = data.objects[universe.contains[i]];
                        for(var j in galaxy.contains) {
                            obj = data.objects[galaxy.contains[j]];
                            var x = (obj.pos[0] / universe.size) * 120000;
                            var y = (obj.pos[1] / universe.size) * 120000;
                            if(obj.type == 'Star System') {
                                map.drawstarsystem(x, y, obj.id);
                            } else if(obj.type == 'Fleet') {
                                map.drawfleet(x, y, obj.id);
                            }
                        }
                    }

                    UILock.clear();

                } else {
                    this.logout();
                }
            }
        });
    };

    var constructor = function(){};

    constructor.prototype.drawUI = function() {
        drawUI();
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
                        drawUI();
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

        TurnHandler.register("#turn span.time", this.cache_update);

        $('#logout').bind("click", this, logout);
        $('#loginform').bind("submit", this, login);
        $('.starsystem, .fleet').live("click", this.objclicked);
    };

    return new constructor();
} )();



