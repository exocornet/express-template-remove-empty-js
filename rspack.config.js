/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('node:fs');
const path = require('node:path');
const StylelintWebpackPlugin = require('stylelint-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const magicImporter = require('node-sass-magic-importer');
const { CssExtractRspackPlugin, CopyRspackPlugin, SwcJsMinimizerRspackPlugin } = require('@rspack/core');
const ENTRY_TS_SCSS_OBJ = require('./configurations/watch-include-link-script');
// const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');

// # УДАЛЕНИЕ ПУСТЫХ JS ФАЙЛОВ # //
class RemoveEmptyScriptsPlugin {
	apply(compiler) {
		compiler.hooks.done.tap('RemoveEmptyScriptsPlugin', () => {
			this.deleteEmptyJSFiles(compiler.options.output.path);
		});
	}

	deleteEmptyJSFiles(pathDir) {
		fs.readdirSync(pathDir).forEach((file) => {
			const filePath = path.join(pathDir, file);

			if (fs.statSync(filePath).isDirectory()) {
				this.deleteEmptyJSFiles(filePath);
			} else if (path.extname(filePath) === '.js' && fs.statSync(filePath).size === 0) {
				fs.unlinkSync(filePath);
			}
		});
	}
}

const optionsMinimizer = [
	new SwcJsMinimizerRspackPlugin({
		test: /\.js(\?.*)?$/i,
		terserOptions: {
			format: {
				comments: false,
			},
		},
		extractComments: false,
		parallel: true,
	}),
];

module.exports = (options) => {
	const { isDev, isProd, isBuild, paths, FAVICON } = options;
	const plugins = [];

	if (FAVICON) {
		plugins.push(
			new CopyRspackPlugin({
				patterns: [
					{
						from: `src/app/${FAVICON}`,
					},
				],
			})
		);
	}

	if (isBuild) {
		plugins.push(new RemoveEmptyScriptsPlugin());
	}

	if (isDev) {
		plugins.push(
			new StylelintWebpackPlugin({
				configFile: '.stylelintrc.json',
				context: 'src',
				files: '**/*.scss',
				failOnError: false,
				quiet: false,
			}),
			new ESLintPlugin({
				context: 'src',
				extensions: ['js', 'ts'],
				fix: true,
				failOnError: false,
				quiet: true,
			})
		);
	}

	plugins.push(
		new CssExtractRspackPlugin({
			filename: 'css/[name].css',
		}),
		new CopyRspackPlugin({
			patterns: [
				{
					from: 'public/fake-api',
					to: 'assets/fake-api',
				},
			],
		}),
		new CopyRspackPlugin({
			patterns: [
				{
					from: 'public/media',
					to: 'assets/',
				},
			],
		})
	);

	return {
		// cache: isDev ? { type: 'memory' } : false,
		cache: true,
		experiments: {
			css: false, // Отключаем экспериментальную функциональность CSS
		},
		context: __dirname,
		mode: isDev ? 'development' : 'production',
		entry: {
			main: ['./src/app/main.ts', './src/app/main.scss'],
			...ENTRY_TS_SCSS_OBJ,
			// 'css/main': './src/app/main.scss',
		},
		output: {
			path: isDev || isProd ? `${paths.dist}` : `${paths.build}`,
			filename: 'js/[name].js',
			publicPath: isDev || isProd ? '/' : '/',
			clean: isBuild,
		},
		resolve: {
			extensions: ['.js', '.tsx', '.ts'],
			alias: {
				FONTS: `${paths.fonts}`,
				IMAGES: `${paths.images}`,
				VIDEOS: `${paths.videos}`,
				AUDIOS: `${paths.audios}`,
				DOCUMENTS: `${paths.documents}`,
				ENTITIES: `${paths.entities}`,
				WIDGETS: `${paths.widgets}`,
				PAGES: `${paths.pages}`,
			},
		},
		// 'eval-source-map'
		devtool: isDev ? 'inline-source-map' : false,
		// devServer: {
		// 	static: './build',
		// 	client: {
		// 		progress: true,
		// 		overlay: {
		// 			errors: true,
		// 			warnings: false,
		// 		},
		// 	},
		// 	historyApiFallback: true,
		// 	compress: true,
		// 	hot: true,
		// 	watchFiles: 'src/**/*',
		// },
		module: {
			rules: [
				{
					test: /\.(js|jsx|ts|tsx)$/,
					loader: 'builtin:swc-loader',
					options: {
						jsc: {
							parser: {
								syntax: 'typescript',
							},
							// externalHelpers: true,
							transform: {
								react: {
									runtime: 'automatic',
									development: isDev,
									refresh: isDev,
								},
							},
						},
					},
					exclude: /node_modules/,
				},
				{
					test: /\.(jpe?g|png|gif|svg|webp)$/i,
					exclude: /fonts/,
					type: 'asset/resource',
					generator: {
						filename: 'assets/images/[name][ext]',
					},
				},
				{
					test: /\.(mp4|webm)$/i,
					type: 'asset/resource',
					generator: {
						filename: 'assets/video/[name][ext]',
					},
				},
				{
					test: /\.(mp3)$/i,
					type: 'asset/resource',
					generator: {
						filename: 'assets/audio/[name][ext]',
					},
				},
				{
					test: /\.(woff(2)?|eot|ttf|otf|svg)$/,
					exclude: /media/,
					type: 'asset/resource',
					generator: {
						filename: 'fonts/[name][ext]',
					},
				},
				{
					test: /\.(s[ac]ss|css)$/i,
					// type: 'css',
					use: [
						{
							loader: CssExtractRspackPlugin.loader,
							// options: {
							// 	esModule: false,
							// 	emit: false,
							// },
						},
						{
							loader: 'css-loader',
							options: {
								sourceMap: isDev,
							},
						},
						{
							loader: 'postcss-loader',
							options: {
								sourceMap: isDev,
							},
						},
						{
							loader: 'sass-loader',
							options: {
								sourceMap: isDev,
								sassOptions: {
									importer: magicImporter(),
									logger: {
										// sourceMap: isDev,
										warn: function (message) {
											process.stderr.write(`\n${message}\n\n`);
										},
										debug: function (message) {
											process.stderr.write(`\n${message}\n\n`);
										},
									},
								},
							},
						},
					],
				},
			],
		},
		optimization: {
			minimize: isBuild || isProd,
			minimizer: isBuild || isProd ? optionsMinimizer : [],
		},
		plugins,
	};
};
