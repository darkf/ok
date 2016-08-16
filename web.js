var fs = require('fs');
var http = require('http');
var url = require('url');
var qs = require('querystring');
var ok = require('./oK');
var conv = require('./convert');

var PORT = 8080;

function writer(response) {
	return function write(x, y) {
		var s = y.t === 2 ? y.v : conv.tojs(y);
		if (Array.isArray(s)) { s = s.join('\n') + '\n'; }
		if (typeof s !== 'string') { throw Error('ERROR: type'); }
		response.write(s);
		return y;
	}
}

function run(response, parts, path, data) {
	console.log("data:", data);
    var program = fs.readFileSync(path, 'utf8');
    var env = ok.baseEnv();
    var write = writer(response);
	for (var i = 2; i < 6; i++) { ok.setIO('0:', i, write); }
	env.put("path", true, conv.tok(parts.href));
	env.put("query", true, conv.tok(data));
    ok.run(ok.parse(program), env);
}

function handleRequest(request, response){
	var parts = url.parse(request.url);
	var path = parts.pathname.slice(1);

    if(request.method === "POST") {
    	var body = "";
    	request.on("data", function(data) { body += data; });
    	request.on("end", function() {
			var data = qs.parse(body);
    		run(response, parts, path, data);
    		response.end();
    	});
    }
    else {
		var data = qs.parse(parts.query);
    	run(response, parts, path, data);
    	response.end();
    }    
}

http.createServer(handleRequest).listen(PORT, function(){
    console.log("Listening on port %d...", PORT);
});