(() => {
  // src/CustomElement.ts
  var cast = {
    "string": (value) => value,
    "number": (value) => Number(value),
    "boolean": (value) => !!value,
    "object": (value) => JSON.parse(value)
  };
  var CustomElement = class extends HTMLElement {
    constructor() {
      super();
      this.model = {};
      this.modelSetters = {};
      this.attachShadow({ mode: "open" });
    }
    resetMarkup() {
      this.shadowRoot.innerHTML = `<style>${this.css}</style>` + this.markup;
    }
    // MODEL FUNCTIONS
    useAttributes() {
      for (let attribute of this.attributes) {
        const modelProp = this.modelStructure.properties[attribute.name];
        if (!modelProp)
          continue;
        this.setModelValue(attribute.name, cast[modelProp.type](attribute.value));
      }
      const attributeObserver = new MutationObserver((mutationList) => {
        mutationList.forEach((mutation) => {
          const modelProp = this.modelStructure.properties[mutation.attributeName];
          if (!modelProp)
            return;
          this.setModelValue(
            mutation.attributeName,
            cast[modelProp.type](this.getAttribute(mutation.attributeName))
          );
        });
      });
      attributeObserver.observe(this, { attributes: true });
    }
    setModel(value) {
      if (this.modelStructure.order) {
        for (const prop of this.modelStructure.order) {
          if (!value.hasOwnProperty(prop))
            continue;
          this.setModelValue(prop, value[prop]);
        }
      }
      for (const prop in this.modelStructure.properties) {
        if (this.modelStructure.order?.includes(prop))
          continue;
        if (!value.hasOwnProperty(prop))
          continue;
        this.setModelValue(prop, value[prop]);
      }
    }
    setModelValue(name, value) {
      this.validateProp(name, value);
      if (this.modelSetters[name]) {
        this.modelSetters[name](this.model[name], value);
      }
      this.model[name] = value;
      this.setAttribute(name, value);
    }
    validateProp(name, value) {
      const propModel = this.modelStructure.properties[name];
      if (!propModel) {
        throw new Error(`[UI] -> {${this.name}} model prop {${name}} does not exist`);
      }
      const correctType = propModel.type == "array" ? Array.isArray(value) : typeof value == propModel.type;
      if (!correctType) {
        throw new Error(`[UI] -> {${this.name}} model prop {${name}} is type {${typeof value}}, but should be of type {${propModel.type}}`);
      }
    }
    getModelValue(name) {
      if (this.model[name])
        return this.model[name];
    }
    // SHADOW ROOT CONVENIENCE FUNCTIONS
    element(selector) {
      return this.shadowRoot.querySelector(selector);
    }
    elements(selector) {
      return this.shadowRoot.querySelectorAll(selector);
    }
    appendElement(element) {
      this.shadowRoot.appendChild(element);
    }
  };

  // src/components/NumberBox.ts
  var NumberBox = class extends CustomElement {
    constructor() {
      super();
      this.name = "number-box";
      this.markup = /*html*/
      `
    <div class="container">\u2025</div>
  `;
      this.css = /*css*/
      `
    :host {  
    }
    .container {
      width: 1.5rem;
      height: 1.5rem;
      padding: 2px;
      // border-bottom: 1px solid black;

      display: flex;
      justify-content: center;
      
      background-color: #e3e0e0;
      color: blue;
    }
    .active {
      background-color: black;
      color: white;
    }
  `;
      this.modelStructure = {
        properties: {
          active: { type: "boolean" },
          digits: { type: "number" },
          digit: { type: "string" },
          textArray: { type: "array" },
          value: { type: "number" },
          min: { type: "number" },
          max: { type: "number" }
        }
      };
      this.model = {
        // configurable
        active: false,
        digits: 0,
        min: 0,
        max: 0,
        value: 0,
        // functional
        digit: "",
        textArray: []
      };
      this.modelSetters = {
        active: (oldValue, newValue) => {
          this.element(".container").classList.toggle("active", newValue);
        },
        value: (oldValue, newValue) => {
          if (newValue < 0) {
            this.model.textArray = [];
            this.element(".container").innerText = "\u2025";
          } else {
            this.element(".container").innerText = newValue = newValue < 10 ? `0${newValue}` : newValue.toString();
          }
        },
        digit: (oldValue, newValue) => {
          let newTextArray = this.model.textArray;
          if (newTextArray.length == 0) {
            newTextArray.push("0");
          } else if (newTextArray.length == this.model.digits) {
            newTextArray.shift();
          }
          newTextArray.push(newValue.toString());
          this.setModelValue("value", parseInt(newTextArray.join("")));
        }
      };
      this.actions = {
        "clear": () => {
          this.setModelValue("value", -1);
        },
        "inc": () => {
          if (this.model.value == this.model.max)
            return;
          this.setModelValue("value", this.model.value + 1);
        },
        "dec": () => {
          if (this.model.value == this.model.min)
            return;
          this.setModelValue("value", this.model.value - 1);
        },
        "incTen": () => {
          const newVal = this.model.value > this.model.max - 10 ? this.model.max : this.model.value + 10;
          this.setModelValue("value", newVal);
        },
        "decTen": () => {
          const newVal = this.model.value < this.model.min + 10 ? this.model.min : this.model.value - 10;
          this.setModelValue("value", newVal);
        }
      };
      this.controls = {
        "d": "clear",
        "mod-s ArrowUp": "inc",
        "mod-s ArrowDown": "dec",
        "mod-s ArrowRight": "incTen",
        "mod-s ArrowLeft": "decTen"
      };
      super.resetMarkup();
    }
    keydown(keys) {
      if (!isNaN(+keys)) {
        this.setModelValue("digit", keys);
        return true;
      }
      for (let control in this.controls) {
        if (keys != control)
          continue;
        this.actions[this.controls[control]]();
        return true;
      }
      return false;
    }
  };

  // src/components/DefBox.ts
  var DefBox = class extends CustomElement {
    constructor() {
      super();
      this.name = "def-box";
      this.markup = /*html*/
      `
    <span class="value"></span>
  `;
      this.css = /*css*/
      `
    :host {}
    .value {
      padding: 2px;
      background-color: #e3e0e0;
    }
    .active {
      background-color: black;
      color: white;
    }
  `;
      this.modelStructure = {
        properties: {
          active: { type: "boolean" },
          digits: { type: "number" },
          digit: { type: "string" },
          text: { type: "array" },
          value: { type: "number" }
        }
      };
      this.model = {
        active: false,
        digits: 0,
        digit: "",
        text: [],
        value: 0
      };
      this.modelSetters = {
        active: (oldValue, newValue) => {
          this.element(".value").classList.toggle("active", newValue);
        },
        digits: (oldValue, newValue) => {
          for (let d = 0; d < newValue; d++) {
            super.setModelValue("digit", "0");
          }
        },
        digit: (oldValue, newValue) => {
          let newTextArray = this.model.text;
          if (newTextArray.length == this.model.digits)
            newTextArray.shift();
          newTextArray.push(newValue.toString());
          this.setModelValue("text", newTextArray);
          this.model.value = parseInt(newTextArray.join(""));
        },
        text: (oldValue, newValue) => {
          this.element(".value").innerText = newValue.join("");
        }
      };
      super.resetMarkup();
    }
  };

  // src/demo/Grid.ts
  var Grid = class extends CustomElement {
    constructor() {
      super();
      this.name = "grid-boxes";
      this.markup = /*html*/
      `
  <div>
    <table>
      <tbody>
      </tbody>
    </table>
  </div>
  `;
      this.css = /*css*/
      `
    :host {
      font-family: monospace;
      font-size: 13px;
      display: inline-block;
      border: 1px dotted;
      padding: 6px;
    }
    th, td {
      padding: 3px;
    }
  `;
      this.modelStructure = {
        properties: {
          active: { type: "boolean" },
          cells: { type: "array" },
          cell: { type: "array" },
          element: { type: "string" }
        },
        order: [
          "cells"
        ]
      };
      this.model = {
        active: false,
        cells: [0, 0],
        cell: [1, 1],
        element: ""
      };
      this.modelSetters = {
        active: (oldValue, newValue) => {
          if (newValue) {
            this.element(`${this.model.element}`).setModelValue("active", newValue);
            window.addEventListener("keydown", this.keydown);
            window.addEventListener("keyup", this.keyup);
          } else {
            this.element(`${this.model.element}[active="true"]`)?.setModelValue("active", newValue);
            this.model.cell = [1, 1];
            window.removeEventListener("keydown", this.keydown);
            window.removeEventListener("keyup", this.keyup);
          }
        },
        cell: (oldValue, newValue) => {
          const oldCell = this.element(`${this.model.element}[active="true"]`);
          if (oldCell)
            oldCell.setModelValue("active", false);
          const cellQuery = `tr:nth-child(${newValue[1]}) td:nth-child(${newValue[0]}) ${this.model.element}`;
          this.element(cellQuery).setModelValue("active", true);
        },
        cells: (oldValue, newValue) => {
        }
      };
      this.actions = {
        "nav-up": () => {
          const newY = this.model.cell[1] == 1 ? this.model.cells[1] : this.model.cell[1] - 1;
          this.setModelValue("cell", [this.model.cell[0], newY]);
        },
        "nav-down": () => {
          const newY = this.model.cell[1] == this.model.cells[1] ? 1 : this.model.cell[1] + 1;
          this.setModelValue("cell", [this.model.cell[0], newY]);
        },
        "nav-left": () => {
          const newX = this.model.cell[0] == 1 ? this.model.cells[0] : this.model.cell[0] - 1;
          this.setModelValue("cell", [newX, this.model.cell[1]]);
        },
        "nav-right": () => {
          const newX = this.model.cell[0] == this.model.cells[0] ? 1 : this.model.cell[0] + 1;
          this.setModelValue("cell", [newX, this.model.cell[1]]);
        },
        "nav-up-end": () => {
          if (this.model.cell[1] == 1)
            return;
          this.setModelValue("cell", [this.model.cell[0], 1]);
        },
        "nav-down-end": () => {
          if (this.model.cell[1] == this.model.cells[1])
            return;
          this.setModelValue("cell", [this.model.cell[0], this.model.cells[1]]);
        },
        "nav-left-end": () => {
          if (this.model.cell[0] == 1)
            return;
          this.setModelValue("cell", [1, this.model.cell[1]]);
        },
        "nav-right-end": () => {
          if (this.model.cell[0] == this.model.cells[0])
            return;
          this.setModelValue("cell", [this.model.cells[0], this.model.cell[1]]);
        }
      };
      // private modkeys = ["Control", "Meta"];
      this.modkeys = ["a", "s"];
      this.controls = {
        "ArrowUp": "nav-up",
        "ArrowDown": "nav-down",
        "ArrowLeft": "nav-left",
        "ArrowRight": "nav-right",
        "mod-a ArrowUp": "nav-up-end",
        "mod-a ArrowDown": "nav-down-end",
        "mod-a ArrowLeft": "nav-left-end",
        "mod-a ArrowRight": "nav-right-end"
      };
      this.keyspressed = [];
      this.keyup = (e) => {
        if (this.modkeys.includes(e.key)) {
          this.keyspressed = this.keyspressed.filter((k) => k != `mod-${e.key}`);
        } else {
          this.keyspressed = this.keyspressed.filter((k) => k != e.key);
        }
      };
      this.keydown = (e) => {
        e.preventDefault();
        if (this.modkeys.includes(e.key)) {
          this.keyspressed = [];
          this.keyspressed.push(`mod-${e.key}`);
          return;
        }
        this.keyspressed.push(e.key);
        for (let control in this.controls) {
          if (this.keyspressed.join(" ") != control)
            continue;
          this.actions[this.controls[control]]();
          this.keyspressed = this.keyspressed.filter((k) => k.includes("mod"));
          return;
        }
        if (this.keyspressed.length > 0) {
          if (this.element(`${this.model.element}[active="true"]`).keydown(this.keyspressed.join(" "))) {
            this.keyspressed = this.keyspressed.filter((k) => k.includes("mod"));
          }
        }
      };
      super.resetMarkup();
    }
  };

  // src/demo/GridNumbers.ts
  var GridNumbers = class extends Grid {
    constructor() {
      super();
      this.name = "grid-numbers";
      super.setModelValue("element", "number-box");
      this.modelSetters.cells = (oldValue, newValue) => {
        const tbody = this.element("tbody");
        for (let row = 1; row <= newValue[1]; row++) {
          const row2 = document.createElement("tr");
          for (let col = 1; col <= newValue[0]; col++) {
            const nb = new NumberBox();
            nb.setModel({ digits: 2, min: 0, max: 99 });
            const td = document.createElement("td");
            td.append(nb);
            row2.appendChild(td);
          }
          tbody.appendChild(row2);
        }
      };
    }
  };

  // src/demo/GridDefs.ts
  var GridDefs = class extends Grid {
    constructor() {
      super();
      this.name = "grid-defs";
      super.setModelValue("element", "def-box");
      this.modelSetters.cells = (oldValue, newValue) => {
        const tbody = this.element("tbody");
        for (let row = 1; row <= newValue[1]; row++) {
          const row2 = document.createElement("tr");
          for (let col = 1; col <= newValue[0]; col++) {
            const nb = new DefBox();
            nb.setModelValue("digits", 2);
            const td = document.createElement("td");
            td.append(nb);
            row2.appendChild(td);
          }
          tbody.appendChild(row2);
        }
      };
    }
  };

  // src/Main.ts
  var components = {
    "number-box": NumberBox,
    "def-box": DefBox,
    "grid-numbers": GridNumbers,
    "grid-defs": GridDefs
  };
  for (const comp in components) {
    if (window.customElements.get(comp))
      continue;
    window.customElements.define(comp, components[comp]);
  }
  var controlRegions = {
    "grid-numbers": document.querySelector("grid-numbers"),
    "grid-defs": document.querySelector("grid-defs")
  };
  document.addEventListener("click", (e) => {
    for (let region in controlRegions) {
      const clickInRegion = controlRegions[region].contains(e.target);
      controlRegions[region].setModelValue("active", clickInRegion);
    }
  });
  controlRegions["grid-numbers"].setModel({ cells: [8, 8], active: true });
  controlRegions["grid-defs"].setModel({ cells: [8, 8] });
})();