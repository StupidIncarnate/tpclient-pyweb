def safestr(obj):
    """Converts any given object to utf-8 encoded string."""
    if isinstance(obj, unicode):
        return obj.encode('utf-8')
    elif isinstance(obj, str):
        return obj
    else:
        return str(obj)
