const del = require("del");
const path = require("path");

module.exports = function (gulp, dest) {
  gulp.task("clean", function () {
    return del([path.join(dest, "**", "*")]);
  });
};
