var fs = require('fs'),
	ns = require('../lib/ns'),
	assert = require('assert'),
	filePath = 'tests/testidx.avi',
	targetPath = 'tests/result/',
	targetSub = 'tests/result/testidx.srt',
	defaultSub = 'tests/testidx.srt',
	expHash = '84f0e9e5e05f04b58f53e2617cc9c866;b1f0696aec64577228d93eabcc8eb69b;f54d6eb31bef84839c3ce4fc2f57991c;f497c6684c4c6e50d0856b5328a4bedc';
ns.getFileHash(filePath, function(err, hash) {
	assert(!err, 'Test 1: getFileHash should have no error');
	assert.equal(hash, expHash, 'Test 2: get the correct hash');
	ns.getSubInfo(hash, filePath, 'Eng', function(err, subs) {
		assert(!err, 'Test 3: getSubInfo english should have no error');
		assert.equal(subs.length, 3, 'Test 4: getSubInfo get 3 english subtitle');
	});
	ns.getSubInfo(hash, filePath, null, function(err, subs) {
		assert(!err, 'Test 5: getSubInfo chinese should have no error');
		assert.equal(subs.length, 3, 'Test 6: getSubInfo get 3 Chinese subtitle');
		fs.exists(targetSub, function(exists) {
			if (exists) {
				fs.unlinkSync(targetSub);
			}
			ns.downloadSub(filePath, subs, targetPath, function(err) {
				assert(!err, 'Test 7: download should have no error');
				fs.stat(targetSub, function(err, stats) {
					assert(!err, 'Test 8: subtitle file should be downloaded to target path');
					assert(stats.size > 0, 'Test 9: subtitle file should have content');
					ns.getSub(filePath, null, function(err) {
						assert(!err, 'Test 10: subtitle file should be downloaded to target path');
						fs.stat(defaultSub, function(err, stats) {
							assert(!err, 'Test 11: subtitle file should be downloaded to default path');
							assert(stats.size > 0, 'Test 12: default subtitle file should have content');
						})
					});
				});
			});
		});

	});
});