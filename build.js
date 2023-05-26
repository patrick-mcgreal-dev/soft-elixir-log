const path = require("path");
const ssg = require("./simple-ssg");

const INPUT_DIR = "src";
const OUTPUT_DIR = "dist";

const PAGES = [
  "index"
];

function main() {

  const inDir = path.join(__dirname, INPUT_DIR);
  ssg.checkDirExists(inDir);

  const outDir = path.join(__dirname, OUTPUT_DIR);
  ssg.checkDirExists(outDir);

  const ejsTemplateDir = path.join(inDir, "pages", "template.ejs");

  for (let page of PAGES) {

    const html = ssg.parseMarkdown(path.join(inDir, "markdown", `${page}.md`));

    ssg.renderPage(
      ejsTemplateDir, 
      path.join(outDir, `${page}.html`),
      {
        html: html,
        script: ssg.getFile(path.join(inDir, "js", "main.js")),
      }
    );

    ssg.renderStyle(
      path.join(inDir, "stylesheets", `${page}.scss`), 
      path.join(outDir, `${page}.css`));

  }

}

main();