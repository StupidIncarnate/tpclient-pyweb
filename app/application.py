# Python imports
from __future__ import division
import re
try:
    import simplejson
except ImportError, e:
    import json as simplejson

# Local imports
#from middleman import cache

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
    start_response('200 OK', [('Content-Type', 'text/plain')])
    return ['Hello world!']

def get_objects(environ, start_response):
    """Get all objects from cache"""
    start_response('200 OK', [('Content-Type', 'application/json')])
    return ['Hello']

def not_found(environ, start_response):
    """A simple not found handler"""
    start_response('404 NOT FOUND', [('Content-Type', 'text/plain')])
    return ['Not Found']

# All valid urls for this application
urls = [
    (r'^$', index),
    (r'get/objects/$', get_objects),
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
