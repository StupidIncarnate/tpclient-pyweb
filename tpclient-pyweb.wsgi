# mod_wsgi doesnt like output on stdout...
import sys
sys.stdout = sys.stderr

try:
    import requirements
except ImportError:
    pass

# Using beaker for session middleware
from beaker.middleware import SessionMiddleware

# Import backend application
from backend.application import application

session_opts = {
    'session.type': 'file',
    'session.data_dir': '/tmp/tpclient-pyweb/sessions',
    'session.lock_dir': '/tmp/tpclient-pyweb/lock',
    'session.cookie_expires': True,
    'session.key': 'tpclient-pyweb',
    'session.secret': 'MyS3cR3T'
}
application = SessionMiddleware(application, session_opts, environ_key='session')

