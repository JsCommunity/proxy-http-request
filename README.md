# proxy-http-request [![Build Status](https://travis-ci.org/JsCommunity/proxy-http-request.png?branch=master)](https://travis-ci.org/JsCommunity/proxy-http-request)

Features:

- easy to use
- support HTTPs
- debug traces via [debug](https://github.com/visionmedia/debug/)

## Install

Installation of the [npm package](https://npmjs.org/package/proxy-http-request):

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

With debug traces:

```
> DEBUG=proxyHttpRequest node example.js
  proxyHttpRequest parsing URL http://example.org/foo +0ms
  proxyHttpRequest proxying GET http://example.org/foo +8ms
```

## Development

### Installing dependencies

```
> npm install
```

### Compilation

The sources files are watched and automatically recompiled on changes.

```
> npm run dev
```

### Tests

```
> npm run test-dev
```

## Contributions

Contributions are *very* welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/JsCommunity/proxy-http-request/issues)
  you've encountered;
- fork and create a pull request.

## License

ISC © [Julien Fontanet](https://github.com/julien-f)
