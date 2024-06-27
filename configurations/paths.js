/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('node:path');

module.exports = {
	src: path.resolve(__dirname, '../src'),
	build: path.resolve(__dirname, '../build'),
	dist: path.resolve(__dirname, '../dist'),
	public: path.resolve(__dirname, '../public'),

	fonts: path.join(__dirname, '../public/fonts'),
	images: path.join(__dirname, '../public/media/images'),
	video: path.join(__dirname, '../public/media/videos'),
	audio: path.join(__dirname, '.../public/media/audios'),
	documents: path.join(__dirname, '.../public/media/documents'),

	app: path.join(__dirname, '../src/app'),
	entities: path.join(__dirname, '../src/entities'),
	widgets: path.join(__dirname, '../src/widgets'),
	pages: path.join(__dirname, '../src/pages'),
};
