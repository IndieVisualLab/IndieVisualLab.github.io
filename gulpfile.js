var gulp = require("gulp");
var babel = require("gulp-babel");
var sass = require("gulp-sass");

const sources = {
    javascript: "./source/javascripts/*.js",
    sass: [
        "./source/sass/*.scss",
        "./source/sass/*/*.scss"
    ],
};

gulp.task("babel", function() {
    gulp.src(sources.javascript)
        .pipe(babel({
            presets: ["es2015"]
        }))
        .pipe(gulp.dest("./static/javascripts"));
});

gulp.task("babel-watch", function() {
    gulp.watch(sources.javascript, ["babel"]);
});

gulp.task("sass", function(){
  gulp.src(sources.sass)
    .pipe(sass({ outputStyle: "expanded" }))
    .pipe(gulp.dest("./static/stylesheets"));
});

gulp.task("sass-watch", ["sass"], function() {
    gulp.watch(sources.sass, ["sass"]);
});

gulp.task("watch", ["babel-watch", "sass-watch"]);
gulp.task("default", ["babel", "sass", "watch"]);

