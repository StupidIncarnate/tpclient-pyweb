# Python imports
from __future__ import division
import re
#from middleman import setCache
try:
    import json
except ImportError, e:
    import simplejson as json

try:
    from urlparse import parse_qs
except ImportError:
    from cgi import parse_qs

# Local imports
import middleman 

currentTurn = 0
cache = None

def login(environ, start_response):
    """Login handler"""
    global cache
    print("--Logging In--")
    if environ['REQUEST_METHOD'].lower() == 'post':
        postdata = parse_qs(environ['wsgi.input'].read())
        
        host, colon, port = postdata['host'][0].rpartition(':')
        if colon == '':
            host = port
            port = 6923

        username = postdata['user'][0]
        password = postdata['pass'][0]

        data = {'auth': True, 'error': 'Wrong username or password.'}

        try:
            conn = middleman.connect(host, port, username, password)
        except middleman.ConnectionError, e:
            data['auth'] = False
            data['error'] = str(e)
    
        if data['auth']:
            conn.disconnect()

            # Set session when login was ok
            import datetime, hashlib
            session = environ.get('session')
            session['uid'] = (host, port, username, password, datetime.datetime.now())
            session.save()
            
            cache = middleman.createCache(host, port, username, password)
    else:
        data = {'auth': False, 'error': 'Just use the form we provid to submit data, OK?'}

    output = json.dumps(data, encoding='utf-8', ensure_ascii=False)

    start_response('200 OK', [('Content-Type', 'application/json')])
    
    print("---Login Complete---")
    
    return [output]

def logout(environ, start_response):
    """A helper method during development to delete a session"""
    
    environ.get('session').delete()
    output = json.dumps({'auth': False}, encoding='utf-8', ensure_ascii=False)

    start_response('200 OK', [('Content-Type', 'application/json')])
    return [output]

def cache_update(environ, start_response):
    """Update cache"""
    global currentTurn
    global cache
    
    print("--Updating Cache--")
    session = environ.get('session')
    
    if 'uid' in session:
        
        host, port, username, password, now = session['uid']
        conn, cache = middleman.updateCache(host, port, username, password)
        
        currentTurn = cache.objects[0].__Informational.Year.value    
            
        turn = {'time': int(conn.time()), 'current': int(currentTurn)}
        data = {'auth': True, 'cache': True, 'turn': turn}
        
    else:
        data = {'auth': False}
    
    output = json.dumps(data, encoding='utf-8', ensure_ascii=False)
    
    start_response('200 OK', [('Content-Type', 'application/json')])
    print("Cache updated")
    return [output]

def get_orders(environ, start_response):
    global currentTurn
    global cache
    print("--Getting Orders--")
    
    session = environ.get('session')
    if 'uid' in session:
        #print "Printing empty cache", cache.orders
        host, port, username, password, now = session['uid']
        
        conn, cache = middleman.updateCache(host, port, username, password)
        
        turn = {'time': int(conn.time()), 'current': int(currentTurn)}
        data = {'auth': True, 'orders': middleman.Orders(cache).build(), 'turn': turn}
    else:
        data = {'auth': False}

    output = json.dumps(data, encoding='utf-8', ensure_ascii=False)

    start_response('200 OK', [('Content-Type', 'application/json')])
    return [output]
   
def send_orders(environ, start_response):
    global currentTurn
    global cache
    print("--Sending Orders--")
    
    if environ['REQUEST_METHOD'].lower() == 'post':
        postdata = parse_qs(environ['wsgi.input'].read())

        session = environ.get('session')
        if 'uid' in session:
            host, port, username, password, now = session['uid']
            
            conn, cacher = middleman.updateCache(host, port, username, password)
            
            if 'args' in postdata:
                args = postdata['args']
            else:
                args = None
            
            order_id_position, cache = middleman.Orders(cacher).sendOrder(conn, int(postdata['id'][0]), int(postdata['type'][0]), args)
            
            turn = {'time': int(conn.time()), 'current': int(currentTurn)}
            data = {'auth': True, 'sent': True, 'turn': turn, 'order_position': order_id_position}
        else:
            data = {'auth': False}

        print "Data: ", data
        output = json.dumps(data, encoding='utf-8', ensure_ascii=False)

        start_response('200 OK', [('Content-Type', 'application/json')])
        return [output]

def update_orders(environ, start_response):
    global currentTurn
    global cache
    print("--Updating Orders--")
    
    if environ['REQUEST_METHOD'].lower() == 'post':
        postdata = parse_qs(environ['wsgi.input'].read())

        session = environ.get('session')
        if 'uid' in session:
            host, port, username, password, now = session['uid']
            conn, cacher = middleman.updateCache(host, port, username, password)

            if 'args' in postdata:
                args = postdata['args']
            else:
                args = None
                
            cache = middleman.Orders(cacher).updateOrder(conn, int(postdata['id'][0]), int(postdata['type'][0]), int(postdata['order_position'][0]), args) 

            turn = {'time': int(conn.time()), 'current': int(currentTurn)}
            data = {'auth': True, 'sent': True, 'turn': turn}
        else:
            data = {'auth': False}

        output = json.dumps(data, encoding='utf-8', ensure_ascii=False)

        start_response('200 OK', [('Content-Type', 'application/json')])
        return [output]


def remove_orders(environ, start_response):
    global currentTurn
    global cache
    print("--Removing Orders")
    
    if environ['REQUEST_METHOD'].lower() == 'post':
        postdata = parse_qs(environ['wsgi.input'].read())

        session = environ.get('session')
        if 'uid' in session:
            host, port, username, password, now = session['uid']
            """Fix so it doesn't have to call updateCache each time."""
            conn, cacher = middleman.updateCache(host, port, username, password)
            
            cache = middleman.Orders(cacher).removeOrder(conn, int(postdata['id'][0]), int(postdata['order_position'][0])) 
            
            turn = {'time': int(conn.time()), 'current': int(currentTurn)}
            data = {'auth': True, 'removed': True, 'turn': turn}
        else:
            data = {'auth': False}

        output = json.dumps(data, encoding='utf-8', ensure_ascii=False)

        start_response('200 OK', [('Content-Type', 'application/json')])
        return [output]

def get_objects(environ, start_response):
    """Get all objects from cache"""
    global currentTurn
    global cache
    print("--Getting Objects--")
    
    session = environ.get('session')
    if 'uid' in session:
        host, port, username, password, now = session['uid']
        conn = middleman.connect(host, port, username, password)
        
        turn = {'time': int(conn.time()), 'current': int(currentTurn)}
        data = {'auth': True, 'objects': middleman.FriendlyObjects(cache).build(), 'turn': turn}
    else:
        data = {'auth': False}

    def test(obj):
        return str(obj).encode('utf-8')
    
    output = json.dumps(data, encoding='utf-8', ensure_ascii=False, default=test)

    start_response('200 OK', [('Content-Type', 'application/json')])
    
    print("Finished Getting Objects")
    return [output]

def get_messages(environ, start_response):
    """Get all messages from cache"""
    global currentTurn
    global cache
    print("--Getting Messages--")
    
    session = environ.get('session')
    if 'uid' in session:
        host, port, username, password, now = session['uid']
        conn = middleman.connect(host, port, username, password)

        turn = {'time': int(conn.time()), 'current': int(currentTurn)}
        data = {'auth': True, 'messages': middleman.Messages(cache).build()}
    else:
        data = {'auth': False}

    output = json.dumps(data, encoding='utf-8', ensure_ascii=False)

    start_response('200 OK', [('Content-Type', 'application/json')])
    return [output]

def not_found(environ, start_response):
    """A simple not found handler"""
    start_response('404 NOT FOUND', [('Content-Type', 'text/plain')])
    return ['Not Found']

# All valid urls for this application
urls = [
    (r'^logout/$', logout),
    (r'^get_objects/$', get_objects),
    (r'^get_orders/$', get_orders),
    (r'^get_messages/$', get_messages),
    (r'^order/send/$', send_orders),
    (r'^order/remove/$', remove_orders),
    (r'^order/update/$', update_orders),
    (r'^cache_update/$', cache_update),
    (r'^login/$', login),
]

def application(environ, start_response):
    """A simple application parsing a list of urls using regex and redirecting to matching handler"""
    path = environ.get('PATH_INFO', '').lstrip('/')
    for regex, callback in urls:
        match = re.search(regex, path)
        if match is not None:
            environ['tpclient-pyweb.url_args'] = match.groups()
            return callback(environ, start_response)
    return not_found(environ, start_response)
