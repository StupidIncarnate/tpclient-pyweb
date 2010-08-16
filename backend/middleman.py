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
#Don't know how to get the media url from the server. Doesn't look like it comes packed in the cache.
mediaRepoURL = "svn.thousandparsec.net/svn/media/client/"
knownImageUrls = {}


def cacheObjectPrintout(cache):
    """Prints out the data held in the cache, except for the orders"""
    print cache.__dict__
        
    for i in cache.objects:
        print getPropertyList(cache.objects[i])
        print "------------"
    print "================="
    
    """
    print "Printing Orders"
    for listpos, node in enumerate(cache.orders):
        order = node.CurrentOrder
        print "-------------"
    print "================="
    """
    print "Printing Properties"
    for i in cache.properties:
        obj = cache.properties[i]
        print obj.__dict__
        print "------------"
    print "================="
    
    print "Printing Designs"
    for i in cache.designs:
        obj = cache.designs[i]
        print obj.__dict__
        print "------------"
    print "================="
    
    print "Printing Components"
    for i in cache.components:
        obj = cache.components[i]
        print obj.__dict__
        print "------------"
    print "================="
    
    print "Printing Categories"
    for i in cache.categories:
        obj = cache.categories[i]
        print obj.__dict__
        print "------------"
    print "================="
    
    print "Printing Resources"
    for i in cache.resources:
        obj = cache.resources[i]
        print obj.__dict__
        print "------------"
    print "================="
    
    print "Printing Players"
    for i in cache.players:
        obj = cache.players[i]
        print obj.__dict__
        print "------------"
    print "================="

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
            
    return propertieslist
def searchPropertyList(propertylist, attribute, found=False):
    """Searches for a property in an object property list"""
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
        #print "InsertDummy prop ", property 
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
        #print "ApplyArgNesting prop ", property
        if isinstance(property, parameters.OrderParamAbsSpaceCoords):
            args += [[moreargs[counter]]]
        #This has to transform the ship list to a tuple 
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
            #print "Finalized args", args
        elif isinstance(property, parameters.OrderParamString):
            args += [moreargs[counter]]
        elif isinstance(property, parameters.OrderParamTime):
            args += [moreargs[counter]]
        elif isinstance(property, parameters.OrderParamObject):
            args += [moreargs[counter]]
        counter = counter + 1
    
    #print "Returning"    
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

#Finds an order name 
def findOrderDesc(name):
    name = name.lower()
    for d in OrderDescs().values():
        if d._name.lower() == name:
            return d
        
#Gets a node id from a order queue
def findNnodeIdInHead(headnode, nodeId):
    for id, node in enumerate(headnode):
        if node.id == nodeId:
            return node
    return None

#Gets a order node based on the position in the order queue that it is
def getOrderNodeByPosition(queue, position):
    print "Getting OrderNode by pos"
    counter = 0
    if queue.first == queue.last:
        print "No orders"
        return queue.last
    else:
        print "getordernodebyposition else"
        for node in queue:
            #print node.__dict__
            if position == counter:
                return node
            counter += 1
    
    print "Found no ordernode"
    return None
def getImageListFromFile(fileloc):
    """parses through a media-new file list of images and pulls out the locations if they are indeed images"""
    import os
    
    imageArr = {}
    
    if os.path.exists(fileloc):
        filehandle = open(fileloc, 'r')
        for line in filehandle:
            line = line.split(" ")[0].lstrip("./")
            filepathname = line.split(".")[0]
            if len(line.split(".")) > 1:
                ext = line.split(".")[1]
                if ext.endswith(("png", "gif", "jpg")):
                    imageArr[filepathname] = ext
    return imageArr
    
def checkIfImageExists(objectData, mediaListName):
    global knownImageUrls
    
    #Construct Server Image arr
    if len(knownImageUrls) == 0:
        knownImageUrls = getImageListFromFile(mediaListName)
    
    for i in objectData:
        obj = objectData[i]
        for k in ["Media", "Icon"]:
            if k in obj: 
                url = obj[k]
                print "CheckingifImage " + "http://" + mediaRepoURL + url
                if url in knownImageUrls:
                    objectData[i][k] = safestr("http://" + mediaRepoURL + url + "." + knownImageUrls[url]) 
            else:
                obj[k] = ""
    return objectData

class FriendlyObjects(object):
    def __init__(self, cache, mediaListName):
        self.cache = cache
        self.mediaListName = mediaListName

    def build(self):
        global mediaRepoURL
        ret = {}
        noExtensionURLs = {}
        #print("Build Object Data Structure")
        
        #cacheObjectPrintout(self.cache)
        minX = 0
        maxX = 0
        minY = 0
        maxY = 0
        
        for i in self.cache.objects:
            obj = self.cache.objects[i]
            
            #Get Object Type Name
            objdesc = objects.ObjectDescs()[obj.subtype]
            print obj.__dict__
            #The attributes that have no nested elements
            ret[obj.id] = {
                'name': safestr(obj.name),
                'id': obj.id,
                'type': {'id': obj.subtype, 'name': safestr(objdesc._name)},
                #'size': obj.size,
                'contains': obj.contains
            }
            
            ret[obj.id].update(getPropertyList(obj))
            mediaRelativeURLS = getMediaURLs(self.cache, obj.id)            
            
            if "Media" in ret[obj.id]:
                ret[obj.id]["Media"] = ret[obj.id]["Media"]["url"] 
                ret[obj.id]["Media"] = safestr(mediaRelativeURLS["Media"])
            if "Icon" in ret[obj.id]:
                ret[obj.id]["Icon"] = ret[obj.id]["Icon"]["url"]
                ret[obj.id]["Icon"] = safestr(mediaRelativeURLS["Icon"])
            if "Size" in ret[obj.id]:
                ret[obj.id]["Size"] = ret[obj.id]["Size"]["size"]
            if "Year" in ret[obj.id]:
                ret[obj.id]["Year"] = ret[obj.id]["Year"]["value"]
            if "Damage" in ret[obj.id]:
                ret[obj.id]["Damage"] = ret[obj.id]["Damage"]["value"]
                
            #ownerid = getOwner(self.cache, obj.id)
            
            """Fix for relative"""
            if "Position" in ret[obj.id]:
                ret[obj.id]["Position"] = ret[obj.id]["Position"]["vector"]
            if "Velocity" in ret[obj.id]:
                ret[obj.id]["Velocity"] = ret[obj.id]["Velocity"]["vector"]
            
            print type(ret[obj.id]["Position"]["x"]) 
            print type(minX)
            print str(ret[obj.id]["Position"]["x"]) + " " + str(minX)
            
            
            """Find the Boundries of the Universe"""
            objX = int(ret[obj.id]["Position"]["x"])
            objY = int(ret[obj.id]["Position"]["y"])
            
            if objX < minX:
                minX = objX
            elif objX > maxX:
                maxX = objX
            if objY < minY:
                minY = objY
            elif objY > maxY:
                maxY = objY
            
            #print checkIfImageExists(safestr(mediaRepoURL + mediaRelativeURLS["Media"]))
            
            
            if hasattr(obj, 'parent'):
                ret[obj.id]['parent'] = obj.parent
            
            
            """fix: Convert owner to name"""
            
        ret = checkIfImageExists(ret, self.mediaListName)
        
        """Add the universe dimensions to the universe object array"""
        ret[0]["Size"] = {'minX': minX, 'maxX': maxX, 'minY': minY, 'maxY': maxY}
        #print "Done With Building Items"
        return ret

class Orders(object):
    """Parse order data and convert it to json friendly structures"""        
    
    def __init__(self, cache):
        self.cache = cache
    
    def removeOrder(self, conn, id, order_position):
        print "Remove order pos ", int(order_position)
        queue = self.cache.orders[int(id)]
        node = getOrderNodeByPosition(queue, int(order_position))
        if node != None:
            evt = self.cache.apply('orders', 'remove', id, nodes=[node])
            apply(conn, evt, self.cache)
            
        return self.cache

    def updateOrder(self, conn, id, type, order_position, moreargs):
        """Not sure if this is the correct way, but it works"""
        args = [0, id, -1, type, 0, []]
        # Really stupid hack that makes me crazy, http post forms converts
        # everything into strings and I dont want to process the args seperatly
        # on the backend side.
        def recur_map(func, data):
            #print "Entering recur map", data
            if hasattr(data, '__iter__'):
                #print "hasiter attri"
                args = []
                for elem in data:
                    args.append(recur_map(func, elem))
                # [recur_map(func, elem) for elem in data]
                return args
            else:
                try:
                    return func(data)
                except ValueError:
                    return data
        
        moreargsProcessed = []
        if moreargs:
            for arg in moreargs:
                moreargsProcessed.append(recur_map(int, json.loads(arg)))
        
        # Create the new order
        ordertype = objects.OrderDescs()[type]
        
        args = applyArgNesting(args, moreargsProcessed, ordertype)
        order = ordertype(*args)
        order._dirty = True
        
        queue = self.cache.orders[int(id)]
        node = getOrderNodeByPosition(queue, int(order_position))
        if node != None and order != None:       
                evt = self.cache.apply("orders", "change", id, node, order)
                apply(conn, evt, self.cache)    
        
        return self.cache

    def sendOrder(self, conn, id, type, moreargs):
        print "Sending Orders ", type
        # sequence, id, slot, type, turns, resources
        args = [0, id, -1, type, 0, []]
        position = 0
        
        # get orderdesc so we can get default args for order type
        ordertype = objects.OrderDescs()[type]
        
        #create dummy order with dummy results
        args = insertDummyOrder(args, ordertype);
        order = ordertype(*args)
        order._dirty = True
        
        queue = self.cache.orders[id]
        
        #The Order number in terms of queue position
        position = len(queue)
        print "Send Order pos: ", position
        #Add order to back of queue
        node = queue.last
        if node != None and order != None:
            print "Printing sendorder args: ", args
            #make a new order
            evt = self.cache.apply("orders", "create after", id, node, order)
            apply(conn, evt, self.cache)
        
        return position, self.cache
        
    def get_args(self, orderdesc, order=None):
        args = []
        
        for property in orderdesc.properties:
            name = property.name
            name_text = name.title().replace('_', '')
            
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
            
            value = None
            if order:
                value = list(getattr(order, name))
                def recur_map(func, data):
                    if hasattr(data, '__iter__'):
                        return [recur_map(func, elem) for elem in data]
                    else:
                        return func(data) 
    
                value = recur_map(safestr, value)
        
            args.append({'name': safestr(name_text), 'type': type, 'description': safestr(property.description), 'value': value})
        
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
                orderTypes = getOrderTypes(self.cache, i)
                queueid = orders.queueid
                
                # Build the initialize structure for this object and its orders
                return_data[queueid] = {'orders': {}, 'order_type': []}
                
                orderobj = self.cache.orders[queueid]
                
                numorders = 0
                # Go through all orders currently on the object
                orderobj = self.cache.orders[queueid]
                ordersAr = {}
                
                """
                for d in objects.OrderDescs().values():
                    print d
                """
                
                print orderTypes
                print len(orderTypes[queueid])
                if queueid > 0:
                    for listpos, node in enumerate(orderobj):

                        order = node.CurrentOrder
                        orderdesc = objects.OrderDescs()[order.subtype]
                        
                        if hasattr(orderdesc, 'doc'):
                            desc = orderdesc.doc
                        else:
                            desc = orderdesc.__doc__
                            desc = desc.strip()
                        
                        print order
                        
                        args = self.get_args(orderdesc, order)
                        
                        ordersAr[int(node.id)] = {
                            'order_id': int(node.id),
                            'name': safestr(order._name),
                            'description': safestr(desc),
                            'type': order.subtype,
                            'turns': order.turns,
                            'args': args} 
                        
                        numorders+=1
                        
                    if numorders > 1:
                        print "Numorders have been successfully counted"
                        for key in sorted(ordersAr.iterkeys()): 
                            return_data[queueid]['orders'][key] = ordersAr[key]
                    
                    if len(orderTypes[queueid]) > 0:  
                        # Go through all possible orders this object can receive
                        for type in orderTypes[queueid]:
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
  
    print("--Connection Made--")
    return connection

def createCache(host, port, username, password, games):
    """Create the initial cache"""
    #print "Cache Key" + Cache.key(host, games, username)+":"+str(port)+"/"
    cache = Cache(Cache.key(host, games[0], username)+":"+str(port)+"/", configdir='/tmp/tpclient-pyweb/cache/')
    
    return cache

def updateCache(host, port, username, password):
    """Updates the current cache"""
    conn = connect(host, port, username, password)
    
    games = conn.games()
    if failed(games):
        print "Getting the game object failed!"
        return
  
    cache = createCache(host, port, username, password, games)
    cache.update(conn, callback)
    
    print("Cache Updated")
    return conn, cache
    