var gulp       = require('gulp');
var concat     = require('gulp-concat');
var webserver  = require('gulp-webserver');
var jshint     = require('gulp-jshint');
var uglify     = require('gulp-uglify');
var plato      = require('gulp-plato');
var hf         = require('gulp-headerfooter');
var replace    = require('gulp-replace');

var files = [
	'base64', 'util', 'des', 'display', 'input', 'jsunzip', 'keyboard', 'keysym', 'keysymdef', 
	'rfb', 'websock', 'webutil'
];

var scriptFiles = files.map(function (f) { return './noVNC/include/' + f + '.js'; });

gulp.task('build-from-novnc', function() {
	gulp.src(['./noVNC/utils/inflator.partial.js'].concat(scriptFiles).concat('./lib/ui.js'))
		.pipe(concat('index.js'))
		.pipe(replace(/Util.load_scripts = function/, 'Util.load_scripts = function () {}; var _none_ = function'))
		.pipe(replace(/module.exports = {Inflate: Inflate};/, 'var inflator = {Inflate: Inflate};'))
		.pipe(replace(/\.\.\/node_modules\/pako/g, 'pako'))
		.pipe(replace('this.resize(240, 20);', 'this.resize(240, 180);')) // saner default size
		.pipe(replace('var fullmsg = "New state', 'cmsg = "New state')) // fix state change reporting
		.pipe(replace("this._sock.off('close');", '')) // fix error with not setting state back to disconnected
		.pipe(hf.header("var angular = require('angular');\n"))
		.pipe(gulp.dest('./dist'))
});

gulp.task('build-concat', function() {
	gulp.src("./lib/*.js")
		.pipe(concat('angular-noVNC.js'))
		.pipe(gulp.dest('./dist'))
});

gulp.task('build-uglify', function() {
	gulp.src("./lib/*.js")
		.pipe(concat('angular-noVNC.min.js'))
		.pipe(uglify({
			mangle: true,
		}))
		.pipe(gulp.dest('./dist'));
});

gulp.task('build', [/*'build-concat', 'build-uglify',*/ 'build-from-novnc']);

gulp.task('webserver', function() {
	gulp.src('./')
		.pipe(webserver({
			livereload: true,
			open: true
		}));
});


gulp.task('watch', function () {
	gulp.watch(['./lib/*.js', 'index.html'], ['build']);
});

var jshintOpts = {
	strict   : true,
	unused   : true,
	curly    : true,
	eqeqeq   : true,
	undef    : true,
	eqnull   : true,
	nonew    : true,
	plusplus : false,
	browser  : true,
	noempty  : true,
	newcap   : false,
	immed    : true,
	latedef  : true,
	quotmark : true,
	multistr : true,
	bitwise  : false,
	indent   : 2,
	maxlen   : 150,
	globals  : {
		angular: true,
		console: true,
		Base64: true,
		Websock_native: true,
		ActiveXObject: true,
		escape: true,
		keysyms: true,
	}
};


gulp.task('lint', function() {
	return gulp.src("./lib/*.js")
		.pipe(jshint(jshintOpts))
		.pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('plato', function () {
	return gulp.src('./lib/*.js')
		.pipe(plato('plato', {
			jshint: {
				options: jshintOpts
			},
			complexity: {
				trycatch: true
			}
		}));
});

gulp.task('default', ['build', 'webserver', 'watch']);
