/* eslint-disable @typescript-eslint/no-var-requires, no-console */
const { styleText } = require('node:util');

function logError(text) {
	text.split('\n').forEach((text) => {
		console.error(styleText(['bgRed', 'black', 'bold'], text));
	});
}

function logWarning(text) {
	text.split('\n').forEach((text) => {
		console.warn(styleText(['bgYellowBright', 'black'], text));
	});
}

function logSuccessfully(text) {
	text.split('\n').forEach((text) => {
		console.log(styleText(['green'], text));
	});
}

function logInformation(text) {
	text.split('\n').forEach((text) => {
		console.log(styleText(['blueBright'], text));
	});
}

module.exports = { logError, logWarning, logSuccessfully, logInformation };
