'use strict'

/* eslint-env mocha */

// ===================================================================

var Bluebird = require('bluebird')
var eventToPromise = require('event-to-promise')
var expect = require('must')
var http = require('http')

var httpProxyRequest = require('./')

// ===================================================================

Bluebird.longStackTraces()

function drainStream (stream) {
  var chunks = []
  var length = 0

  var resolve, reject
  var promise = new Bluebird(function (resolve_, reject_) {
    resolve = resolve_
    reject = reject_
  })

  function onData (chunk) {
    chunks.push(chunk)
    length += chunk.length
  }
  stream.on('data', onData)

  function onEnd () {
    resolve(String(Buffer.concat(chunks, length)))

    clean()
  }
  stream.on('end', onEnd)

  function onError (error) {
    reject(error)

    clean()
  }
  stream.on('error', onError)

  function clean () {
    length = chunks.length = 0

    stream.removeListener('data', onData)
    stream.removeListener('end', onEnd)
    stream.removeListener('error', onError)
  }

  return promise
}

// ===================================================================

describe('httpProxyRequest', function () {
  var proxy
  var proxyPort

  var server
  var serverPort

  before(function () {
    proxy = http.createServer(function (req, rep) {
      httpProxyRequest({
        hostname: 'localhost',
        port: serverPort
      }, req, rep)
    }).listen(0, 'localhost')

    server = http.createServer().listen(0, 'localhost')

    return Bluebird.all([
      eventToPromise(proxy, 'listening'),
      eventToPromise(server, 'listening')
    ]).then(function () {
      proxyPort = proxy.address().port
      serverPort = server.address().port
    })
  })

  after(function () {
    proxy.close()
    server.close()
  })

  function makeRequest (opts) {
    if (!opts) {
      opts = {}
    }

    var req = http.request({
      headers: opts.headers,
      hostname: 'localhost',
      method: opts.method || (opts.body || opts.stream ? 'POST' : 'GET'),
      port: proxyPort
    })

    if (opts.stream) {
      opts.stream.pipe(req)
    } else {
      req.end(opts.body)
    }

    return eventToPromise(req, 'response')
  }

  // =================================================================

  it('forwards requests (headers & body)', function () {
    return Bluebird.all([
      makeRequest({
        body: 'ping',
        headers: {
          'x-header': 'foo'
        }
      }).then(function (res) {
        return drainStream(res).then(function (body) {
          expect(body).to.equal('pong')
        })
      }),
      eventToPromise(server, 'request', { array: true }).then(function (params) {
        var req = params[0]
        var res = params[1]

        res.end('pong')

        expect(req.headers['x-header']).to.equal('foo')
        return drainStream(req).then(function (body) {
          expect(body).to.equal('ping')
        })
      })
    ])
  })
})
