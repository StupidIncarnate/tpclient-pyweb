/**
 * Converts the given data structure to a JSON string.
 * Argument: arr - The data structure that must be converted to JSON
 * Example: var json_string = array2json(['e', {pluribus: 'unum'}]);
 *          var json = array2json({"success":"Sweet","failure":false,"empty_array":[],"numbers":[1,2,3],"info":{"name":"Binny","site":"http:\/\/www.openjs.com\/"}});
 * http://www.openjs.com/scripts/data/json_encode.php
 */
function array2json(arr) {
    var parts = [];
    var is_list = (Object.prototype.toString.apply(arr) === '[object Array]');
    
    for(var key in arr) {
        var value = arr[key];
        if(typeof value == "object") { //Custom handling for arrays
            if(is_list) parts.push(array2json(value)); /* :RECURSION: */
            else parts[key] = array2json(value); /* :RECURSION: */
        } else {
            var str = "";
            if(!is_list) str = '"' + key + '":';

            //Custom handling for multiple data types
            if(typeof value == "number") str += value; //Numbers
            else if(value === false) str += 'false'; //The booleans
            else if(value === true) str += 'true';
            else str += '"' + value + '"'; //All other things
            // :TODO: Is there any more datatype we should be in the lookout for? (Functions?)

            parts.push(str);
        }
    }
    var json = parts.join(",");
    if(is_list) return '[' + json + ']';//Return numerical JSON
    return '{' + json + '}';//Return associative JSON
}

function OrderPosition2OrderId(ordersArr, position) {
	var counter = 0;
	ordersArr = sortArrByKey(ordersArr);
	for(i in ordersArr) {
		if(counter == position) {
			return ordersArr[i].order_id;
		} else {
			counter++;
		}
	}
	return undefined
}

function OrderId2OrderPosition(ordersArr, id) {
	var counter = 0;
	ordersArr = sortArrByKey(ordersArr);
	for(i in ordersArr) {
		if(id == i) {
			return counter;
		} else {
			counter++;
		}
	}
	return undefined
}
function sortArrByKey(array) {
	var sortedArr = new Array();
    var keys = new Array();
    for(k in array)
    {
         keys.push(k);
    }

    keys.sort( function (a, b){
    	return (a>b)-(a<b);
    	}
    );

    for (var i = 0; i < keys.length; i++)
    {
    	sortedArr[keys[i]] = array[keys[i]];        
    }
    return sortedArr
}

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
                    var x = (obj.Position.x / universe.Size) * 120000;
                    var y = (obj.Position.y / universe.Size) * 120000;
                    this.drawobject(x, y, obj.id, obj.name, obj.type.name);
                }
                
            }
        }
    };
    
    MapCreator.prototype.drawobject = function(x, y, id, name, type) {
    	type = type.toLowerCase().replace(" ", "");
    	var object = $(document.createElement('div'));
    	object.attr('id', id).attr('class', type);
    	object.css({'top': -y+'px', 'left': x+'px'});
    	
    	var objectText = $(document.createElement('div'));
    	objectText.attr('class', 'name');
    	objectText.text(name);
    	this.canvas.append(object.append(objectText));
    	
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
                    li = $(document.createElement('li')).addClass("icon").css("background-image", "url("+temp.Icon+")").append(
                        $(document.createElement('a'))
                            .attr({'href': '#info/'+temp.id, 'id': temp.id, 'queueid': queueid})
                            .addClass(temp.type.name.toLowerCase().split(' ').join(''))
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
                createList(ObjectComponent.objects[0], ul, searchString.toLowerCase());
                $('a', ul).bind('click', function(eventData) {
                    ObjectComponent.onMapClick(eventData);
                    OrderComponent.onMapClick(eventData);
                });
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
            $('a', ul).bind('click', function(eventData) {
                ObjectComponent.onMapClick(eventData);
                OrderComponent.onMapClick(eventData);
            });
            
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
            messageBodyElement.empty().append("<br /><br />"+messages[0].messages[messageNumber].body);
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
            messageBodyElement = $(document.createElement('p')).append("<br /><br/>"+messages[0].messages[messageNumber].body);
            $('#message-component-content').empty().append(messageNav, messageBodyElement);
        };

        return new MessageComponentClass();

    } )();

    /**
     * Order component
     */
    var OrderComponent = (function() {

        /**
         * Inline class: object argument panel
         */
        function ObjectArgumentPanel() {
            this.object = null;
            this.order_type = null;

            this.build = function(order_type) {
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
                $('#order-component-create-order').append(this.order_type.name, this.order_type.description, this.object);
            };

            this.getValue = function() {
                return array2json([parseInt(this.object.val())]);
            };
        };

        /**
         * Inline class: list argument panel
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


            this.build = function(order_type) {
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

                $('#order-component-create-order').append(
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
         */
        function StringArgumentPanel() {
            this.string = null;
            this.order_type = null;

            this.build = function(order_type) {
                this.order_type = order_type;
                
                if(this.order_type.value != null) {
                    var value = this.order_type.value[1];
                } else {
                    var value = '';
                }
                this.string = $(document.createElement('input')).attr({'type': 'text', 'value': value});
                $('#order-component-create-order').append(
                    $(document.createElement('div')).append(this.order_type.name, this.string)
                );
            };

            this.getValue = function() {
                return array2json([0, this.string.val()]);
            };
        };

        /**
         * Inline class: coordinate argument panel
         */
        function CoordinateArgumentPanel() {
            this.pos1 = null;
            this.pos2 = null;
            this.pos3 = null;
            this.order_type = null;

            this.build = function(order_type) {
                this.order_type = order_type;
                
                if(this.order_type.value != null) {
                    this.pos1 = $(document.createElement('input')).attr({'type': 'text', 'value': this.order_type.value[0][0], 'size': 12});
                    this.pos2 = $(document.createElement('input')).attr({'type': 'text', 'value': this.order_type.value[0][1], 'size': 12});
                    this.pos3 = $(document.createElement('input')).attr({'type': 'text', 'value': this.order_type.value[0][2], 'size': 12});
                } else {
                    this.pos1 = $(document.createElement('input')).attr({'type': 'text', 'value': 0, 'size': 12});
                    this.pos2 = $(document.createElement('input')).attr({'type': 'text', 'value': 0, 'size': 12});
                    this.pos3 = $(document.createElement('input')).attr({'type': 'text', 'value': 0, 'size': 12});
                }
                $('#order-component-create-order').append(this.order_type.name, this.order_type.description, ("<br />"), this.pos1, ("<br />"), this.pos2, ("<br />"), this.pos3, ("<br />"));
            };

            this.getValue = function() {
                return array2json([this.pos1.val(), this.pos2.val(), this.pos3.val()]);
            };
        };

        /**
         * Inline class: time argument panel
         */
        function TimeArgumentPanel() {
            this.time = null;
            this.order_type = null;

            this.build = function(order_type) {
                this.order_type = order_type;

                if(this.order_type.value != null) {
                    this.time = $(document.createElement('input')).attr({'type': 'text', 'value': this.order_type.value[0], 'size': 12});
                } else {
                    this.time = $(document.createElement('input')).attr({'type': 'text', 'value': 0, 'size': 12});
                }
                $('#order-component-create-order').append(this.order_type.name, this.order_type.description, this.time);
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
        OrderComponentClass.prototype.id = null;
        OrderComponentClass.prototype.type = null;
        OrderComponentClass.prototype.args = null;
        OrderComponentClass.prototype.orders = null;

        OrderComponentClass.prototype.setup = function(data) {
            OrderComponent.orders = data;
        };

        OrderComponentClass.prototype.updateOrder = function(order) {
            var temp = new Array();
            for(var i in this.args) {
                temp = temp.concat(this.args[i].getValue());
            }
            var order_position = OrderId2OrderPosition(OrderComponent.orders[OrderComponentClass.id].orders, order.order_id);
            $.ajax({type: "POST", dataType: 'json', data: {'action': 'create before', 'id': OrderComponentClass.id, 'type': parseInt(order.type), 'order_position': order_position, 'args': temp}, url: "/json/order/update/", 
                error: function(req, textstatus) { 
                    UILock.error('Something went wrong, contact administrator or try again later.', true);
                }, 
                success: function(data, textstatus) { 
                    if(data.auth === true) {
                        UserInterface.getOrders(function(data) {
                            OrderComponent.setup(data.orders);
                            OrderComponent.buildOrderPanel(OrderComponentClass.id);
                        });
                    } else {
                        UILock.error(data.error, true);
                    }
                }
            });
        };

        OrderComponentClass.prototype.removeOrder = function(order_id) {
        	//FIX: Does not remove when send order and then press remove
        	 var order_position = OrderId2OrderPosition(OrderComponent.orders[OrderComponentClass.id].orders, order_id);
             $.ajax({type: "POST", dataType: 'json', data: {'action': 'remove', 'id': OrderComponentClass.id, 'order_position': order_position}, url: "/json/order/remove/", 
                error: function(req, textstatus) { 
                    UILock.error('Something went wrong, contact administrator or try again later.', true);
                }, 
                success: function(data, textstatus) { 
                    if(data.auth === true) {
                        UserInterface.getOrders(function(data) {
                            OrderComponent.setup(data.orders);
                            OrderComponent.buildOrderPanel(OrderComponentClass.id);
                        });
                    } else {
                        UILock.error(data.error, true);
                    }
                }
            });          
        };

        OrderComponentClass.prototype.buildOrder = function(subid) {
            this.args = new Array();

            $('#order-component-create-order').html('').append('Create a new order: ', OrderComponent.buildOrderList());
            if(subid == null && OrderComponentClass.type != null) {
                var orderType = OrderComponent.orders[OrderComponentClass.id].order_type[OrderComponentClass.type];
            } else if(subid != null) {
            	var orderType = OrderComponent.orders[OrderComponentClass.id].orders[subid];
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
        };

        OrderComponentClass.prototype.buildOrderList = function() {
        	var counter = 0;
            select = $(document.createElement('select')).attr('id', 'order_list');
            for(var i in OrderComponent.orders[OrderComponentClass.id].order_type) {
                order_type = OrderComponent.orders[OrderComponentClass.id].order_type[i];
                option = $(document.createElement('option')).attr('value', i).text(order_type.name);
                select.append(option);
                counter++;
            }
            if(counter > 0) {
	            return $(document.createElement('div')).append(select,
	                $(document.createElement('input')).attr({'type': 'submit', 'value': 'New order'}).click(function(eventData) {
	                    OrderComponentClass.type = $('#order_list').val();
	                    var sendType = OrderComponent.orders[OrderComponentClass.id].order_type[OrderComponentClass.type].type;
	                    $.ajax({type: "POST", dataType: 'json', data: {'action': 'create before', 'id': OrderComponentClass.id, 'type': sendType}, url: "/json/order/send/", 
	                        error: function(req, textstatus) { 
	                            UILock.error('Something went wrong, contact administrator or try again later.', true);
	                        }, 
	                        success: function(data, textstatus) {
	                            if(data.auth === true) {
	                                UserInterface.getOrders(function(data_extra) {
	                                    OrderComponent.setup(data_extra.orders);
	                                    subid = OrderPosition2OrderId(OrderComponent.orders[OrderComponentClass.id].orders, data.order_position);
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
        };

        OrderComponentClass.prototype.onMapClick = function(eventData) {
        	var queueid = 0;
        	if(ObjectComponent.objects[eventData.target.id] != undefined &&
        			ObjectComponent.objects[eventData.target.id]["Order Queue"] != undefined && 
        			ObjectComponent.objects[eventData.target.id]["Order Queue"]["queueid"] != undefined) 
        		queueid = ObjectComponent.objects[eventData.target.id]["Order Queue"]["queueid"];
            OrderComponent.buildOrderPanel(parseInt(queueid));
        };

        OrderComponentClass.prototype.buildOrderPanel = function(id) {
            // Store selected object id
            OrderComponentClass.id = id;
            
            // Reset selected order
            OrderComponentClass.type = null;

            OrderComponentClass.args = new Array();

            // Reset order component content
            orderComponent = $('#order-component-content').html('');

            // If this object has orders continue
            if(OrderComponentClass.id > 0 && OrderComponent.orders[OrderComponentClass.id]) {
                dl = $(document.createElement('dl'));
                
                
                OrderComponent.orders[OrderComponentClass.id]['orders'] = 
                	sortArrByKey(OrderComponent.orders[OrderComponentClass.id]['orders']);
                
                for(var i in OrderComponent.orders[OrderComponentClass.id]['orders']) {
                    var order_id = OrderComponent.orders[OrderComponentClass.id]['orders'][i].order_id;
                    order = OrderComponent.orders[OrderComponentClass.id]['orders'][i];
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
        };

        return new ObjectComponentClass();
    } )();
    
    /**
     * System object component
     * Handles all the panel for system objects in a galaxy
     */
    var SystemObjectComponent = (function() {
        var SystemObjectComponentClass = function(){};

        // List of all objects
        SystemObjectComponentClass.prototype.objects = null;

        /**
         * Setup object component
         */
        SystemObjectComponentClass.prototype.setup = function(data) {
            SystemObjectComponent.objects = data;
            $("#system-planet-component").hide();
        };
           
        /**
         * Event: onMapClick
         */
        SystemObjectComponentClass.prototype.onMapClick = function(eventData) {
		    if(eventData.target.id == 'map-viewport') {
		    	$("#system-planet-component").hide();
		    }
		    else {
		    	id = parseInt(eventData.target.id);
			    object = SystemObjectComponent.objects[id];
		    	
		    	if(object.contains.length > 0) {
		    		$("#system-planet-component").show();
				    posX = parseInt(eventData.clientX);
				    posY = parseInt(eventData.clientY);
				    $("#system-planet-component").css("top", posY).css("left", posX);
				    
				    infoComponent = $("#system-planet-component-content").html("");
				    dl = $(document.createElement("dl"));
				    infoComponent.append(dl);				    
				    
					ul = $(document.createElement('ul')).addClass('tree-list');
					for(var i in object.contains) {
					    toplevel = SystemObjectComponent.objects[object.contains[i]];
					    li = $(document.createElement('li')).addClass("icon").css("background-image", "url("+toplevel.Icon+")");
					    a = $(document.createElement('a')).attr({'href': '#info/' + toplevel.id, 'id': toplevel.id})
					    	.text(toplevel.name).one('click', SystemObjectComponent.onMapClick).one('click', ObjectComponent.onMapClick);
					    ul.append(li.append(a));
					    if(toplevel.contains.length > 0) {
							subul = $(document.createElement('ul'));
							li.append(subul);
							for(var j in toplevel.contains) {
							    sublevel = SystemObjectComponent.objects[toplevel.contains[j]];
							    
							    subli = $(document.createElement('li')).addClass("icon").css("background-image", "url("+sublevel.Icon+")");
							    a = $(document.createElement('a')).attr({'href': '#info/' + sublevel.id, 'id': sublevel.id}).text(sublevel.name).one('click', ObjectComponent.onMapClick);
							    subul.append(subli.append(a));
							}
					    }
					}
					dl.append(ul);
		    		
		    	
			    }
		    	else {
		    		$("#system-planet-component").hide();
		    	}
		    }
        	return false;
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
        
            // Setup ObjectComponent
            ObjectComponent.setup(data.objects);
            
            //Setup SystemObjectComponent
            SystemObjectComponent.setup(data.objects);

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

                OrderComponent.setup(data.orders);

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
        $('#mapdiv').live('click', function(eventData) {
        	SystemObjectComponent.onMapClick(eventData);
        });
        $('#mapdiv .starsystem, #mapdiv .fleet').live('click', function(eventData) {
            OrderComponent.onMapClick(eventData);
            ObjectComponent.onMapClick(eventData);
            SystemObjectComponent.onMapClick(eventData);
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
