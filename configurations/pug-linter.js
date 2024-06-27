/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('node:path');
const fs = require('node:fs');
const chokidar = require('chokidar');
const pugLint = require('pug-lint');
const linter = new pugLint();
const { styleText } = require('node:util');

const PUG_RULES = JSON.parse(fs.readFileSync(path.join(__dirname, '../.pug-lintrc.json')));

linter.configure(PUG_RULES);

function handleFileChange(filePath) {
	const ERROR_ARR = linter.checkFile(filePath);

	ERROR_ARR.forEach((error) => {
		const rule = error.code
			.toLowerCase()
			.replace(/^pug:/, '')
			.replace(/^lint_/, '');
		/* eslint-disable-next-line no-console */
		console.log(getFullMessage(error.filename, error.src, error.line, error.column, error.msg, rule), '\n');
	});
}

function getFullMessage(filename, src, line, column, message, rule) {
	let fullMessage;
	let location = line + (column ? ':' + column : '');
	if (src && line >= 1 && line <= src.split('\n').length) {
		let lines = src.split('\n');
		let start = Math.max(line - 3, 0);
		let end = Math.min(lines.length, line + 3);
		// Error context
		let context = lines
			.slice(start, end)
			.map(function (text, i) {
				let curr = i + start + 1;
				let preamble = (curr === line ? '  > ' : '    ') + curr + '| ';
				let out = preamble + text;
				if (curr === line && column > 0) {
					out += '\n';
					out += Array(preamble.length + column).join('-') + '^';
				}
				return out;
			})
			.join('\n');

		fullMessage =
			(filename || 'Pug') +
			':' +
			location +
			'\n' +
			styleText(['red'], context) +
			'\n\n' +
			message +
			'   ' +
			styleText(['gray'], rule);
	} else {
		fullMessage = (filename || 'Pug') + ':' + location + '\n\n' + message + '   ' + styleText(['gray'], rule);
	}
	return fullMessage;
}

function watchLintingPug() {
	chokidar.watch('**/*.pug', { ignored: /(^|[/\\])\../ }).on('change', handleFileChange);
}

module.exports = watchLintingPug;
