const autoprefixer = require("gulp-autoprefixer");
const babel = require('gulp-babel');
const browserify = require('browserify');
const browserSync = require("browser-sync").create();
const clean = require("gulp-clean");
const concat = require("gulp-concat");
const gulp = require("gulp");
const postcss = require("gulp-postcss");
const pug = require('gulp-pug');
const source = require('vinyl-source-stream');
const rename = require('gulp-rename');
const rigger = require("gulp-rigger");
let sass = require("gulp-sass");
sass.compiler = require("node-sass");
const sourcemaps = require("gulp-sourcemaps");
const sortMediaQueries = require("postcss-sort-media-queries");
const svgSprite = require("gulp-svg-sprite");
//const mqpacker = require("css-mqpacker");
//const argv = require("yargs").argv;
//const gulpIf = require("gulp-if");

const property = {
    result: {
        main: "./Result/",
        css: "./Result/Content/css/",
        scripts: "./Result/Content/scripts/",
        images: "./Result/Content/images/",
        svg: "./Result/Content/images/",
        fonts: "./Result/Content/fonts/",
        libs: "./Result/Content/libs/",
    },
    source: {
        main: "./Source/",
        html: {
            main: "./Source/html/",
            include: "./Source/html/include/",
        },
        pug: "./Source/pug/",
        scss: "./Source/scss/",
        fonts: "./Source/fonts/",
        images: "./Source/images/",
        svg: "./Source/images/svg-sprite/",
        libs: "./Source/libs/",
        scripts: "./Source/scripts/",
    },
};

gulp.task("clean", function () {
    return gulp.src([property.result.main, './tmp'], {allowEmpty: true})
        .pipe(clean());
});

gulp.task("sass", function () {
    return gulp
        .src(property.source.scss + "/*.scss")
        .pipe(sourcemaps.init())
        .pipe(sass().on("error", sass.logError))
        .pipe(
            autoprefixer({
                cascade: false,
                overrideBrowserslist: ["last 2 versions"],
            })
        )
        .pipe(
            postcss([
                sortMediaQueries({
                    sort: "desktop-first",
                }),
            ])
        )
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest(property.result.css));
});

gulp.task("concat-js-libs", function () {
    return gulp
        .src([
            property.source.libs + "/**/jquery/*.js",
            property.source.libs + "/**/*(!jquery)*/*.js"
        ])
        .pipe(concat("libs.js"))
        .pipe(gulp.dest(property.result.libs));
});

gulp.task("concat-css-libs", function () {
    return gulp
        .src([
            property.source.libs + "/**/*.css"
        ])
        .pipe(concat("libs.css"))
        .pipe(gulp.dest(property.result.libs));
});

gulp.task("libs:build", function () {
    return gulp
        .src(property.source.libs + "/**/*.{png,jpg,gif}")
        .pipe(rename({dirname: ''}))
        .pipe(gulp.dest(property.result.libs));
});

gulp.task("svgSprite", function () {
    return gulp
        .src(property.source.svg + "/*.svg")
        .pipe(
            svgSprite({
                mode: {
                    stack: {
                        sprite: "../sprite.svg",
                    },
                },
            })
        )
        .pipe(gulp.dest(property.result.svg));
});

gulp.task("script:build", function () {
    return gulp
        .src(property.source.scripts + "/*.js")
        .pipe(babel({
            presets: ['@babel/env']
        }))
        //.pipe(concat('main.js'))
        //.pipe(gulp.dest(property.result.scripts));
        .pipe(gulp.dest("./tmp"));
});

gulp.task("script:browserify", function () {
    return browserify("./tmp/main.js")
        .bundle()
        .pipe(source('main.js'))
        .pipe(gulp.dest(property.result.scripts));
});

gulp.task("fonts:build", function () {
    return gulp
        .src(property.source.fonts + "/**/*.{woff,woff2,ttf}")
        .pipe(gulp.dest(property.result.fonts));
});

gulp.task("img:build", function () {
    return gulp
        .src(
            [
                property.source.images + "/**/*",
                "!" + property.source.images + "/svg-sprite/",
                "!" + property.source.images + "/svg-sprite/**/*",
            ],
            { nodir: true }
        )
        .pipe(gulp.dest(property.result.images));
});

gulp.task('pug:build', function buildHTML() {
    return gulp.src(property.source.pug + "/*.pug")
        .pipe(pug({
            pretty: true,
            locals: { objectHash: require("object-hash") },
        }))
        .pipe(gulp.dest(property.result.main))
});

gulp.task("html:build", function () {
    return gulp
        .src(
            [
                property.source.html.main + "/**/*.html",
                "!" + property.source.html.main + "/include/",
                "!" + property.source.html.main + "/include/**/*",
            ],
            { nodir: true }
        )
        .pipe(rigger())
        .pipe(gulp.dest(property.result.main));
});

gulp.task("watch", function () {
    gulp.watch(property.source.main + "**/*", gulp.series("build"));
});

/**/

gulp.task(
    "build",
    gulp.series([
        "clean",
        "sass",
        "concat-js-libs",
        "concat-css-libs",
        "libs:build",
        "script:build",
        "script:browserify",
        "fonts:build",
        "img:build",
        "svgSprite",
        "pug:build",
        "html:build",
    ])
);

gulp.task("serve", function (done) {
    browserSync.init({
        server: {
            baseDir: property.result.main,
            browser: ["explorer"],
        },
    });

    gulp.watch(property.source.main + "**/*", gulp.series("build", "reload"));
});

gulp.task("reload", function (done) {
    browserSync.reload();
    done();
});