/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('node:fs');
// const { styleText } = require('node:util');
const paths = require('./paths');
const { logError } = require('./color-log');

// # СОЗДАНИЕ ПЕРЕМЕННЫХ ДЛЯ ОКРУЖЕНИЯ EXPRESS # //
const express = require('express');
const app = express();
const router = express.Router();

// Переменные страниц
const PAGE_ARR = fs.readdirSync(paths.pages);

// Переменные окружения
const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';
const isBuild = process.env.NODE_ENV === 'build';

// Переменные фавиконки
const faviconFile = fs.readdirSync(paths.app).find(function (file) {
	return file.startsWith('favicon');
});
if (!faviconFile) {
	logError('Файл с favicon не найден!\nДобавьте в директорию по пути src/app/\n');
}
const faviconType = {
	ico: 'image/x-icon',
	png: 'image/png',
	svg: 'image/svg+xml',
	jpg: 'image/jpeg',
	gif: 'image/gif',
};

module.exports = {
	// Переменные проекта
	express,
	app,
	router,
	// Переменные окружения
	PAGE_ARR,
	isDev,
	isProd,
	isBuild,
	// Переменные фавиконки для pug
	FAVICON_TYPE: `${faviconType[`${faviconFile?.slice(-3)}`]}`,
	FAVICON: faviconFile,
	// Переменные для pug
	MEDIA: {
		xs: '767px',
		md: '1279px',
		lg: '1599px',
		xl: '1919px',
	},
};
