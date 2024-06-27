/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('node:fs');
const path = require('node:path');
const { logInformation, logSuccessfully, logError } = require('./color-log');
const { prompt } = require('enquirer');

function convertDir(entry, output, extensions, saveEntry) {
	fs.readdirSync(entry).forEach((file) => {
		const FILE_PATH = path.join(entry, file);
		const STAT = fs.statSync(FILE_PATH);

		if (STAT.isDirectory()) {
			convertDir(FILE_PATH, output, extensions, saveEntry); // Рекурсивный вызов для подпапок
		} else if (STAT.isFile() && extensions.includes(path.extname(FILE_PATH))) {
			let SAVE_PATH = FILE_PATH.substring(0, FILE_PATH.lastIndexOf('/'));

			if (saveEntry !== output) {
				SAVE_PATH = SAVE_PATH.replace(saveEntry, output);
			}

			import('imagemin').then((imagemin) => {
				import('imagemin-webp').then((imageminWebp) => {
					imagemin.default([`${FILE_PATH}`], {
						destination: `${SAVE_PATH}`,
						plugins: [
							imageminWebp.default({
								quality: 100,
							}),
						],
					});
				});
			});

			logSuccessfully('✔ ' + FILE_PATH);
		}
	});
}

function convert(entry, output, extensions) {
	if (fs.statSync(entry).isDirectory()) {
		logInformation(`\nПуть для сохранения файлов: ${output}`);
		logInformation('\nСЛЕДУЮЩИЕ ФАЙЛЫ КАРТИНОК БЫЛИ КОНВЕРТИРОВАНЫ В WEBP:\n');

		convertDir(entry, output, extensions, entry);
	} else if (fs.statSync(entry).isFile() && extensions.includes(path.extname(entry))) {
		logInformation(`\nПуть для сохранения файла: ${output}`);

		import('imagemin').then((imagemin) => {
			import('imagemin-webp').then((imageminWebp) => {
				imagemin.default([`${entry}`], {
					destination: `${output}`,
					plugins: [
						imageminWebp.default({
							quality: 90,
						}),
					],
				});
			});
		});
	} else {
		logInformation(
			`\nДанное расширение файла ${path.extname(entry)} не подходят под конвертацию. Проверте на соответствие расширениям [png,jpeg,jpg,webp].\n`
		);
	}
}

function imageConversionWebp(inputPaths, extensions) {
	const PATHS = inputPaths.split(' ');
	const ENTRY_PATH = PATHS[0];
	let outputPath = PATHS[1] || ENTRY_PATH;

	if (fs.existsSync(ENTRY_PATH)) {
		if (PATHS[1]) {
			if (PATHS[1].includes('.')) {
				logError('\nНекоректный путь к директории для сохранения\n');
			} else {
				convert(ENTRY_PATH, outputPath, extensions);
			}
		} else {
			if (ENTRY_PATH.includes('.')) {
				outputPath = ENTRY_PATH.replace(/\/[^/]+$/, '');
			} else {
				outputPath = ENTRY_PATH;
			}

			convert(ENTRY_PATH, outputPath, extensions);
		}
	} else {
		logError('\nУказан неверный путь к файлу или директории\n');
	}
}

prompt({
	type: 'input',
	name: 'confirmQuestion',
	message:
		'Введите путь до картинки или директории с расширениями [png,jpeg,jpg,webp] для конвертации в webp или сжатия и через пробел директорию для сохранения. Если директория не указана будет сохранено в туже директорию, что может привести к перезаписыванию файлов.\n',
	onCancel: () => {
		logSuccessfully('\nКонвертация отменена\n');
		process.exit(0);
	},
}).then((result) => {
	if (result.confirmQuestion) {
		imageConversionWebp(result.confirmQuestion, ['.png', '.jpeg', '.jpg', '.webp']);
	} else {
		logInformation('\nВы забыли указать путь до файла\n');
	}
});
