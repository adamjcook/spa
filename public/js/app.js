var connect = require('connect');

connect.createServer(
	function(req, res, next) {
		res.writeHead(200);
		res.end(response_text);
	}).listen(3000);

console.log('Server running at http://127.0.0.1:3000/');