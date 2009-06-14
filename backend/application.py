# Python imports
from __future__ import division
import re
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

def login(environ, start_response):
    """Login handler"""

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
            conn, cache = middleman.connect(host, port, username, password)
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
    else:
        data = {'auth': False, 'error': 'Just use the form we provid to submit data, OK?'}

    output = json.dumps(data, encoding='utf-8', ensure_ascii=False)

    start_response('200 OK', [('Content-Type', 'application/json')])
    return [output]

def logout(environ, start_response):
    """A helper method during development to delete a session"""

    environ.get('session').delete()
    output = json.dumps({'auth': False}, encoding='utf-8', ensure_ascii=False)

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
        data = {'auth': True, 'cache': True, 'time': conn.time()}
    else:
        data = {'auth': False}

    output = json.dumps(data, encoding='utf-8', ensure_ascii=False)

    start_response('200 OK', [('Content-Type', 'application/json')])
    return [output]

def get_objects(environ, start_response):
    """Get all objects from cache"""

    session = environ.get('session')
    if 'uid' in session:
        cache = middleman.cache(session['uid'][0], session['uid'][2])
        ret = []
        try:
            file = open(cache.file)
        except IOError:
            pass
        else:
            #maxsize = 0
            #for i in cache.objects:
            #    if cache.objects[i].subtype == 2:
            #        maxsize = max(cache.objects[i].pos[0], cache.objects[i].pos[1], maxsize) 

            """
            for i in cache.objects:
                if cache.objects[i].subtype == 2:
                    x = cache.objects[i].pos[0]
                    y = cache.objects[i].pos[1]

                    if x == 0:
                        x = 0
                    else:
                        x = (x / cache.objects[0].size) * 60000

                    if y == 0:
                        y = 0
                    else:
                        y = (y / cache.objects[0].size) * 60000

                    ret.append((x, y, cache.objects[i].name.encode('utf-8')))
            """
            """
            retdata = []
            for i in cache.objects:
                obj = []

                obj.append(i)
                obj.append(str(type(cache.objects[i])))
                attrdata = {}
                for attr in dir(cache.objects[i]):
                    if attr.find('_') == -1: #and b != 'VersionError' and b != 'fromstr':
                        res = getattr(cache.objects[i], attr)
                        if isinstance(res, unicode):
                            attrdata[attr] = res.encode('utf-8')
                        else:
                            attrdata[attr] = res
                obj.append(attrdata)
                retdata.append(obj)
            """
        
        data = {'auth': True, 'objects': middleman.FriendlyObjects(cache).build()}
    else:
        data = {'auth': False}

    def test(obj):
        return str(obj).encode('utf-8')

    output = json.dumps(data, encoding='utf-8', ensure_ascii=False, default=test)

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
