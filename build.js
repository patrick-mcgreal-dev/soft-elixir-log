const path = require("path");
const ssg = require("./simple-ssg");

const INPUT_DIR = "src";
const OUTPUT_DIR = "dist";

const PAGES = [
  { md: "index", css: "index", js: "index" },
];

function main() {

  const inDir = path.join(__dirname, INPUT_DIR);
  ssg.checkDirExists(inDir);

  const outDir = path.join(__dirname, OUTPUT_DIR);
  ssg.checkDirExists(outDir);

  const ejsTemplateDir = path.join(inDir, "pages", "template.ejs");

  for (let page of PAGES) {

    const html = ssg.parseMarkdown(path.join(inDir, "markdown", `${page.md}.md`));

    ssg.renderPage(
      ejsTemplateDir, 
      path.join(outDir, `${page.md}.html`),
      {
        html: html,
        css: page.css,
        script: page.js ? ssg.getFile(path.join(inDir, "js", `${page.js}.js`)) : "",
      }
    );

    ssg.renderStyle(
      path.join(inDir, "stylesheets", `${page.css}.scss`),
      path.join(outDir, `${page.scss}.css`));

  }

}

main();