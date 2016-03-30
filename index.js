'use strict'

// ===================================================================

var formatQueryString = require('querystring').stringify
var httpRequest = require('http').request
var httpsRequest = require('https').request
var parseUrl = require('url').parse

var debug = require('debug')('proxyHttpRequest')

// ===================================================================

var makeTypeChecker = (function (toString) {
  return function makeTypeChecker (referenceValue) {
    var tag = toString.call(referenceValue)

    return function typeChecker (candidate) {
      return toString.call(candidate) === tag
    }
  }
})(Object.prototype.toString)

var isArray = makeTypeChecker([])
var isString = makeTypeChecker('')

function isObject (candidate) {
  return candidate !== null && typeof candidate === 'object'
}

// -------------------------------------------------------------------

var hasOwnProperty = Object.prototype.hasOwnProperty

function clone (obj) {
  var copy, i, n, prop

  if (isArray(obj)) {
    n = obj.length
    copy = new Array(n)
    for (i = 0; i < n; ++i) {
      copy[i] = clone(obj[i])
    }
  } else if (isObject(obj)) {
    copy = {}
    for (prop in obj) {
      if (hasOwnProperty.call(obj, prop)) {
        copy[prop] = clone(obj[prop])
      }
    }
  } else {
    copy = obj
  }

  return copy
}

// Merge default values recursively from `source` into `obj`.
//
// Defaults are cloned.
function defaults (obj, source) {
  var i, n, prop

  for (i = 1, n = arguments.length; i < n; ++i) {
    source = arguments[i]

    for (prop in source) {
      if (!hasOwnProperty.call(source, prop)) {
        continue
      }

      if (!hasOwnProperty.call(obj, prop)) {
        obj[prop] = clone(source[prop])
      } else if (isObject(obj[prop])) {
        defaults(obj[prop], source[prop])
      }
    }
  }

  return obj
}

// -------------------------------------------------------------------

var DEFAULTS = {
  headers: {
    connection: 'close'
  }
}

var HTTP_RE = /^http(s?):?$/

function normalizeOptions (opts) {
  if (isString(opts)) {
    debug('parsing URL %s', opts)

    opts = parseUrl(opts)
  } else {
    // Copies options as we do not want to alter the user object.
    opts = clone(opts)
  }

  // Merges default options.
  defaults(opts, DEFAULTS)

  // `http(s).request()` does not understand pathname, query and
  // search.
  if (!opts.path) {
    var path = opts.pathname || '/'
    var query

    if (opts.search) {
      path += opts.search
    } else if ((query = opts.query)) {
      if (!isString(query)) {
        query = formatQueryString(query)
      }

      path += '?' + query
    }

    opts.path = path
  }

  var matches
  opts.secure = !!(
    opts.protocol &&
    (matches = opts.protocol.match(HTTP_RE)) &&
    matches[1]
  )
  delete opts.protocol

  return opts
}

// ===================================================================

function proxyRequest (opts, upReq, upRes) {
  opts = normalizeOptions(opts)

  // Method defaults to the one used in the incoming request.
  if (!opts.method) opts.method = upReq.method

  defaults(opts, DEFAULTS)
  defaults(opts.headers || (opts.headers = {}), {
    host: opts.hostname || opts.host
  }, upReq.headers)

  debug('proxying %s http%s://%s%s',
    opts.method,
    opts.secure ? 's' : '',
    opts.hostname,
    opts.path
  )

  var request = opts.secure ? httpsRequest : httpRequest

  var downReq = request(opts, function onResponse (downRes) {
    upRes.writeHead(
      downRes.statusCode,

      // statusMessage is sometimes undefined which may cause
      // writeHead to ignore the headers in the next argument.
      downRes.statusMessage || '',

      downRes.headers
    )

    downRes.pipe(upRes)

    downRes.on('error', function forwardResponseErrorUp (error) {
      upRes.emit('error', error)
    })
  })
  upReq.pipe(downReq)

  downReq.on('error', function forwardRequestErrorUp (error) {
    upReq.emit('error', error)
  })

  upReq.on('close', function forwardRequestAbortionDown () {
    downReq.abort()
  })
}

module.exports = proxyRequest
