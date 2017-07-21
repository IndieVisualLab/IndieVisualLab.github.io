const gulp = require("gulp");
const $ = require("gulp-load-plugins")();
const path = require("path");

gulp.task("webpack", function() {
    const source = "./source/javascripts/main.js";
    const config = {
        watch: true,
        entry: source,
        output: {
            filename: "[name].js"
        },
        module: {
            loaders : [
                { test: /\.(glsl|frag|vert)$/, loader: "raw", exclude: /node_modules/ },
                { 
                    test: /\.(glsl|frag|vert)$/, 
                    loader: "glslify", 
                    exclude: /node_modules/
                },
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    loader: "babel",
                    query: {
                        presets: ["es2015"],
                        compact: false
                    }
                },
                { test:"/\.json$/", loader: "json" }
            ]
        },
        resolve : {
            root : [path.join(__dirname, "bower_components")],
            extensions : ["", ".js"],

            alias : {
                threejs : "threejs/build/three.min.js",
                "dat-gui" : "dat-gui/build/dat.gui.min.js"
            }
        },
        plugins : []
    };

    return gulp.src(source)
        .pipe($.plumber())
        .pipe($.webpack(config))
        .pipe(gulp.dest("static/javascripts"));
});

gulp.task("watch", function() {
    gulp.watch(["./source/stylesheets/*.scss", "./source/stylesheets/*/*.scss"], ["sass"]);
});

gulp.task("sass", function() {
    gulp.src("./source/stylesheets/*.scss")
        .pipe($.plumber())
        .pipe($.sass())
        .pipe(gulp.dest("./static/stylesheets"));
});

gulp.task("default", ["webpack", "watch"]);

