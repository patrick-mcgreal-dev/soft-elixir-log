import * as fs from "fs";

import * as ejs from "ejs";
import * as sass from "sass";
import * as marked from "marked";

export const ensureDirExists = (dir) => {
  if (!fs.existsSync(dir)) {
    throw new Error("-- Directory [ " + dir + " ] does not exist --");
  }
};

export const getFile = (dir) => {
  return fs.readFileSync(dir, "utf8");
};

export const parseMarkdown = (srcDir) => {
  let markdown = fs.readFileSync(srcDir, "utf8");
  return marked.parse(markdown);
};

export const renderPage = (sourceDir, destDir, data) => {
  ejs.renderFile(sourceDir, data, (err, str) => {
    if (err != undefined) throw err;
    fs.writeFile(destDir, str, (err) => {
      if (err != undefined) throw err;
    });
  });  
};

export const renderStyle = (sourceDir, destDir) => {
  sass.render({ file: sourceDir }, (err, result) => {
    if (err != undefined) throw err;
    fs.writeFile(destDir, result.css.toString(), (err) => {
      if (err != undefined) throw err;
    });
  });
};