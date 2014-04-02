(function(){
	var ns = require('./ns.js');
	var args = process.argv.slice(2);
	// ns.getFileHash(args[0], function(err, hash){
	// 	if(err){
	// 		console.log(err.message);
	// 	}else{
	// 		ns.getSubInfo(hash, args[0], 'Chn', function(err, result){
	// 			if(err){
	// 				console.log(err.message);
	// 			}else{
	// 				ns.downloadSub(args[0], result, function(){
	// 					console.log('download successful');
	// 				});
	// 			}
	// 		});
	// 	}		
	// });
	ns.getSub(args[0], function(){
		console.log('download successful');
	}, 'Chn', true);
})();