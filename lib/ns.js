var path = require('path');
var fs = require('fs');
var md5 = require('MD5');
var http = require('http');
var querystring = require('querystring');

exports.rename = function( /*string*/ fileName, callback) {
	var ext = path.extname(fileName);
	var name = path.basename(fileName, ext);
	var dirname = path.dirname(fileName);
	//if Chinese, just get the chinese name.
	var newName = name.replace(/[^\u4E00-\u9FA5\uF900-\uFA2D]/g, '');
	if (!newName) {
		newName = name.replace(/\W/g, '');
		var firstDigit = newName.search(/\d/);
		if (firstDigit > 0)
			newName = newName.substring(0, firstDigit);
	}
	newName = path.join(dirname, newName) + ext;

	fs.rename(path.normalize(fileName), path.normalize(newName), callback);
};
/* callback(err, hash /string/) */
exports.getFileHash = function( /*string*/ fileName, callback) {
	fileName = path.normalize(fileName);
	var hash = '';
	fs.open(fileName, 'r', function(err, fd) {
		fs.fstat(fd, function(err, stats) {
			if (err) {
				callback(err);
				return;
			}
			var fileLength = stats.size;
			if (fileLength < 8192) {
				console.log('Error: %s', 'file too small');
				return;
			}
			var offsets = [4096, fileLength / 3 * 2, fileLength / 3, fileLength - 8192];
			var buffers = [],
				count = 0;
			var calculateHash = function() {
				for (var i = 0; i < buffers.length; i++) {
					if (hash) {
						hash += ';';
					}
					hash += md5(buffers[i]);
				}
			}
			for (var i = 0; i < offsets.length; i++) {
				buffers[i] = new Buffer(4096);
				fs.read(fd, buffers[i], 0, 4096, offsets[i], function(err, bytesRead, buffer) {
					if (err || bytesRead < 4096) {
						callback(err || 'bytes too small');
						return;
					}
					count++;
					if (count == 4) {
						calculateHash();
						callback(null, hash);
					}
				});
			}
		});
	});

};
exports.getSub = function( /*string*/ hash, /*string*/ fileName, /*string:[Chn, Eng]*/ lang) {
	var post_data = querystring.stringify({
		'filehash': hash,
		'pathinfo': path.normalize(fileName),
		'format': 'json',
		'lang': lang
	});
	var post_options = {
		host: 'www.shooter.cn',
		port: '80',
		path: '/api/subapi.php',
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': post_data.length
		}
	};
	var chunks = [];
	var post_req = http.request(post_options, function(res) {
		res.setEncoding('utf8');
		console.log("statusCode: ", res.statusCode);
		console.log("headers: ", res.headers);
		res.on('data', function(chunk) {
			chunks.unshift(chunk);
		});
		res.on('end', function(){
			var result = JSON.parse(Buffer.concat(chunks).toString());
			console.log(result[0]['Files']);
		})
	});

	// post the data
	post_req.write(post_data);
	post_req.end();
};