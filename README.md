# proxy-http-request

Features:

- easy to use
- support HTTPs
- debug traces via [debug](https://github.com/visionmedia/debug/)

## Install

```
> npm i install --save proxy-http-request
```

## Usage

```javascript
var proxyHttpRequest = require('proxy-http-request');
var http = require('http');

http.createServer(function (req, res) {

  // Redirect all incoming request to example.org.
  proxyHttpRequest('http://example.org' + req.url, req, res);
}).listen(8000);
```

```
> DEBUG=proxyHttpRequest node example.js
  proxyHttpRequest parsing URL http://example.org/foo +0ms
  proxyHttpRequest proxying GET http://example.org/foo +8ms
```
