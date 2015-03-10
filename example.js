'use strict';

//====================================================================

var proxyHttpRequest = require('./');
var http = require('http');

//====================================================================

http.createServer(function (req, res) {
  proxyHttpRequest('http://example.org' + req.url, req, res);
}).listen(8000);
