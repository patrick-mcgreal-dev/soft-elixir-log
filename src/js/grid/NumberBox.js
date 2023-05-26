import { CustomElement } from "./CustomElement";
export class NumberBox extends CustomElement {
  name = "number-box";
  modelStructure = {
    properties: {
      digits: { type: "number" },
      value: { type: "number" },
      min: { type: "number" },
      max: { type: "number" }
    },
    attributes: ["value"]
  };
  model = {
    digits: 0,
    min: 0,
    max: 0,
    value: -1
  };
  modelSetters = {
    value: (oldValue, newValue) => {
      if (newValue < 0) {
        this.textArray = [];
      }
    }
  };
  actions = {
    "digit": (key) => {
      this.digit(key.charAt(5));
    },
    "clear": () => {
      this.setAndPublishValue(-1);
    },
    "inc": () => {
      if (this.model.value == this.model.max)
        return;
      this.setAndPublishValue(this.model.value + 1);
    },
    "dec": () => {
      if (this.model.value == this.model.min)
        return;
      this.setAndPublishValue(this.model.value - 1);
    },
    "incTen": () => {
      const newVal = this.model.value > this.model.max - 10 ? this.model.max : this.model.value + 10;
      this.setAndPublishValue(newVal);
    },
    "decTen": () => {
      const newVal = this.model.value < this.model.min + 10 ? this.model.min : this.model.value - 10;
      this.setAndPublishValue(newVal);
    }
  };
  controls = {
    // this is shameful...
    "Digit0": "digit",
    "Digit1": "digit",
    "Digit2": "digit",
    "Digit3": "digit",
    "Digit4": "digit",
    "Digit5": "digit",
    "Digit6": "digit",
    "Digit7": "digit",
    "Digit8": "digit",
    "Digit9": "digit",
    "KeyD": "clear",
    "mod-KeyS ArrowRight": "inc",
    "mod-KeyS ArrowLeft": "dec",
    "mod-KeyS ArrowUp": "incTen",
    "mod-KeyS ArrowDown": "decTen"
  };
  textArray = [];
  constructor() {
    super();
    super.useAttributes();
  }
  digit(value) {
    let newTextArray = this.textArray;
    if (newTextArray.length == 0) {
      newTextArray.push("0");
    } else if (newTextArray.length == this.model.digits) {
      newTextArray.shift();
    }
    newTextArray.push(value);
    this.setAndPublishValue(parseInt(newTextArray.join("")));
  }
  setAndPublishValue(value) {
    this.setModelValue("value", value);
    this.dispatchEvent(new CustomEvent("value", { detail: {
      v: this.model.value,
      s: this.model.value.toString().padStart(this.model.digits, "0")
    } }));
  }
}
