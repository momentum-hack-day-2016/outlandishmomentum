var http = require('http');
var url = require('url');
var fs = require('fs');
qs = require('querystring');

var listHead = '';
var listFoot = '';
var sourceListFile = './data/sources.xml';
var sourceList;

function init() {
  //listHead = //?Stream in
  //listFoot = //ditto;
  // Open source List  
}

function startServer() {
  init();
  http.createServer(function (req, res) {
    serviceRequest(req, res);
  }).listen(1337, '127.0.0.1');
  console.log('Server running at http://127.0.0.1:1337/');
} // End of f startServer

function serviceRequest( req, res ) {
  var urlStuff = url.parse(req.url, true);
  showRequest(req);
  servePage(urlStuff.path, urlStuff.query, req, res);
  console.log('Request serviced');
} // End of f serviceRequest

function showRequest( req ) {
  console.log("-------------------------------------");
  console.log(req.method);
  console.log(req.headers);
  console.log(url.parse(req.url, true));
} //End of f showRequest

function servePage(path, qry, req, res) {
  var found = false;

  var pageName = './resources'+((path == '/') ? '/index.html' : path);
  if( fs.existsSync(pageName) ) { 
    var page = fs.createReadStream(pageName);
    if( page !== undefined ) {
      page.on('error', function(err) {
        console.log(err);
        res.statusCode = 404;
        res.end('<html><body>Not found or error</body></html>');
      });
      if(  pageName.substring(pageName.lastIndexOf('.')) == '.css' ) {
        res.writeHead(200, { "Content-Type": "text/css" });
      }
      else {
        res.writeHead(200, { "Content-Type": "text/html" });
      }
      page.pipe(res);
      found = true;
    }
  }

  if( !found & qry.src !== undefined ) {
    handleForm(qry.src, req, res);
    found = true;
  }

  if( !found ) {
   res.statusCode = 404;
   res.end('<html><body>Sorry! Request not recognised.</body></html>');
   console.log('Page NOT found');
  }
 
} //End of f servePage

function handleForm(formName, req, res) {
  var body='';
  req.on('data', function(data) {
    body += data;
  });
  req.on('end', function () {
    var formVals = qs.parse(body);
    replyToForm(formName, formVals, req, res); 
  });
}

function replyToForm(formName, formVals, req, res) {
  var reply = '<html><body>Form Request: ' + formName + '<br />';
  console.log('Form name: ' + formName + ' Vals: ');
  for(var val in formVals){
    var showVal = val + ' : ' + formVals[val];
    console.log(showVal);
    reply += showVal + '<br />';
  }
  reply += '<p><a href="http://127.0.0.1:1337/">Back to Welcome Page</a></p>' +
           '</body></html>'
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(reply);
}

startServer();