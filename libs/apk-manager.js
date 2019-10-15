const fs = require('fs-extra');
const util = require('util');
const path = require('path');
const PkgReader = require('reiko-parser');
const config = require('../config');

const uploadDir = config.uploadDir;

fs.ensureDir(uploadDir);

// store data
const appListFile = path.join(uploadDir, 'appList.json');
const appList = [];

if (fs.pathExistsSync(appListFile)) {
	const list = fs.readJsonSync(appListFile);
	list.map(row => appList.push(row));
}

const apkReader = file => {
	const reader = new PkgReader(file, 'apk', { withIcon: true });
	return new Promise((resolve, reject) => {
		reader.parse((err, pkgInfo) => {
			if (err) {
				reject(err);
			} else {
				resolve(pkgInfo); // pkgInfo.icon is encoded to base64
			}
		});
	});
};

const add = async file => {
	const tmpDir = '/tmp/cn.ineva.upload/unzip-tmp'; // temp dir
	await fs.remove(tmpDir);

	const manifest = await apkReader(file);

	const app = {
		id: path.basename(file, '.apk'),
		name: manifest.application.label[0],
		version: manifest.versionName,
		identifier: manifest.package,
		build: manifest.versionCode.toString(),
		date: new Date(),
		size: (await fs.lstat(file)).size,
		noneIcon: false,
		type: 'apk'
	};

	appList.unshift(app);
	await fs.writeJson(appListFile, appList);

	// save files to target dir
	// TODO: upload dir configable
	const targetDir = path.join(uploadDir, app.type, app.identifier, app.id);
	await fs.move(file, path.join(targetDir, 'apk.apk'));

	var data = manifest.icon.replace(/^data:image\/\w+;base64,/, '');
	var buf = new Buffer(data, 'base64');
	await fs.writeFile(path.join(targetDir, 'icon.png'), buf);

	await fs.remove(tmpDir);
};

module.exports = {
	add
};
