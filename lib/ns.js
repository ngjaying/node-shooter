var path = require('path');
var fs = require('fs');
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
}