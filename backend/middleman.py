# Python imports
import time, socket
try:
    import json
except ImportError, e:
    import simplejson as json

# Local imports
from backend.utils import safestr
import tp.client.threads
from tp.netlib.client import url2bits
from tp.netlib import Connection
from tp.netlib import failed, constants, objects
from tp.client.cache import Cache, apply
from tp.client.objectutils import *
from tp.client.ChangeList import ChangeList

object_type = ['Universe', 'Galaxy', 'Star System', 'Planet', 'Fleet', 'Wormhole']

"""
defaults = {
    constants.ARG_ABS_COORD: [0,0,0],
    constants.ARG_TIME: [0, 0],
    constants.ARG_OBJECT: [0],
    constants.ARG_PLAYER: [0,0],
    constants.ARG_STRING: [0, ""],
    constants.ARG_LIST: [[], []],
    constants.ARG_RANGE: [-1, -1, -1, -1],
}
"""
cache = None

def getPropertyList(obj):
    """
    Examines an objects properties structure and outputs a nested dict of the entire thing for use
    by the javascript portion of tpweb
    
    """
    #print "Getting Property List of object", obj.__dict__
    propertieslist = {}
    counter = 0
    variable_list = {}
    for propertygroup in obj.properties:
        if type(propertygroup) != Structures.GroupStructure:
            continue       
        for property in propertygroup.structures: #Position
            #print counter
            
            property_list = getattr(obj, propertygroup.name) #Gets Positional List
            def propertyparselist(property, property_list):
                """Todo: Relative Position/Vector needs to be accounted for"""
                #print property_list
                #print "Property_list size: ",len(property_list)
                vardict = {}
                subvardict = {}
                if property.__dict__.has_key('structures'): #Is group sturcture
                    subproperty_list = getattr(property_list, property.name) #Gets Position list
                    for subproperty in property.structures:
                        subvardict.update(propertyparselist(subproperty, subproperty_list))
                
                if(len(subvardict) > 0):
                     vardict[safestr(property.name)] = subvardict
                else: #Is not a group structure
                    #print "===================="
                    if type(property_list) == Structures.ListStructure.ListProxy:
                        for key, value in enumerate(property_list):
                            vardict[key] = value
                    elif type(property_list) == Structures.GroupStructure.GroupProxy:
                        vardict[safestr(property.name)] = safestr(getattr(property_list, property.name))
                    else:
                        print property
                        print type(property)
                        print property_list
                        print type(property_list)
                        print "===================="
                    
                    #print property_list, property.name, type(property)
                    #print vardict
                return vardict
                
            propertieslist.update(propertyparselist(property, property_list))
            counter += 1
            
            
    #print "Printing Properties List", propertieslist
    #print "===================="
    
    return propertieslist
def searchPropertyList(propertylist, attribute, found=False):
#    print "Find this attribute: ", attribute
#    print "Propertylist incoming: ", propertylist
#    print type(propertylist)
    if type(propertylist) == type(dict()) and len(propertylist) > 0:
        for keys in propertylist.keys():
            if keys == attribute:
                return propertylist[keys], True
            else:
                propertyl, found = searchPropertyList(propertylist[keys], attribute)
                if found:
                   #print "returning attribute: ", attribute, " ", propertyl
                   return propertyl, True
    return None, False 

def insertDummyOrder(args, orderdesc):
    print "InsertDummyOrder"
    for property in orderdesc.properties:
        print "InsertDummy prop ", property 
        if isinstance(property, parameters.OrderParamAbsSpaceCoords):
            args += [[[0, 0, 0]]]
        elif isinstance(property, parameters.OrderParamList):
            args += [[[], []]]
        elif isinstance(property, parameters.OrderParamString):
            args += [[0, ""]]
        elif isinstance(property, parameters.OrderParamTime):
            args += [[0, 0]]
        elif isinstance(property, parameters.OrderParamObject):
            args += [[0, []]]
    print args
    return args

def applyArgNesting(args, moreargs, orderdesc):
    counter = 0
    for property, arg in zip(orderdesc.properties, moreargs):
        print "ApplyArgNesting prop ", property
        if isinstance(property, parameters.OrderParamAbsSpaceCoords):
            args += [[moreargs[counter]]]
        elif isinstance(property, parameters.OrderParamList):
            shipargslist = []
            for shipargs in arg:
                shipslist = []
                for ships in shipargs: #THrough the ship list
                    shipproptup = ()
                    shipproplist = []
                    for shipprop in ships:
                        if len(ships) == 3:
                            shipproptup = shipproptup + (shipprop,)
                        else:
                            shipproplist.append(shipprop)
                    if len(shipproplist) > 0:
                        shipslist += [shipproplist]
                    else:    
                        shipslist += [shipproptup]
                shipargslist += [shipslist]
            args += [shipargslist]
            print "Finalized args", args
        elif isinstance(property, parameters.OrderParamString):
            args += [moreargs[counter]]
        elif isinstance(property, parameters.OrderParamTime):
            args += [moreargs[counter]]
        elif isinstance(property, parameters.OrderParamObject):
            args += [moreargs[counter]]
        counter = counter + 1
    
    print "Returning"    
    return args
            
def checkIfOrdersSame(order1, order2):
    #check if both are None
    if order1 is None and order2 is None:
        return True
    #check the type
    if type(order1) != type(order2):
        return False
    #check the name
    if order1._name != order2._name:
        return False
    #check the order arguments
    if order1.properties != order2.properties:
        return False
    return True

def findOrderDesc(name):
    name = name.lower()
    for d in OrderDescs().values():
        if d._name.lower() == name:
            return d
def findNnodeIdInHead(headnode, nodeId):
    for id, node in enumerate(headnode):
        print "FindNodeId ", id, node.__dict__
        print node.id
        if node.id == nodeId:
            return node
    return None
    
class FriendlyObjects(object):
    def __init__(self, cache):
        self.cache = cache

    def build(self):
        ret = {}
        print("Build Object Data Structure")
        for i in self.cache.objects:
            obj = self.cache.objects[i]
            
            if i == 0:
                print obj.__dict__
            """
            for key, value in obj.__dict__.iteritems():
                print key, "-", value
            print("-------------")
            """
            ret[obj.id] = {
                'name': safestr(obj.name),
                'id': obj.id,
                'type': {'id': obj.subtype, 'name': object_type[obj.subtype]},
                #'size': obj.size,
                'contains': obj.contains
            }
            
            ret[obj.id].update(getPropertyList(obj))
            
            if hasattr(obj, 'parent'):
                ret[obj.id]['parent'] = obj.parent
            
            """fix: Convert owner to name"""
            
            #print "====================================================="
            #print ret[obj.id]
            """
            if objPosList:
                newObjPosList = objPosList[0][0:len(objPosList[0])-1]
                ret[obj.id]['pos'] = newObjPosList
            
            TODO size
            
            Fix
            if hasattr(obj, 'vel'):
                ret[obj.id]['vel'] = obj.vel

            if hasattr(obj, 'parent'):
                ret[obj.id]['parent'] = obj.parent
            
            ownerList = getOwner(cache, i)
            if ownerList:
                ret[obj.id]['owner'] = ownerList
    
            if hasResources(cache, i):
                ret[obj.id]['resources'] = getResources(cache, i)
            
            Fix
            if hasattr(obj, 'damage'):
                ret[obj.id]['damage'] = obj.damage

            FIX
            if hasattr(obj, '__Ships'):
                print("Has Ships")
                #ret[obj.id]['ships'] = obj.ships
            """
        print "Done With Building Items"
        return ret

class Orders(object):
    """Parse order data and convert it to json friendly structures"""
    def __init__(self, cache):
        """Initialize"""
        self.cache = cache

    def removeOrder(self, conn, id, order_id):
        queue = self.cache.orders[id]
        node = queue.first
        evt = self.cache.apply('orders', 'remove', id, nodes=[node])
        apply(conn, evt, self.cache)
        
        #return self.cache
        
        """
        node = self.cache.orders[id][order_id]
        evt = self.cache.apply('orders', 'remove', id, nodes=[node])
        apply(conn, evt, self.cache)
        #self.cache.save()
        """

    def updateOrder(self, conn, id, type, order_id, moreargs):
        """Not sure if this is the correct way, but it works"""
        args = [0, id, -1, type, 0, []]
        # Really stupid hack that makes me crazy, http post forms converts
        # everything into strings and I dont want to process the args seperatly
        # on the backend side.
        def recur_map(func, data):
            print "Entering recur map", data
            if hasattr(data, '__iter__'):
                print "hasiter attri"
                args = []
                for elem in data:
                    args.append(recur_map(func, elem))
                # [recur_map(func, elem) for elem in data]
                return args
            else:
                print "else"
                try:
                    return func(data)
                except ValueError:
                    print "except"
                    return data
        
        moreargsProcessed = []
        if moreargs:
            for arg in moreargs:
                moreargsProcessed.append(recur_map(int, json.loads(arg)))

        print moreargsProcessed
        
        # Create the new order
        ordertype = objects.OrderDescs()[type]
        print ordertype
        
        args = applyArgNesting(args, moreargsProcessed, ordertype)
        print "ttttt", args
        order = ordertype(*args)
        order._dirty = True
        queue = self.cache.orders[int(id)]
        node = queue.first
        
        #ordernode = findNnodeIdInHead(queue, order_id)
        if order != None:
                print "Printing updateorder args: ", args
        
                evt = self.cache.apply("orders", "change", id, node, order)
                apply(conn, evt, self.cache)
        
        #return self.cache
        """
        args = [0, id, -1, type, 0, []]
        # Really stupid hack that makes me crazy, http post forms converts
        # everything into strings and I dont want to process the args seperatly
        # on the backend side.
        def recur_map(func, data):
            if hasattr(data, '__iter__'):
                return [recur_map(func, elem) for elem in data]
            else:
                try:
                    return func(data)
                except ValueError:
                    return data

        if moreargs:
            for arg in moreargs:
                args += recur_map(int, json.loads(arg))

        # Create the new order
        new = objects.Order(*args)
        new._dirty = True

        node = self.cache.orders[id][order_id]
        assert not node is None

        # Do some sanity checking
        d = self.cache.orders[id]
        assert node in d

        evt = self.cache.apply('orders', 'change', id, node, new)
        apply(conn, evt, self.cache)
        #self.cache.save()
        """


    def sendOrder(self, conn, id, type, moreargs):
        print "Sending Orders ", type
        # sequence, id, slot, type, turns, resources
        args = [0, id, -1, type, 0, []]
        
        # get orderdesc so we can get default args for order type
        #orderdesc = objects.OrderDescs()[type]
        ordertype = objects.OrderDescs()[type]
        args = insertDummyOrder(args, ordertype);
        order = ordertype(*args)
        order._dirty = True
        queue = self.cache.orders[id]
        node = queue.first
        print "Printing sendorder args: ", args
        
        if order != None and queue.first.CurrentOrder is None:
            #make a new order
            evt = self.cache.apply("orders", "create after", id, node, order)
            #print evt
            apply(conn, evt, self.cache)
        else: 
            print "What am I supposed to do?"
        print "order done?"
        """
        print "meeeeh"       
        print orderdesc.__dict__
        print type
        print id 
        
        orderqueuelist = getOrderQueueList(self.cache, id)
                
        # FIXME: Should do something about multiple order queues here.
        print orderqueuelist[0][1]
        queue = self.cache.orders[orderqueuelist[0][1]]
        print "que ", queue
        """
        """
        def findOrderDesc(name):
            name = name.lower()
            for d in OrderDescs().values():
                if d._name.lower() == name:
                    return d
        """
        """
        order = objects.Order(*args)
        queueid, found = searchPropertyList(getPropertyList(self.cache.objects[id]), "queueid")
        queueid = int(queueid)
        queue = self.cache.orders[queueid]
        node = queue.first
        
        print "---------------"
        print queueid
        print queue.__dict__
        print node.__dict__
        
        if order != None and queue.first.CurrentOrder is None:
            #make a new order
            evt = cache.apply("orders", "create after", queueid, node, order)
            print evt
            apply(conn, evt, cache)
        print ".............."
        print order.__dict__
        """
        """        
        # Create the new order
        new = objects.Order(*args)
        new._dirty = True
        
        queueid, found = searchPropertyList(getPropertyList(self.cache.objects[id]), "queueid")
        queueid = int(queueid)
        
        # Insert order after
        node = self.cache.orders[queueid].last
        print node
        assert not node is None
        
        # Do some sanity checking
        d = self.cache.orders[queueid]
        print d, node
        assert node in d
        print "reading for evt"
        evt = self.cache.apply("orders", "create after", queueid, node, new)
        print evt
        apply(conn, evt, self.cache)
        print "____Sent Orders Sent_____"
        return self.cache
        #self.cache.save()
        """
        return self.cache
    
    def get_args(self, orderdesc, order=None):
        args = []
        
        for property in orderdesc.properties:
            name = property.name
            name_text = name.title().replace('_', '')
            
            print name, property
            type = None
            if isinstance(property, parameters.OrderParamAbsSpaceCoords):
                type = 'coordinate'
            elif isinstance(property, parameters.OrderParamList):
                type = 'list'
            elif isinstance(property, parameters.OrderParamString):
                type = 'string'
            elif isinstance(property, parameters.OrderParamTime):
                type = 'time'
            elif isinstance(property, parameters.OrderParamObject):
                type = 'object'
            else:
                 print "Unknown Type"
                
            #name_text = orderdesc._name
            #description = orderdesc.doc
            print "value"
            value = None
            if order:
                print "Has order"
                value = list(getattr(order, name))
                def recur_map(func, data):
                    if hasattr(data, '__iter__'):
                        return [recur_map(func, elem) for elem in data]
                    else:
                        return func(data) 
    
                value = recur_map(safestr, value)
            print "Appending to args"
            #args.append({'name': safestr(name_text), 'type': type, 'description': safestr(getattr(orderdesc, name+'__doc__')), 'value': value})
            args.append({'name': safestr(name_text), 'type': type, 'description': safestr(property.description), 'value': value})
        
        #value = None
        #args.append({'name': safestr(name_text), 'type': type, 'description': safestr(description), 'value': value})
        
        """
            TODO MAYBE IF NEEDED    
            elif isinstance(property, parameters.OrderParamPlayer):
                args += [[0, 0]]
            elif isinstance(property, parameters.OrderParamRange):
                args += [[-1, -1, -1, -1]]
            elif isinstance(property, parameters.OrderParamReference):
                args += [[0, [0]]]
            elif isinstance(property, parameters.OrderParamReferenceList):
                args += [[[0], [0]]] OrderComponent
            elif isinstance(property, parameters.OrderParamResourceList):
                args += [[[0,0], 0, 0, [0,0]]]
            elif isinstance(property, parameters.OrderParamGenericReferenceQuantityList):
                args += [[[0, []], [0, "", 0, [], []], []]]
            else:
                print "Unknown: ", type(property)
                return
            """
        
        """
        if "wait" in orderdesc.__dict__:
            print "momomomom"
        elif "pos" in orderdesc.__dict__:
            
        elif "ships" in orderdesc.__dict__:
            
        elif 
        for name in orderdesc.properties:
            print name
            print name.name
            for thim in name.structures:
                print thim.__dict__
            
        """    
        
        """
        # Loop through all arguments for this order description
        for name, subtype in orderdesc.names:
            name_text = name.title().replace('_', '')
             
            # Get type and if order also get current value
            type = None
           
            if subtype == constants.ARG_ABS_COORD:
                type = 'coordinate'
            elif subtype == constants.ARG_LIST:
                type = 'list'
            elif subtype == constants.ARG_STRING:
                type = 'string'
            elif subtype == constants.ARG_TIME:
                type = 'time'
            elif subtype == constants.ARG_OBJECT:
                type = 'object'
           
            value = None
            if order:
                value = list(getattr(order, name))

                def recur_map(func, data):
                    if hasattr(data, '__iter__'):
                        return [recur_map(func, elem) for elem in data]
                    else:
                        return func(data) 

                value = recur_map(safestr, value)

            args.append({'name': safestr(name_text), 'type': type, 'description': safestr(getattr(orderdesc, name+'__doc__')), 'value': value})
            """
        return args
        
    def build(self):
        """Build json friendly structure"""
        return_data = {}
        for i in self.cache.objects:
            # Retrives object and orders for that object
            object = self.cache.objects[i]
            if hasattr(object, 'Orders'):
                orders = object.Orders
                orders = orders[0]
                orderTypes = getOrderTypes(cache, i)
                queueid = orders.queueid
                """Fix"""    
                    
                # If we have orders for this object or the object can receive orders
                
                #if orders.numorders > 0:
                print("Processing Orders")
                print "Order Count ", orders.numorders
                # Build the initialize structure for this object and its orders
                return_data[queueid] = {'orders': {}, 'order_type': []}
                """
                --------------------
                ordertype = objects.OrderDescs()[type]
                order = ordertype(*args)
                order._dirty = True
                queue = self.cache.orders[id]
                node = queue.first
                
                if order != None and queue.first.CurrentOrder is None:
                    #make a new order
                    evt = self.cache.apply("orders", "create after", id, node, order)
                    #print evt
                    apply(conn, evt, self.cache)
                else: 
                    print "What am I supposed to do?"
                print "order done?"
                ----------------
                """
                
                if orders.numorders > 0:
                    # Go through all orders currently on the object
                    orderobj = self.cache.orders[queueid]
                    for listpos, node in enumerate(orderobj):
                        order = node.CurrentOrder
                        orderdesc = objects.OrderDescs()[order.subtype]
                        print orderdesc
                        if hasattr(orderdesc, 'doc'):
                            desc = orderdesc.doc
                        else:
                            desc = orderdesc.__doc__
                            desc = desc.strip()
                        
                        
                        args = self.get_args(orderdesc, order)
                        print "order args ", args
                        #args = None
                        return_data[queueid]['orders'][int(node.id)] = {
                            'order_id': int(node.id),
                            'name': safestr(order._name),
                            'description': safestr(desc),
                            'type': order.subtype,
                            'turns': order.turns,
                            'args': args}
                        
                        
                if len(orders.ordertypes) > 0:
                    # Go through all possible orders this object can receive
                    for type in orders.ordertypes:
                        # If type is not recognized, ignore it
                        if not objects.OrderDescs().has_key(type):
                            continue
    
                        # Retrive order description
                        orderdesc = objects.OrderDescs()[type]
                        #print orderdesc.__dict__
                        if hasattr(orderdesc, 'doc'):
                            desc = orderdesc.doc
                        else:
                            desc = orderdesc.__doc__
                            desc = desc.strip()
    
                        args = self.get_args(orderdesc)
    
                        return_data[queueid]['order_type'].append({
                            'name': safestr(orderdesc._name),
                            'description': safestr(desc),
                            'type': type,
                            'args': args})
                   
        print("Done Processing Orders")
        return return_data


class Messages(object):
    def __init__(self, cache):
        self.cache = cache

    def build(self):
        return_data = {}
        for i in self.cache.boards:
            board = self.cache.boards[i]
            
            print(type(board))
            print(board.__dict__)

            #return_data[board.id] = {
            #    'id': board.id,
            #    'name': safestr(board.name),
            #    'description': safestr(board.description),
            #    'modify_time': safestr(board.modify_time),
            #    'messages': []
            #}

            return_data[0] = {'number': 0, 'messages': []}

            count = 0
            messages = self.cache.messages[i]
            for listpos, node in enumerate(messages):
                message = node.CurrentOrder
                return_data[0]['messages'].append({
                    'slot': message.slot,
                    'subject': safestr(message.subject),
                    'body': safestr(message.body),
                    'turn': message.turn,
                    #'references': str(message.references)
                })
                count = count + 1

            return_data[0]['number'] = count

        return return_data


class ConnectionError(Exception):
    """Exception used in connect"""
    def __init__(self, value):
        self.value = value

    def __str__(self):
        return str(self.value)

def callback(mode, state, message="", todownload=None, total=None, amount=None):
    """Callback function used when downloading all game data"""
    #print(mode + " - " + state + " - " + message)
    pass

def connect(host, port, username, password):
    """Connect function, used by the backend"""
    try:
        connection = Connection(host=host, port=port, debug=False)
    except socket.error, e:
        raise ConnectionError('Unable to connect to the host.')

    if failed(connection.connect()):
        raise ConnectionError('Unable to connect to the host.')

    if failed(connection.login(username, password)):
        raise ConnectionError('Wrong user name or password.')

    #cache = Cache(Cache.key(host, username)+":"+str(port), configdir='/tmp/tpclient-pyweb/cache/')
    print("--Connection Made--")
    #cache = Cache(Cache.key(host, username)+":"+str(port), configdir='/tmp/tpclient-pyweb/cache/')
    return connection

def createCache(host, port, username, password):
    """Create the initial cache"""
    print("Creating Cache")
    global cache
    #conn = connect(host, port, username, password)
    cache = Cache(Cache.key(host, username)+":"+str(port), configdir='/tmp/tpclient-pyweb/cache/')
    #cache = Cache(Cache.key(host, username)+":"+str(port), configdir='/tmp/tpclient-pyweb/cache/')
    print("Cache Created")

def updateCache(host, port, username, password):
    """Updates the current cache"""
    global cache
    conn = connect(host, port, username, password)
    cache = Cache(Cache.key(host, username)+":"+str(port), configdir='/tmp/tpclient-pyweb/cache/')
    cache.update(conn, callback)
    print("Cache Updated")
    
    return conn, cache

def setCache(cacher):
    global cache
    cache = cacher

def getCache():
    global cache
    return cache
    
    