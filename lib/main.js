(function(){
	var ns = require('./ns.js');
	var args = process.argv.slice(2);
//	ns.rename(args[0]);
	ns.getFileHash(args[0], function(err, hash){
		if(err){
			console.log(err.message);
		}else{
			ns.getSub(hash, args[0], 'Chn');
		}		
	});
})();