# Python imports
import time, socket

# Local imports
from backend.utils import safestr
import tp.client.threads
from tp.netlib.client import url2bits
from tp.netlib import Connection
from tp.netlib import failed, constants, objects
from tp.client.cache import Cache, apply

object_type = ['Universe', 'Galaxy', 'Star System', 'Planet', 'Fleet']

defaults = {
    constants.ARG_ABS_COORD: [0,0,0],
    constants.ARG_TIME: [0, 0],
    constants.ARG_OBJECT: [0],
    constants.ARG_PLAYER: [0,0],
    constants.ARG_STRING: [0, ""],
    constants.ARG_LIST: [[], []],
    constants.ARG_RANGE: [-1, -1, -1, -1],
}

class FriendlyObjects(object):
    def __init__(self, cache):
        self.cache = cache
        self._object_chain = [self._base, self._galaxy, self._galaxy, self._planet, self._fleet]

    def _base(self, obj, node, level):
        node.update({
            'name': safestr(obj.name),
            'id': obj.id,
            'type': {'id': obj.subtype, 'name': object_type[obj.subtype]},
            'size': obj.size,
            'contains': obj.contains
        })

    def _galaxy(self, obj, node, level):
        self._base(obj, node, level)
        node.update({
            'pos': obj.pos,
            'vel': obj.vel,
            'parent': obj.parent
        })

    def _planet(self, obj, node, level):
        self._galaxy(obj, node, level)
        node.update({
            'owner': obj.owner,
            'resources': obj.resources
        })

    def _fleet(self, obj, node, level):
        self._galaxy(obj, node, level)
        node.update({
            'owner': obj.owner,
            'damage': obj.damage,
            'ships': obj.ships
        })

    def build(self):
        ret = {}
        for i in self.cache.objects:
            obj = self.cache.objects[i]
            ret[obj.id] = {}
            self._object_chain[obj.subtype](obj, ret[obj.id], 0)
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
        self.cache.save()

    def sendOrder(self, conn, id, type, moreargs):
        od = objects.OrderDescs()[type]
        
        # sequence, id, slot, type, turns, resources
        args = [0, id, -1, type, 0, []]
        #for name, type in od.names:
        #    args += defaults[type]

        # Really stupid hack that makes me crazy, http post forms converts
        # everything into strings and I dont want to process the args seperatly
        # on the backend side.
        temp = []
        for stupid in moreargs:
            try:
                temp.append(int(stupid))
            except ValueError:
                temp.append(stupid)

        args += temp

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
        self.cache.save()

    def get_args(self, orderdesc, order=None):
        args = []

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

            args.append({'name': safestr(name_text), 'type': type, 'description': safestr(getattr(orderdesc, name+'__doc__')), 'value': value})
        return args
        
    def build(self):
        """Build json friendly structure"""
        return_data = {}
        for i in self.cache.objects:

            # Retrives object and orders for that object
            object = self.cache.objects[i]
            orders = self.cache.orders[i]

            # If we have orders for this object or the object can receive orders
            if object.order_number > 0 or len(object.order_types) > 0:

                # Build the initialize structure for this object and its orders
                return_data[i] = {'orders': [], 'order_type': []}

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

                    return_data[i]['orders'].append({
                        'order_id': int(node.id),
                        'name': safestr(order._name),
                        'description': safestr(desc),
                        'type': order.subtype,
                        'turns': order.turns, 
                        'args': args})

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

        return return_data


class Messages(object):
    def __init__(self, cache):
        self.cache = cache

    def build(self):
        return_data = {}
        for i in self.cache.boards:
            board = self.cache.boards[i]

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

    cache = Cache(Cache.key(host, username), configdir='/tmp/tpclient-pyweb/cache/')
    return connection, cache

def cache(host, username):
    return Cache(Cache.key(host, username), configdir='/tmp/tpclient-pyweb/cache/')

