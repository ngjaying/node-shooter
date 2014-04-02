var path = require('path');
var fs = require('fs');
var md5 = require('MD5');
var http = require('http');
var https = require('https');
var querystring = require('querystring');

function rename( /*string*/ fileName, callback) {
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

	fs.rename(path.normalize(fileName), path.normalize(newName), function() {
		callback(null, path.normalize(newName));
	});
};

/* callback(err, hash /string/) */
function getFileHash( /*string*/ fileName, callback) {
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

function getSubInfo( /*string*/ hash, /*string*/ fileName, /*string:[Chn, Eng]*/ lang, callback) {
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
		res.on('end', function() {
			/**
			 *	The result format
			 *	[{Desc, Delay, Files[{Ext, Link}]}]
			 *	Link must be unencode \u0026 to &
			 **/
			try {
				var result = JSON.parse(Buffer.concat(chunks).toString());
				callback(null, result);
			} catch (err) {
				callback('no subtitle found');
			}
		})
	});

	// post the data
	post_req.write(post_data);
	post_req.end();
};

function downloadSub( /*string*/ targetPath, /*object Array*/ subs, callback) {
	process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
	(function next(i, length, callback) {
		if (i < length) {
			var sub = subs[i],
				delay = sub.Delay,
				files = sub.Files;
			(function innerNext(j, len, cb) {
				if (j < len) {
					var file = files[j].Link,
						ext = files[j].Ext;
					target = path.normalize(path.dirname(targetPath) + path.sep + path.basename(targetPath, path.extname(targetPath)) + '.' + ext);
					doDownload(target, file, function(err, isSuccessful) {
						if (isSuccessful) {
							callback();
							return;
						} else {
							innerNext(j + 1, len, cb);
						}
					});
				} else {
					cb();
				}
			})(0, files.length, function() {
					next(i + 1, length, callback);
				});
		} else {
			callback();
		}
	})(0, subs.length, callback);
};

function doDownload(targetPath, link, callback) {
	https.get(link, function(res) {
		res.pipe(fs.createWriteStream(targetPath));
		res.on('end', function() {
			callback(null, true);
		});
		res.on('error', function(err) {
			callback(err, false);
		});
	});
}

function doGetSub(filePath, callback, lang) {
	getFileHash(filePath, function(err, hash) {
		getSubInfo(hash, filePath, lang || 'Chn', function(err, result) {
			downloadSub(filePath, result, callback);
		})
	});
}
exports.getSub = function( /*string*/ filePath, callback, lang, /*boolean*/ rn) {
	if (rn) {
		rename(filePath, function(err, newName) {
			doGetSub(newName, callback, lang);
		})
	} else {
		doGetSub(filePath, callback, lang);
	}
}
exports.getFileHash = getFileHash;
exports.getSubInfo = getSubInfo;
exports.downloadSub = downloadSub;