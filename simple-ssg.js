const fs = require("fs");

const ejs = require("ejs");
const sass = require("sass");
const marked = require("marked");

module.exports = {

  ensureDirExists: (dir) => {
    if (!fs.existsSync(dir)) {
      throw new Error("-- Directory [ " + dir + " ] does not exist --");
    }
  },

  getFile: (dir) => {
    return fs.readFileSync(dir, "utf8");
  },
  
  parseMarkdown: (srcDir) => {
    let markdown = fs.readFileSync(srcDir, "utf8");
    return marked.parse(markdown);
  },
  
  renderPage: (sourceDir, destDir, data) => {
    ejs.renderFile(sourceDir, data, (err, str) => {
      if (err != undefined) throw err;
      fs.writeFile(destDir, str, (err) => {
        if (err != undefined) throw err;
      });
    });  
  },
  
  renderStyle: (sourceDir, destDir) => {
    sass.render({ file: sourceDir }, (err, result) => {
      if (err != undefined) throw err;
      fs.writeFile(destDir, result.css.toString(), (err) => {
        if (err != undefined) throw err;
      });
    });
  
  },

};