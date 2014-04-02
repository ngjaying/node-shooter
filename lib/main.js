(function(){
	var ns = require('./ns.js');
	var args = process.argv.slice(2);
	process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
	ns.getFileHash(args[0], function(err, hash){
		if(err){
			console.log(err.message);
		}else{
			ns.getSub(hash, args[0], 'Chn', function(err, result){
				if(err){
					console.log(err.message);
				}else{
					ns.downloadSub(args[0], result, function(){
						console.log('download successful');
					});
				}
			});
		}		
	});
})();