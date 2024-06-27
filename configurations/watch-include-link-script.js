/* eslint-disable @typescript-eslint/no-var-requires */
// Функция для поиска и извлечения href из.link.pug файлов
const fs = require('node:fs');
const path = require('node:path');
const paths = require('./paths');
const ENTRY_TS_SCSS_OBJ = {};

function extractPaths(filePath, isLink) {
	const content = fs
		.readFileSync(filePath, 'utf8')
		.split('\n')
		.filter((line) => {
			return line.trim().startsWith(isLink ? 'link(' : 'script(');
		});
	const regexHref = isLink ? /link[^]*?href="\/([^"]+)"/g : /script[^]*?src="\/([^"]+)"/g;
	let matches = [];
	let match;

	while ((match = regexHref.exec(content)) !== null) {
		matches.push(match[1]);
	}

	return matches;
}

function nameFile(path) {
	const parts = path.split('/');
	const fileNameWithoutExtension = parts.pop();
	return fileNameWithoutExtension.split('.')[0];
}

// Основная функция для обработки файлов
function watchIncludeLinkScript(directoryWatch) {
	const files = fs.readdirSync(directoryWatch);

	files.forEach((file) => {
		// Получаем полный путь к файлу/папке
		const filePath = path.join(directoryWatch, file);
		// Проверяем, является ли это файлом или папкой
		const isDirectory = fs.statSync(filePath).isDirectory();

		if (isDirectory) {
			// Если это папка, рекурсивно вызываем функцию traverseDirectory для этой папки
			watchIncludeLinkScript(filePath);
		} else {
			if (file.endsWith('.link.pug') || file.endsWith('.script.pug')) {
				const FILE_PATH = path.join(directoryWatch, file);
				const FILE_PATH_ARR = extractPaths(FILE_PATH, file.endsWith('.link.pug'));

				FILE_PATH_ARR.forEach((filePath) => {
					// Предполагаем, что имя файла может быть использовано как часть пути
					const key = `${nameFile(filePath)}`;
					if (!ENTRY_TS_SCSS_OBJ[key]) {
						ENTRY_TS_SCSS_OBJ[key] = [];
					}
					if (!ENTRY_TS_SCSS_OBJ[key].includes(paths.src + '/' + filePath)) {
						ENTRY_TS_SCSS_OBJ[key].push(paths.src + '/' + filePath);
					}
				});
			}
		}
	});

	return ENTRY_TS_SCSS_OBJ;
}

watchIncludeLinkScript(paths.pages);

module.exports = ENTRY_TS_SCSS_OBJ;
