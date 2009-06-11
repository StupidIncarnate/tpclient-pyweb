# mod_wsgi doesnt like output on stdout...
import sys
sys.stdout = sys.stderr

# Make sure we have all requirements to run this application
try:
    import requirements
except ImportError:
    pass

# Using beaker for session middleware
from beaker.middleware import SessionMiddleware

# Import backend application
from backend.config import session_opts, config
from backend.application import application
from backend.exception_middleware import ExceptionMiddleware

# If debug is set add exception middleware
if 'debug' in config and config['debug']:
    application = ExceptionMiddleware(SessionMiddleware(application, session_opts, environ_key='session'))
else:
    application = SessionMiddleware(application, session_opts, environ_key='session')
