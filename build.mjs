import * as path from "path";
import { fileURLToPath } from 'url';
import * as ssg from "./simple-ssg.mjs";
import * as esbuild from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const INPUT_DIR = "src";
const OUTPUT_DIR = "dist";

console.log(ssg)
console.log(ssg.parseMarkdown);

const PAGES = [
  { md: "index", css: "_common" },
  { md: "features", css: "_common" },
  { md: "dev", css: "dev", js: "dev" },
];

function main() {

  const inDir = path.join(__dirname, INPUT_DIR);
  const outDir = path.join(__dirname, OUTPUT_DIR);

  const ejsTemplateDir = path.join(inDir, "pages", "template.ejs");
  const generatedCss = [];

  for (let page of PAGES) {

    const html = ssg.parseMarkdown(path.join(inDir, "markdown", `${page.md}.md`));

    ssg.renderPage(
      ejsTemplateDir, 
      path.join(outDir, `${page.md}.html`),
      {
        html: html,
        css: page.css,
        script: page.js || ""
      }
    );

    if (!generatedCss.includes(page.css)) {

      ssg.renderStyle(
        path.join(inDir, "stylesheets", `${page.css}.scss`),
        path.join(outDir, "stylesheets", `${page.css}.css`));

        generatedCss.push(page.css);

    }

  }

}

main();