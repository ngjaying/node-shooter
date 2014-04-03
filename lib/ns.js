/**
 *	Module dependencies
 */
var path = require('path'),
	fs = require('fs'),
	md5 = require('MD5'),
	http = require('http'),
	https = require('https'),
	querystring = require('querystring');

var ns = (function() {
	/**
	 *	Module api
	 */
	var api = {};

	/**
	 * Get the file hash for a video file. The file must be larger than 4MB.
	 * @param {string} fileName, the file path
	 * @param {function(err, string)=} callback, return the hash string of the file
	 */
	function getFileHash(fileName, callback) {
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

	/**
	 * Get the subtitle info for the file
	 * @param {string} hash, the file hash string
	 * @param {string} fileName, the file path
	 * @param {string} lang, the language of subtitle to get, must be 'Chn' or 'Eng', default is 'Chn'
	 * @param {function(err, Array.<object>)=} callback, return the subtitle object [{Desc, Delay, Files[{Ext, Link}]}]
	 */
	function getSubInfo(hash, fileName, opt_lang, callback) {
		var post_data = querystring.stringify({
			'filehash': hash,
			'pathinfo': path.normalize(fileName),
			'format': 'json',
			'lang': opt_lang || 'Chn'
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

	/**
	 * Download the subtitle and name it as the same name of the file
	 * @param {string} fileName, the file path
	 * @param {Array.<object>} subs, the array of the subtitle info object
	 * @param {string} opt_targetPath, the path to download the subtitle; default is the path of the source file
	 * @param {function(err)} callback
	 */
	function downloadSub(fileName, subs, opt_targetPath, callback) {
		process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
		(function next(i, length, callback) {
			if (i < length) {
				var sub = subs[i],
					delay = sub.Delay,
					files = sub.Files;
				(function innerNext(j, len, cb) {
					if (j < len) {
						var file = files[j].Link,
							ext = files[j].Ext,
							target = path.normalize((opt_targetPath || path.dirname(fileName)) + path.sep + path.basename(fileName, path.extname(fileName)) + '.' + ext);;

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

	api.getFileHash = getFileHash;
	api.getSubInfo = getSubInfo;
	api.downloadSub = downloadSub;
	/**
	 * Download the subtitle of the file
	 * @param {string} fileName, the file path
	 * @param {object} options, Object lang, 'Chn' or 'Eng'; targetPath
	 * @param {function(err)} callback
	 */
	api.getSub = function(filePath, options, callback) {
		options = options || {};
		getFileHash(filePath, function(err, hash) {
			getSubInfo(hash, filePath, options.lang, function(err, result) {
				downloadSub(filePath, result, options.targetPath, callback);
			});
		});
	}

	return api;
})();
module.exports = ns;