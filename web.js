var fs = require('fs');
var http = require('http');
var url = require('url');
var path = require('path');
var qs = require('querystring');
var ok = require('./oK');
var conv = require('./convert');

var PORT = 8080;

function read(x) {
	var f = conv.tojs(x);
	if (typeof f !== 'string') { throw Error('ERROR: type'); }
	if (!f) { throw Error('ERROR: no path'); }
	f = path.resolve(process.cwd(), f);
	return conv.tok(fs.statSync(f).isDirectory() ? fs.readdirSync(f) : fs.readFileSync(f, 'utf8').split(/\r?\n/));
}

function writer(response) {
	return function write(x, y) {
		var s = conv.tojs(y);
		if (Array.isArray(s)) { s = s.join('\n') + '\n'; }
		if (typeof s !== 'string') { throw Error('ERROR: type'); }
		var f = conv.tojs(x);
		if (typeof f !== 'string') { throw Error('ERROR: type'); }
		if (f) {
			fs.writeFileSync(path.resolve(process.cwd(), f), s);
		} else {
			response.write(s);
		}
		return y;
	}
}

for (var i = 0; i < 2; i++) { ok.setIO('0:', i, read ); }
// write is per-request, defined below

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