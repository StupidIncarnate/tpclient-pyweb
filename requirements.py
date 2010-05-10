#! /usr/bin/env python

# Preference the local directory first...
import sys
sys.path.insert(0, '.')
import os.path

# If we are working from git, initialise the submodules
modules = [("libtpproto-py", "tp.netlib"), ("libtpclient-py", "tp.client"), ("backend", "backend")]
if os.path.exists(".git"):
    for dir, name in modules:
        if os.path.exists(dir) and not os.path.exists(os.path.join(dir, ".git")):
            os.system("git submodule init")
    os.system("git submodule update")

for dir, name in modules:
    if os.path.exists(dir):
        sys.path.insert(0, dir) 

# Simplejson (if 2.5)
cur_ver = sys.version_info
if cur_ver[0] == 2 and cur_ver[1] == 5:
    modules.append(("simplejson", "simplejson"))

# Beaker (for sessions)
modules.append(("beaker", "beaker"))

# Check if tmp folder exists
mainpath = '/tmp/tpclient-pyweb/'
if not os.path.exists(mainpath) :
        os.makedirs(mainpath)
if not os.path.exists(mainpath + 'sessions' ) :
        os.makedirs(mainpath + 'sessions' )
if not os.path.exists(mainpath + 'lock' ) :  
        os.makedirs(mainpath + 'lock' )
if not os.path.exists(mainpath + 'cache' ):
        os.makedirs(mainpath + 'cache' )

# Check for our dependencies.
notfound = []
for dir, name in modules:
    try:
        exec("import %s as module" % name)

        try:
            print "%s version %s" % (dir, module.__version__)
        except AttributeError, e:
            print "%s" % dir

        try:
            print "    (installed at %s)" % module.__installpath__
        except AttributeError, e:
            pass

        try:
            exec("from %s.version import version_git" % name)
            print "    (git %s)" % version_git
        except ImportError:
            pass

    except (ImportError, KeyError, AttributeError), e:
        print e
        notfound.append(dir)
    print


if len(notfound) > 0:
    print "The following requirements where not met:"
    for module in notfound:
        print '    ', module
    print
    sys.exit(1)
