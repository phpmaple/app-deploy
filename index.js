const router = require('koa-route');
const serve = require('koa-static');
const Koa = require('koa');
const app = new Koa();
const config = require('./config');
const { createPlistBody } = require('./libs/plist');
const ipaManager = require('./libs/ipa-manager');
const apkManager = require('./libs/apk-manager');
const upload = require('./middle/upload');
const locale = require('koa-locale');
const moment = require('moment');
const path = require('path');
const publicURL = require('./libs/public-url');

// locale
locale(app);
app.use(async (ctx, next) => {
	// set moment language
	moment.locale(ctx.getLocaleFromCookie());
	await next();
});

// static files
app.use(serve(path.join(__dirname, 'public'), { defer: true }));
app.use(
	serve(config.uploadDir, { maxage: 1000 * 3600 * 24 * 365, defer: true })
);

// get app list
app.use(
	router.get('/api/list', async ctx => {
		if (!canAccess(ctx)) {
			return;
		}
		ctx.body = ipaManager.list(publicURL(ctx));
	})
);

app.use(
	router.get('/api/name/:name/type/:type', async (ctx, name, type) => {
		ctx.body = ipaManager.locate(name, type, publicURL(ctx));
	})
);

app.use(
	router.get('/api/info/:identifierHash', async (ctx, identifierHash) => {
		ctx.body = ipaManager.find(identifierHash, publicURL(ctx));
	})
);

// import ipa
app.use(
	router.post(
		'/api/upload',
		upload(
			{
				defExt: 'ipa'
			},
			async (ctx, files) => {
				const isAndroid = files[0].endsWith('.apk');
				if (!canAccess(ctx)) {
					return;
				}
				if (isAndroid) {
					try {
						await apkManager.add(files[0]);
						ctx.body = { msg: 'Upload Done' };
					} catch (err) {
						console.log('Upload fail:', err);
						ctx.body = { err: 'Upload fail' };
					}
					return;
				}

				try {
					await ipaManager.add(files[0]);
					ctx.body = { msg: 'Upload Done' };
				} catch (err) {
					console.log('Upload fail:', err);
					ctx.body = { err: 'Upload fail' };
				}
			}
		)
	)
);

// get install plist
app.use(
	router.get('/plist/:id.plist', async (ctx, id) => {
		const info = ipaManager.find(id, publicURL(ctx));
		ctx.set(
			'Content-Disposition',
			`attachment; filename=${encodeURI(info.identifier)}.plist`
		);
		ctx.body = createPlistBody(info);
	})
);

// catch crash
app.on('error', err => {
	console.error('*** SERVER ERROR ***\n', err);
	err.status !== 400 &&
		config.debug &&
		require('child_process').spawn('say', ['oh my god, crash!']);
});

// start service
app.listen(config.port, config.host, () => {
	console.log(`Server started: http://${config.host}:${config.port}`);
});

const ACCESS_KEY = process.env.ACCESS_KEY;
function canAccess(ctx) {
	if (ACCESS_KEY && ctx.request.query.key != ACCESS_KEY) {
		console.log('Access Fail!');
		ctx.body = { err: 'Access Fail!' };
		return false;
	}
	return true;
}
