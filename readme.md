node-shooter - Node.js client for [shooter subtitle API](http://https://docs.google.com/document/d/1ufdzy6jbornkXxsD-OGl3kgWa4P9WO5NZb6_QYZiGI0/preview)
==============================================================
node-shooter is a Node.js client to get subtitle for a video file from shooter.cn
## Installation    
    npm install node-shooter
## How to use
Simply require the node-shooter module. Pass the video file path and the language of the subtitle you want to getSub method. It will download the required subtitle from shooter.cn and save it in the same path and same name with the video file by default.

    var ns = require('node-shooter');
	ns.getSub(videoFilePath, {lang: 'Chn'}, callback);

## API
### ns.getSub(filePath, [options], callback)
Download the subtitle of the video file

- **filePath** String, the file path of the video file
- **options** Object
	- **lang** String, the subtitle language. Could be 'Chn' or 'Eng' for Chinese or English respectively. Default is 'Chn'
	- **targetPath** String, the target path to save the subtitle file. Default is the same path of the video file.
- **callback** Function(err)
### ns.getFileHash(filePath, callback)
Calculate the hash of the video file. The Hash format pleas refer to [shooter video hash](https://docs.google.com/document/d/1w5MCBO61rKQ6hI5m9laJLWse__yTYdRugpVyz4RzrmM/preview)

- **filePath** String, the file path of the video file
- **callback** Function(err, hash), hash is the file hash

### ns.getSubInfo(hash, filePath, lang, callback)
Return an array of object about the subtitle information in the shooter server for the video file. The array format is like [{Desc, Delay, Files[{Ext, Link}]}]

- **hash** String, the video file hash
- **filePath** String, the file path of the video file
- **lang** String, the subtitle language. Could be 'Chn' or 'Eng' for Chinese or English respectively. Default is 'Chn'
- **callback** Function(err, subs), subs is an object array of the subtitle information.

### ns.downloadSub(filePath, subs, targetPath, callback)
Download the first suitable subtitle to the targetPath.

- **filePath** String, the file path of the video file
- **subs** Array, the array of the subtitle information
- **targetPath** String, the target path to save the subtitle file. Default is the same path of the video file.
- **callback** Function(err)
