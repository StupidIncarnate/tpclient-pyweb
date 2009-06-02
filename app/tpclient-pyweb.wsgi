# mod_wsgi doesnt like output on stdout...
import sys
sys.stdout = sys.stderr

from application import application
