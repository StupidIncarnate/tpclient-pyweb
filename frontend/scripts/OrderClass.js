/**
* Order component
*/
OrderComponent = (function() {
		
		/**
		 * Grabs the Order Queue num if there is one
		 */
		function hasQueue(obj) {
			
			if(obj["Order Queue"] != undefined && 
			   obj["Order Queue"]["queueid"] != undefined && 
			   obj["Order Queue"]["queueid"] != 0) {
				return obj["Order Queue"]["queueid"];
			} else {
				return 0;
			}
		
		}
		
		/**
		 * Checks if there are orders
		 */
		function hasOrders(queueid) {
			
			if(OrderComponent.orders[queueid] != undefined &&
			   OrderComponent.orders[queueid]["orders"] != undefined &&
			   objKeyCount(OrderComponent.orders[queueid]["orders"]) > 0) {
				return OrderComponent.orders[queueid]["orders"];
			}             
			else {
				return 0;
			}
		}
		
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
                for(var i in ObjectClass.objects) {
                    if(ObjectClass.objects[i].id == value) {
                        this.object.append($(document.createElement('option')).attr({'selected': 'selected', 'value': ObjectClass.objects[i].id}));
                    } else {
                        this.object.append($(document.createElement('option')).attr({'value': ObjectClass.objects[i].id}));
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
        		TaskManager.Click.orderType = orderType;
        		TaskManager.Click.setCoordinateOrder();
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
        OrderComponentClass.prototype.currentOrderType = null;
        
        OrderComponentClass.prototype.coordinates = [];
        
        OrderComponentClass.prototype.orderID = null;
        
        OrderComponentClass.prototype.setup = function(data) {
            OrderComponent.orders = data;
        };
        
        OrderComponentClass.prototype.setCoordinates = function(endPos) {
        	
        	OrderComponent.coordinates = endPos;
        	OrderComponent.updateOrder(OrderComponent.orders[queueid].order_type[orderTypeID]);
        	
        };
        
        OrderComponentClass.prototype.sendOrder = function(queueID, menuID){
        	
        	$.ajax({type: "POST", dataType: 'json', data: {'action': 'create before', 'id': queueID, 'type': menuID}, url: "/json/order/send/", 
                error: function(req, textstatus) { 
                    UserInterface.UILock.error('Something went wrong, contact administrator or try again later.', true);
                }, 
                success: function(data, textstatus) {
                    if(data.auth === true) {

                        UserInterface.getOrders(function(data_extra) {
                        	OrderComponent.setup(data_extra.orders);
                        	
                            orderid = OrderPosition2OrderId(OrderComponent.orders[OrderComponent.queueid].orders, data.order_position);
                                  
                        	if(orderid != undefined) { 
                        		
                        		var orderTypeObj = OrderComponent.orders[OrderComponent.queueid].orders[orderid];
                        		
                        		OrderComponent.currentOrderType = orderTypeObj;
                        		OrderComponent.buildOrderPanel(orderTypeObj);
                        		
                        	}
                                                    
                        });
                    } else {
                        UserInterface.UILock.error(data.error, true);
                    }
                }
            });
        	
        };
        
        //old
        OrderComponentClass.prototype.updateOrder = function() {
        	
        	Map.removeCrossHairs();
        	
        	var order = OrderComponent.currentOrderType;
        	
            var temp = new Array();
            for(var i in this.args) {
                temp = temp.concat(this.args[i].getValue());
            }
            var order_position = OrderId2OrderPosition(OrderComponent.orders[OrderComponent.queueid].orders, order.order_id);
            
            $.ajax({type: "POST", dataType: 'json', data: {'action': 'create before', 'id': OrderComponent.queueid, 'type': parseInt(order.type), 'order_position': order_position, 'args': temp}, url: "/json/order/update/", 
                error: function(req, textstatus) { 
                    UserInterface.UILock.error('Something went wrong, contact administrator or try again later.', true);
                }, 
                success: function(data, textstatus) { 
                	
                	WindowClass.InfoWindow.removeLoader();
                	
                    if(data.auth === true) {
                        UserInterface.getOrders(function(data) {
                            OrderComponent.setup(data.orders);
                            
                            WindowClass.InfoWindow.onItemClick(OrderComponent.objid);
                            
                            // Add orders to map for coordinate drawing
                            Map.addOrders(data.orders);
                            
                            // Draw Map
                            Map.draw();
                            
                            //Reinstigate css event elements
                            UserInterface.initCssEvents();
                        });
                    } else {
                        UserInterface.UILock.error(data.error, true);
                    }
                }
            });
            
            OrderComponent.orderID = null;
            OrderComponent.currentOrderType = null;
            
        };
        //Old
        OrderComponentClass.prototype.removeOrder = function(order_id) {
        	
        	if(order_id == undefined) {
        		var order = OrderComponent.currentOrderType;
        		order_id = order.order_id;
        	}
        	
        	TaskManager.Click.removeCoordinateCommand();
        	
        	//FIX: Does not remove when send order and then press remove
        	 var order_position = OrderId2OrderPosition(OrderComponent.orders[OrderComponent.queueid].orders, order_id);
             $.ajax({type: "POST", dataType: 'json', data: {'action': 'remove', 'id': OrderComponent.queueid, 'order_position': order_position}, url: "/json/order/remove/", 
                error: function(req, textstatus) { 
                    UserInterface.UILock.error('Something went wrong, contact administrator or try again later.', true);
                }, 
                success: function(data, textstatus) { 
                    if(data.auth === true) {
                        UserInterface.getOrders(function(data) {
                            OrderComponent.setup(data.orders);
                            WindowClass.InfoWindow.onItemClick(OrderComponent.objid);
                            
                            // Add orders to map for coordinate drawing
                            Map.addOrders(data.orders);
                            
                            // Draw Map
                            Map.draw();
                            
                            //Reinstigate css event elements
                            UserInterface.initCssEvents();
                            
                        });
                    } else {
                        UserInterface.UILock.error(data.error, true);
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
        
        OrderComponentClass.prototype.buildOrderPanel = function(orderType) {
        	//Reinitiate Clicking for the object that was right-clicked
        	TaskManager.Click.clickObjectDisabled = 0;
        	        	
        	this.args = new Array();
            
        	if(orderType == undefined)
        		return false;
           
        	/*if(subid == null && OrderComponentClass.type != null) {
                var orderType = OrderComponent.orders[OrderComponent.queueid].order_type[OrderComponentClass.type];
            } else if(subid != null) {
            	var orderType = OrderComponent.orders[OrderComponent.queueid].orders[subid];
            } else {
                return false;
            }*/
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
            
            orderpanel = $(document.createElement("div")).attr("id", "content");
            orderpanel.append($(document.createElement('h5')).css({'margin': 0, 'padding': 0}).text(orderType.name));
            
            if(TaskManager.Click.getCoordinateOrder()) {
            	
            	/*
            	var panel = WindowClass.InfoWindow.constructBase("order-panel", OrderComponent.removeOrder);
            	
            	$text = $(document.createElement("p")).text("Click anywhere on the map or list on the right to select a move destination.");
            	panel.append($text);
            	
            	 WindowClass.InfoWindow.removeLoader();
                 //WindowClass.InfoWindow.returnCurrentWin().append(orderpanel.children());
            	*/
            	
            	WindowClass.InfoWindow.removeLoader();
            	Map.setCrossHairs();
            	
            	
            } else if(orderType.args.length == 0) {
            	
            	OrderComponent.updateOrder();
            	//TaskManager.Window.removeObject();
            	
            } else {
              	
            	var panel = WindowClass.InfoWindow.constructBase("order-panel", OrderComponent.removeOrder);
            	
            	panel.append(orderdata);
            	update = $(document.createElement('input')).attr({'type': 'submit', 'value': 'Update Order'}).click(function(eventData) {
            		parent = $(this).parent();
            		$(this).empty();
            		parent.append($(document.createElement('img')).attr({'src': "/images/loadingCircle.gif"}).css({ 'width': '20px', 'height': '20px'}))
                    OrderComponent.updateOrder();
            		
                    return false;
                });
                
                panel.append(update);
                
                WindowClass.InfoWindow.removeLoader();
                //WindowClass.InfoWindow.returnCurrentWin().append(orderpanel.children());
            }
            
           
        };
        OrderComponentClass.prototype.constructOrdersMenu = function(eventData, cssobject) {
        	
        	id = parseInt(cssobject.attr('id'))
        	obj = ObjectClass.objects[id];
        	
        	if(queueid = hasQueue(obj)) {	    		
	    		var x = eventData.pageX;
	    		var y = eventData.pageY;
	    		
	    		if(queueid != undefined && queueid != null) {
	    			OrderComponent.objid = id;
	    			OrderComponent.queueid = queueid;
	    			
	    			TaskManager.Window.registerObject("#order-menu");
	    			
	        		div = $(document.createElement('div')).attr('id', 'order-menu').css({'top': y+'px', 'left': x+'px'});
	        		ul = $(document.createElement('ul'));
	        		div.append(ul);
	        		
		        	for(var i in OrderComponent.orders[queueid].order_type) {
		                order_type = OrderComponent.orders[queueid].order_type[i];
		                li = $(document.createElement('li')).attr('value', i).attr('queueid', queueid).text(order_type.name).click(function(eventData){
		                	
		                	orderTypeID = $(this).attr('value');
		                	queueid = parseInt($(this).attr('queueid'));
		                	
		                	orderTypeObj = OrderComponent.orders[queueid].order_type[orderTypeID];
		                	OrderComponent.sendOrder(queueid, orderTypeObj.type);
		                	
		                	WindowClass.InfoWindow.constructLoader();
		                	
		                	return false;
		                	
		                }).mouseenter(function() {  
		                	  $(this).addClass("order-menu-roll")
		    	        }).mouseleave(function() {
		    	        	  $(this).removeClass("order-menu-roll");
		    	        });
		                
		                ul.append(li);
		            }
		        	
		        	// This is to keep the rollover map item active
		        	cssobject.append(div);
	        	}
	    	}
        	
        };
        
        OrderComponentClass.prototype.constructCurrentOrders = function(id) {
        	
        	function constructControls(counter, totalOrders) {
        		orderControl = $(document.createElement('div')).addClass('ordercontrols');
           
                asc = $(document.createElement('img')).attr("src", "/images/asc.png");
                desc = $(document.createElement('img')).attr("src", "/images/desc.png");
            	remove = $(document.createElement('img')).attr("src", "/images/delete.png");
                
            	//Determine which buttons to disable
                if(counter == 0) { 
                	asc.attr('class', 'disabled');
                }else {
                	asc.click(OrderComponent.ascendOrder);
                }
                
                if(counter + 1 == totalOrders) 
                	desc.attr('class', 'disabled');
                else 
                	desc.click(OrderComponent.descendOrder);
            	
                
                orderControl.append(asc).append(desc).append(
                		$(document.createElement('a')).attr({'id': order.order_id, 'href': '#'}).append(remove).click(function(eventData) {
                			$(this).parent().empty().append($(document.createElement('img')).attr({'src': "/images/loadingCircle.gif"}).css({ 'width': '20px', 'height': '20px'})) 
                			//alert($(this).parent().attr('id'));
                			OrderComponent.removeOrder(eventData.currentTarget.id);
	                    })
	            );
        		
                return orderControl;
        	}
        	
        	var $ordersContain = $(document.createElement("div"))
        							.attr("id", "order-list");
        	
        	OrderComponent.objid = id;
        	obj = ObjectClass.objects[id];
        	if(queueID = hasQueue(obj)) {
        		
        		// Store selected object id
	            OrderComponent.queueid = queueID;
	            OrderComponentClass.args = new Array();
	            
        		$ordersContain.append($(document.createElement('h4')).text("Orders"))
        		
        		if(orders = hasOrders(queueID)) {
        			OrderComponent.orders[queueID]['orders'] = sortArrByKey(orders);
        			
        			orderCounter = 0;
        			numOrders = objKeyCount(orders);
        			
        			for(var i in orders) {
	                    var order_id = orders[i].order_id;
	                    order = orders[i];
	                    
	                    dh = $(document.createElement('dh'));
	                    dt = $(document.createElement('dt')).text(order.turns + ' turns');
	                    dd = $(document.createElement('dd'));
	                    
	                    dd.append(constructControls(orderCounter, numOrders));
	                    
	                    
	                    if(order.name != "Move") {
	                    	ordername = order.name;
	                    	if(order.name.length > 10)
	                    		ordername = ordername.substring(0, 9) + "...";
	                    	
	                        dd.append($(document.createElement('a')).attr({'orderid': order.order_id,  'href': '#', 'title': order.description}).text(ordername).click(function(eventData) {
	                        	var orderid = $(this).attr("orderid");
	                        	var orderTypeObj = OrderComponent.orders[OrderComponent.queueid].orders[orderid];
	                        	
	                        	WindowClass.InfoWindow.constructBase("order-panel");
	                        	OrderComponent.currentOrderType = orderTypeObj;
	                        	OrderComponent.buildOrderPanel(orderTypeObj);
	                        	
	                        }));
	                    } else {
	                    	dd.append($(document.createElement('span')).attr({'orderid': order.order_id, 'title': order.description}).text(order.name));
	                    }
	                    
	                    //orderControl.append(asc).append(desc).append(remove);
	                    
	                    $ordersContain.append(dh.append(dt).append(dd));
	                    orderCounter++;
	                }
        			
        			
        		} else {
        			$ordersContain.append("No given orders!");      				
        		}
        	}
        	
        	return $ordersContain;
        };
        
        return new OrderComponentClass();
    } )();

