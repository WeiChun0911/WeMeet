var gulp = require('gulp');
var gutil = require('gulp-util');
var gulpif = require('gulp-if');
var streamify = require('gulp-streamify');
var autoprefixer = require('gulp-autoprefixer');
var cssmin = require('gulp-cssmin');
var less = require('gulp-less');
var concat = require('gulp-concat');
var plumber = require('gulp-plumber');
var source = require('vinyl-source-stream');
var babelify = require('babelify');
var browserify = require('browserify');
var watchify = require('watchify');
var uglify = require('gulp-uglify');

var production = process.env.NODE_ENV === 'production';

/*
 |--------------------------------------------------------------------------
 | Compile only project files, excluding all third-party dependencies.
 |--------------------------------------------------------------------------
 */
gulp.task('browserify', function() {
    return 
        //定義入口檔案位置
        browserify('app/main.js')
        //將所有檔案babel後，在進行解析
        .transform(babelify)
        //解析後將檔案綁再一起
        .bundle()
        //輸出到bundle.js檔案裡
        .pipe(source('bundle.js'))
        //uglify後streamify
        .pipe(gulpif(production, streamify(uglify({ mangle: false }))))
        //將檔案輸出到這個位置
        .pipe(gulp.dest('public/js'));
});

/*
 |--------------------------------------------------------------------------
 | Same as browserify task, but will also watch for changes and re-compile.
 |--------------------------------------------------------------------------
 */
gulp.task('browserify-watch', ['browserify'], function() {
    var bundler = watchify(browserify('app/main.js', watchify.args));

    bundler.transform(babelify);
    bundler.on('update', rebundle);
    return rebundle();

    function rebundle() {
        var start = Date.now();
        return bundler.bundle()
            .on('error', function(err) {
                gutil.log(gutil.colors.red(err.toString()));
            })
            .on('end', function() {
                gutil.log(gutil.colors.green('Finished rebundling in', (Date.now() - start) + 'ms.'));
            })
            .pipe(source('bundle.js'))
            .pipe(gulp.dest('public/js/'));
    }
});

/*
 |--------------------------------------------------------------------------
 | Compile LESS stylesheets.
 |--------------------------------------------------------------------------
 */
gulp.task('styles', function() {
    return gulp.src('app/stylesheets/main.less')
        .pipe(plumber())
        .pipe(less())
        .pipe(autoprefixer())
        .pipe(gulpif(production, cssmin()))
        .pipe(gulp.dest('public/css'));
});

gulp.task('watch', function() {
    gulp.watch('app/stylesheets/**/*.less', ['styles']);
});

gulp.task('default', ['styles', 'browserify-watch', 'watch']);
gulp.task('build', ['styles', 'browserify']);
