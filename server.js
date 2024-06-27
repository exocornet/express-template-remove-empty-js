/* eslint-disable @typescript-eslint/no-var-requires */
// # ПЕРЕМЕННЫЕ NODE.JS # //
const os = require('node:os');
const { createServer } = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

// # ПЕРЕМЕННЫЕ ПАКЕТОВ И ПЛАГИНОВ # //
const rspack = require('@rspack/core');
const chokidar = require('chokidar');
const webpackDevMiddleware = require('webpack-dev-middleware');
const open = require('open');
const compression = require('compression');
const { Server } = require('socket.io');
const beautifyHtml = require('js-beautify').html;
const watchLintingPug = require('./configurations/pug-linter.js');

// # ВСПОМОГАТЕЛЬНЫЕ СКРИПТЫ # //
const { logInformation } = require('./configurations/color-log');
const { replacementSCSSAndTS } = require('./configurations/additional-server-scripts.js');

// # ПЕРЕМЕННЫЕ ПРОЕКТА # //
let port = process.env.PORT || 8000;
const paths = require('./configurations/paths');
const VARIABLES = require('./configurations/variables');
const { isDev, isProd, isBuild, express, app, FAVICON } = VARIABLES;
const router = require('./routes/routes.js');

// # СЖАТИЕ GZIP # //
app.use(compression({ level: 9 }));

/* можно заменить app на router, но требуется детальное изучение так как типы express говорят об неактуальности router */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const config = require('./rspack.config.js');

// # ПОДКЛЮЧЕНИЕ PUG В СРЕДЕ EXPRESS # //
app.set('views', `${paths.src}`);
app.set('view engine', 'pug');

const compiler = rspack(config({ isDev, isProd, isBuild, paths, FAVICON }));

if (isDev) {
	watchLintingPug();
}

const WATCHER_PUG = chokidar.watch(`${paths.src}/**/*.pug`);
let isCachePug = {};
WATCHER_PUG.on('change', () => {
	for (const key in isCachePug) {
		isCachePug[key] = false;
	}
});

let links = [];
VARIABLES.PAGE_ARR.forEach((dirPage) => {
	if (isDev || isProd) {
		// # ROUTER СТРАНИЦЫ # //
		isCachePug[dirPage] = false;
		let cacheHtml = null;
		router.get(`/${dirPage === 'index' ? '' : dirPage}`, function (req, res) {
			const START = Date.now();

			if (isCachePug[dirPage]) {
				res.send(cacheHtml);
			} else {
				res.render(`./pages/${dirPage}/${dirPage}`, function (err, html) {
					if (err) {
						res.send('<b style="color:red;">PAGE ERRORS</b>');
						/* eslint-disable-next-line no-console */
						console.error(err);
					} else {
						isCachePug[dirPage] = true;
						html = replacementSCSSAndTS(html);
						cacheHtml = html;
						res.send(html);
					}
				});
			}

			res.on('finish', () => {
				const duration = Date.now() - START;
				/* eslint-disable-next-line no-console */
				console.log(`GET ${req.originalUrl} ${res.statusCode} in ${duration}ms`);
			});
		});

		// # ПЕРЕАДРЕСАЦИЯ СТРАНИЦЫ ПРИ ДОБАВЛЕНИЕ В КОНЦЕ СЛЭША ("/") # //
		app.use((req, res, next) => {
			if (req.path === `/${dirPage}/`) {
				res.redirect(301, `/${dirPage}`);
			} else {
				next();
			}
		});
	}

	if (isBuild) {
		// # BUILD СТРАНИЦ С ПОМОЩЬЮ EXPRESS # //
		compiler.hooks.done.tap('buildPages', function () {
			app.render(
				`${paths.pages}/${dirPage}/${dirPage}.pug`,
				{ pretty: true, compileDebug: true },
				function (err, html) {
					if (err) {
						/* eslint-disable-next-line no-console */
						console.error(err);
						throw new Error('Something went wrong in render');
					} else {
						html = replacementSCSSAndTS(html);
						const htmlPretty = beautifyHtml(html, {
							indent_size: 2,
							indent_char: ' ',
							indent_with_tabs: true,
							editorconfig: true,
						});

						fs.writeFileSync(path.join(`${paths.build}`, `${dirPage}.html`), htmlPretty, 'utf8');

						/* eslint-disable-next-line no-console */
						console.log(`Build page ${dirPage}`);
					}
				}
			);
		});
	}

	// Создание объекта с данными страниц
	links.push({
		link: `./${dirPage === 'index' ? '' : dirPage}`,
		title: dirPage,
	});
});

// # НАСТРОЙКА И ПОДКЛЮЧЕНИЕ WEBPACK'а # //
app.use(
	webpackDevMiddleware(compiler, {
		publicPath: isDev || isProd ? '/' : '/',
		writeToDisk: isBuild,
		stats: {
			children: true,
			errorDetails: true,
			loggingDebug: ['sass-loader'],
		},
	})
);

// # ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ДЛЯ PUG ШАБЛОНОВ # //
app.locals = {
	// ## Переменные состояния окружения ## //
	isDev,
	// ## Переменные основных архитектурных директорий ## //
	FONTS: '/fonts',
	IMAGES: '/assets/images',
	VIDEOS: '/assets/videos',
	AUDIOS: '/assets/audios',
	DOCUMENTS: '/assets/documents',
	ENTITIES: `${paths.entities}`,
	WIDGETS: `${paths.widgets}`,
	PAGES: `${paths.pages}`,
	// [START] ===> переменные фавиконки
	FAVICON: VARIABLES.FAVICON,
	FAVICON_TYPE: VARIABLES.FAVICON_TYPE,
	// переменные фавиконки <=== [END]
	media: VARIABLES.MEDIA,
	listLinks: links,
};

// # ОПРЕДЕЛЕНИЕ МАРШРУТОВ ДЛЯ ЗАПРОСОВ # //
app.use(router);

if (isBuild) {
	compiler.hooks.done.tap('buildPages', function () {
		// # ВЫВОД СООБЩЕНИЯ ОБ УСПЕШНОМ БИЛДЕ И ЗАВЕРШЕНИЕ РАБОТЫ В ТЕРМИНАЛЕ # //
		setTimeout(() => {
			logInformation('\nEND BUILD\n');
			process.exit(0);
		}, 0);
	});
}

if (isDev || isProd) {
	// # СОЗДАНИЕ СЕРВЕРА # //
	const server = createServer(app);

	if (isDev) {
		const io = new Server(server);

		// # ОТСЛЕЖЕНИЕ ИЗМЕНЕНИЙ В ФАЙЛАХ И ПЕРЕЗАГРУЗКА СТРАНИЦЫ # //
		const watcher = chokidar.watch(paths.src);
		watcher.on('change', () => {
			io.emit('webpackUpdate');
		});
	}

	// # ОПРЕДЕЛЕНИЕ IPv4 # //
	let IPv4 = '';
	const networkInterfaces = os.networkInterfaces();
	for (const name of Object.keys(networkInterfaces)) {
		for (const netInterface of networkInterfaces[name]) {
			// Проверка на IPv4 адрес и исключение внешних и внутренних адресов
			if (!netInterface.internal && netInterface.family === 'IPv4') {
				IPv4 = netInterface.address;
			}
		}
	}

	// # ЗАПУСК СЕРВЕРА # //
	const SERVER_START = server.listen(port, () => {
		/* eslint-disable-next-line no-console */
		console.log(`Loopback: http://localhost:${port}`);
		/* eslint-disable-next-line no-console */
		console.log(`On Your Network (IPv4): http://${IPv4}:${port}\n\n`);

		if (isDev) {
			if (VARIABLES.PAGE_ARR.includes('list-pages')) {
				open(`http://localhost:${port}/list-pages`);
			} else {
				open(`http://localhost:${port}`);
			}
		}
	});

	// # ОБРАБОТКА ОШИБОК # //
	server.on('error', (err) => {
		if (err.code === 'EADDRINUSE') {
			SERVER_START.listen(++port);
		}
	});
}
