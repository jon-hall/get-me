var gulp = require('gulp');
var jasmine = require('gulp-jasmine');
var plumber = require('gulp-plumber');
require("harmonize")();
var isWatch = false;

gulp.task('dev', ['test'], function() {
    isWatch = true;
    gulp.watch(['./src/*.js', './src/**/*.js', './test/*.js',
        './test/**/*.js'], ['test']);
});

gulp.task('test', function () {
    return gulp.src(['./test/*spec.js', './test/**/*spec.js'])
        .pipe(plumber({ errorHandler: handleError }))
        .pipe(jasmine());
});

function handleError(err) {
    console.log(err.toString());
    this.emit('end');
    if(!isWatch) {
        // Make sure we exit with non-zero code if not watching
        process.exit(1);
    }
}
