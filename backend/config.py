config = {
    'debug': True,
}

session_opts = {
    'session.type': 'file',
    'session.data_dir': '/tmp/tpclient-pyweb/sessions',
    'session.lock_dir': '/tmp/tpclient-pyweb/lock',
    'session.cookie_expires': True,
    'session.key': 'tpclient-pyweb',
    'session.secret': 'MyS3cR3T'
}
