(function(){
	var ns = require('./ns.js');
	var args = process.argv.slice(2);
	ns.rename(args[0]);
})();