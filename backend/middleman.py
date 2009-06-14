# Python imports
import time, socket

# Local imports
import tp.client.threads
from tp.netlib.client import url2bits
from tp.netlib import Connection
from tp.netlib import failed, constants, objects
from tp.client.cache import Cache

object_type = ['Universe', 'Galaxy', 'Star System', 'Planet', 'Fleet']

class FriendlyObjects(object):
    def __init__(self, cache):
        self.cache = cache
        self._object_chain = [self._base, self._galaxy, self._galaxy, self._planet, self._fleet]

    def _base(self, obj, node, level):
        node.update({
            'name': obj.name.encode('utf-8'),
            'id': obj.id,
            'type': object_type[obj.subtype],
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
            'resource': obj.resources
        })

    def _fleet(self, obj, node, level):
        self._galaxy(obj, node, level)
        node.update({
            'owner': obj.owner,
            'damage': obj.damage,
            'ships': obj.ships
        })

    """
    def _build(self, obj, tree, level):
        tree.append({})
        self._object_chain[obj.subtype](obj, tree[-1], level)
        for i in obj.contains:
            self._build(self.cache.objects[i], tree[-1]['objects'], level+1)
        return tree
    """

    def build(self):
        ret = [None] * len(self.cache.objects)
        for i in self.cache.objects:
            obj = self.cache.objects[i]
            ret.insert(obj.id, {})
            self._object_chain[obj.subtype](obj, ret[obj.id], 0)
        #return self._build(self.cache.objects[0], [], 0)
        return ret

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
        raise ConnectionError('User did not exist.')

    cache = Cache(Cache.key(host, username), configdir='/tmp/tpclient-pyweb/cache/')
    return connection, cache

def cache(host, username):
    return Cache(Cache.key(host, username), configdir='/tmp/tpclient-pyweb/cache/')

