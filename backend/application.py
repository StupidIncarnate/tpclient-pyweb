# Python imports
from __future__ import division
import re
try:
    import json
except ImportError, e:
    import simplejson as json

# Local imports
import middleman

# A method from my prototype
def test(request):
    ret = []
    for a in cache.objects:
        if hasattr(cache.objects[a], 'parent') and cache.objects[a].parent == 1:
            norm[a] = int(((cache.objects[a].pos[0]**2) + (cache.objects[a].pos[1]**2)) ** 0.5)
            if norm[a] == 0:
                x = y = 300
            else:
                x = ((cache.objects[a].pos[0] / maxsize) * 300) + 300
                #x = ((cache.objects[a].pos[0] / norm[a]) * 300) + 300
                #y = ((cache.objects[a].pos[1] / norm[a]) * 300)
                y = ((cache.objects[a].pos[1] / maxsize) * 300)
                y = 300-y
            ret.append((x,y))
    return json.dumps(ret)


def index(environ, start_response):
    """A test handler that only return hello world"""

    import datetime

    output = ['Hello world! First visit!']
    session = environ.get('session')
    if 'test' in session:
        output = ['Hello world! I was here before...', str(session['test'])]
    else:
        session['test'] = datetime.datetime.now()
        session.save()

    start_response('200 OK', [('Content-Type', 'text/plain')])
    return output

def login(environ, start_response):
    """Login handler"""

    host, port, username, password = environ['tpclient-pyweb.url_args']
    data = {'ok': True, 'error': None}

    try:
        conn, cache = middleman.connect(host, port, username, password)
    except middleman.ConnectionError, e:
        data['ok'] = False
        data['error'] = str(e)
    
    if data['ok']:
        conn.disconnect()

        # Set session when login was ok
        import datetime, hashlib
        session = environ.get('session')
        session['uid'] = (host, port, username, password, datetime.datetime.now())
        session.save()

    output = json.dumps(data, encoding='utf-8', ensure_ascii=False)

    start_response('200 OK', [('Content-Type', 'application/json')])
    return [output]

def cache_update(environ, start_response):
    """Update cache"""

    session = environ.get('session')
    if 'uid' in session:
        host, port, username, password, now = session['uid']
        conn, cache = middleman.connect(host, port, username, password)
        cache.update(conn, middleman.callback)
        cache.save()
        data = 'cache update ok'
    else:
        data = 'not logged in'

    output = json.dumps(data, encoding='utf-8', ensure_ascii=False)

    start_response('200 OK', [('Content-Type', 'application/json')])
    return [output]

def get_objects(environ, start_response):
    """Get all objects from cache"""

    host = 'demo1.thousandparsec.net'
    port = 6923
    username = 'test'
    password = 'test1234'

    conn, cache = middleman.connect(host, port, username, password)

    cache.file = '/tmp/tpclient-pyweb/' + host + username
    try:
        file = open(cache.file)
    except IOError:
        cache.update(conn, middleman.callback)
    else:
        cache.load()

    lastturn = cache.objects[0].turn
    waitfor = conn.time()
    output = "Awaiting end of turn %s (%s s)..." % (lastturn, waitfor)

    cache.save()

    start_response('200 OK', [('Content-Type', 'text/plain')])
    return [output]

def delete_session(environ, start_response):
    """A helper method during development to delete a session"""

    session = environ.get('session')
    session.delete()

    start_response('200 OK', [('Content-Type', 'text/plain')])
    return ['Session is deleted.']

def not_found(environ, start_response):
    """A simple not found handler"""
    start_response('404 NOT FOUND', [('Content-Type', 'text/plain')])
    return ['Not Found']

# All valid urls for this application
urls = [
    (r'^$', index),
    (r'^delete$', delete_session),
    (r'get/objects/$', get_objects),
    (r'cache_update/$', cache_update),
    (r'login/(.+)/(.+)/(.+)/(.+)/$', login),
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
