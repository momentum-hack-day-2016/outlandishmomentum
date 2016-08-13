var http = require('http');
var url = require('url');
var fs = require('fs');

function startServer() {
  http.createServer(function (req, res) {
    serviceRequest(req, res);
  }).listen(1337, '127.0.0.1');
  console.log('Server running at http://127.0.0.1:1337/');
} // End of f startServer


function serviceRequest( req, res ) {
  showRequest(req);
  var urlStuff = url.parse(req.url, true);
  if( urlStuff.path != '/favicon.ico' ) {
    servePage(urlStuff.path, urlStuff.query, req, res);
    console.log('Request serviced');
  }
  else {
    res.end();
    console.log('favicon ignored');
  }
} // End of f serviceRequest


function showRequest( req ) {
  console.log("-------------------------------------");
  console.log(req.method);
  console.log(req.headers);
  console.log(url.parse(req.url, true));
  
} //End of f showRequest

function servePage(path, qry, req, res) {
  var pageName = path;
  if( path == '/' ) {
    pageName = '/index.html';
  }
  pageName = './resources'+pageName;
  if( fs.existsSync(pageName) ) {
  
    var found;
    var page = fs.createReadStream(pageName);
    if( page !== undefined ) {
      page.on('error', function(err) {
        console.log(err);
        res.statusCode = 404;
        res.end();
      });
      res.writeHead(200, { "Content-Type": "text/html" });
      page.pipe(res);
      found = true;
    }
  }

  if( !found & qry.src !== undefined ) {
    console.log(req.read());
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end('<html><body>Form Request.</body></html>');
    found = true;
  }

  if( !found ) {
   res.statusCode = 404;
   res.end('<html><body>Sorry! Request not recognised.</body></html>');
   console.log('Page NOT found');
  }
 
} //End of f servePage

startServer();