const gulp = require('gulp');
const babel = require('gulp-babel');
const concat = require('gulp-concat');

gulp.task('compile', () => {
  gulp.src('./scripts/*.js')
    .pipe(babel())
    .pipe(concat('main.gs'))
    .pipe(gulp.dest('.'));
});

gulp.task('watch', () => {
  gulp.watch('./scripts/*.js', ['compile']);
});