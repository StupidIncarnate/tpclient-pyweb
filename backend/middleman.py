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

object_type = ['Universe', 'Galaxy', 'Star System', 'Planet', 'Fleet', 'Wormhole']

"""defaults = {
    constants.ARG_ABS_COORD: [0,0,0],
    constants.ARG_TIME: [0, 0],
    constants.ARG_OBJECT: [0],
    constants.ARG_PLAYER: [0,0],
    constants.ARG_STRING: [0, ""],
    constants.ARG_LIST: [[], []],
    constants.ARG_RANGE: [-1, -1, -1, -1],
}"""

cache = None

def getPropertyList(obj):
    """
    Get a list of the position references of a DynamicObject as tuples.
    Each tuple has the form: (x, y, z, coord name)
    """
    
    """Loop through the type of paramaters an object might have"""
    """
    for key in objects.parameters.ObjectParamsMapping:
        print key, objects.parameters.ObjectParamsMapping[key]
        print objects.parameters.ObjectParamsMapping[key].kw
    """
    #print "==========================="
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
                        
                    #if type(subproperty_list) == Structures.ListStructure.ListProxy:
                        """for something in subproperty_list:
                            print something
                        print "List Proxy===================="
                        print subproperty
                        print type(subproperty)
                        print subproperty_list
                        print len(subproperty_list)
                        print type(subproperty_list)
                        print "===================="
                        """
                
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
            #print "&&&&&&&&Printing var list&&&&&", variable_list
            counter += 1
            #if type(variable) == Structures.GroupPoxy:
            
            
    #print "Printing Properties List", propertieslist
    #print "===================="
    
    return propertieslist

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
        node = self.cache.orders[id][order_id]
        evt = self.cache.apply('orders', 'remove', id, nodes=[node])
        apply(conn, evt, self.cache)
        #self.cache.save()

    def updateOrder(self, conn, id, type, order_id, moreargs):
        """Not sure if this is the correct way, but it works"""
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

    def sendOrder(self, conn, id, type, moreargs):
        # sequence, id, slot, type, turns, resources
        args = [0, id, -1, type, 0, []]

        # get orderdesc so we can get default args for order type
        orderdesc = objects.OrderDescs()[type]
        """for name, type in orderdesc.names:
            args += defaults[type]
        """
        
        # Create the new order
        new = objects.Order(*args)
        new._dirty = True

        # Insert order after
        node = self.cache.orders[id].last
        assert not node is None

        # Do some sanity checking
        d = self.cache.orders[id]
        assert node in d

        evt = self.cache.apply("orders", "create after", id, node, new)
        apply(conn, evt, self.cache)
        #self.cache.save()

    def get_args(self, orderdesc, order=None):
        args = []

        # Loop through all arguments for this order description
        for name, subtype in orderdesc.names:
            name_text = name.title().replace('_', '')

            # Get type and if order also get current value
            type = None
            """if subtype == constants.ARG_ABS_COORD:
                type = 'coordinate'
            elif subtype == constants.ARG_LIST:
                type = 'list'
            elif subtype == constants.ARG_STRING:
                type = 'string'
            elif subtype == constants.ARG_TIME:
                type = 'time'
            elif subtype == constants.ARG_OBJECT:
                type = 'object'
            """
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
                print "Orders: ", orders
                print orderTypes
                print "-------------------"
               
                
                """Fix"""    
                    
                # If we have orders for this object or the object can receive orders
                
                if orders.numorders > 0:
                    print("Processing Orders")
                    # Build the initialize structure for this object and its orders
                    return_data[i] = {'orders': {}, 'order_type': []}
    
                    # Go through all orders currently on the object
                    for listpos, node in enumerate(orders):
                        order = node.CurrentOrder
                        orderdesc = objects.OrderDescs()[order.subtype]
    
                        if hasattr(orderdesc, 'doc'):
                            desc = orderdesc.doc
                        else:
                            desc = orderdesc.__doc__
                            desc = desc.strip()
    
                        args = self.get_args(orderdesc, order)
    
                        return_data[i]['orders'][int(node.id)] = {
                            'order_id': int(node.id),
                            'name': safestr(order._name),
                            'description': safestr(desc),
                            'type': order.subtype,
                            'turns': order.turns,
                            'args': args}
    
                    # Go through all possible orders this object can receive
                    for type in object.order_types:
    
                        # If type is not recognized, ignore it
                        if not objects.OrderDescs().has_key(type):
                            continue
    
                        # Retrive order description
                        orderdesc = objects.OrderDescs()[type]
                        if hasattr(orderdesc, 'doc'):
                            desc = orderdesc.doc
                        else:
                            desc = orderdesc.__doc__
                            desc = desc.strip()
    
                        args = self.get_args(orderdesc)
    
                        return_data[i]['order_type'].append({
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
    