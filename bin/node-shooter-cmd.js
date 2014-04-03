/**
 *	Allow arguments: [fileName, language]
 **/
(function() {
	var ns = require('../lib/ns'),
		args = process.argv.slice(2);
	ns.getSub(args[0], {
		lang: args[1],
		targetPath: args[2]
	}, function() {
		console.log('Subtitle download successful');
	});
})();