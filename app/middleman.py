# Python imports
import time

# Local imports
import tp.client.threads
from tp.netlib.client import url2bits
from tp.netlib import Connection
from tp.netlib import failed, constants, objects
from tp.client.cache import Cache

"""This is just old prototype code..."""

def callback(mode, state, message="", todownload=None, total=None, amount=None):
    pass
    #print "Downloading %s %s Message:%s" %  (mode, state, message)

def connect():
    debug = False
    host = 'demo1.thousandparsec.net'
    port = 6923
    username = 'test'
    password = 'test1234'

    connection = Connection()

    # Download the entire universe
    if connection.setup(host=host, port=port, debug=debug):
        print "Unable to connect to the host."
        return

    if failed(connection.connect()):
        print "Unable to connect to the host."
        return

    if failed(connection.login(username, password)):
        print "User did not exist."

    cache = Cache(Cache.key(host, username))
    return connection, cache

conn, cache = connect()

print "Download all data"
cache.update(conn, callback)

"""lastturn = cache.objects[0].turn
waitfor = conn.time()
print "Awaiting end of turn %s (%s s)..." % (lastturn,waitfor)
while lastturn == conn.get_objects(0)[0].turn:
    while waitfor > 1:
        time.sleep(1)
        waitfor = conn.time()
    time.sleep(2)
"""
