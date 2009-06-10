# Python imports
import time, socket

# Local imports
import tp.client.threads
from tp.netlib.client import url2bits
from tp.netlib import Connection
from tp.netlib import failed, constants, objects
from tp.client.cache import Cache

"""This is just old prototype code..."""

class ConnectionError(Exception):
    """Exception used in connect"""
    def __init__(self, value):
        self.value = value

    def __str__(self):
        return str(self.value)

def callback(mode, state, message="", todownload=None, total=None, amount=None):
    pass
    #print "Downloading %s %s Message:%s" %  (mode, state, message)

def connect(host, port, username, password):
    try:
        connection = Connection(host=host, port=port, debug=False)
    except socket.error, e:
        raise ConnectionError('Unable to connect to the host.')

    if failed(connection.connect()):
        raise ConnectionError('Unable to connect to the host.')

    if failed(connection.login(username, password)):
        raise ConnectionError('User did not exist.')

    cache = Cache(Cache.key(host, username))
    return connection, cache

#conn, cache = connect()

#print "Download all data"
#cache.update(conn, callback)

"""lastturn = cache.objects[0].turn
waitfor = conn.time()
print "Awaiting end of turn %s (%s s)..." % (lastturn,waitfor)
while lastturn == conn.get_objects(0)[0].turn:
    while waitfor > 1:
        time.sleep(1)
        waitfor = conn.time()
    time.sleep(2)
"""
