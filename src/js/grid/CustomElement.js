const cast = {
  "string": (value) => value,
  "number": (value) => Number(value),
  "boolean": (value) => !!value,
  "object": (value) => JSON.parse(value)
};
export class CustomElement extends HTMLElement {
  name;
  markup;
  css;
  model = {};
  modelStructure;
  modelSetters = {};
  actions = {};
  modkeys = [];
  controls = {};
  controlElementSelectors = [];
  keyspressed = [];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  resetMarkup() {
    this.shadowRoot.innerHTML = `<style>${this.css}</style>` + this.markup;
  }
  // MODEL FUNCTIONS
  useAttributes() {
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
    const validModel = {};
    for (const prop in this.modelStructure.properties) {
      if (!value.hasOwnProperty(prop))
        continue;
      this.setModelValue(prop, value[prop]);
      validModel[prop] = value[prop];
    }
    this.model = validModel;
    const modelSetter = this.modelSetters["model"];
    if (modelSetter)
      modelSetter(validModel);
  }
  setModelValue(name, value) {
    this.validateProp(name, value);
    if (this.modelSetters[name]) {
      this.modelSetters[name](this.model[name], value);
    }
    this.model[name] = value;
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
    return this.shadowRoot?.querySelector(selector);
  }
  elements(selector) {
    return this.shadowRoot?.querySelectorAll(selector);
  }
  appendElement(element) {
    this.shadowRoot?.appendChild(element);
  }
  removeElement(selector) {
    this.shadowRoot?.removeChild(this.element(selector));
  }
  // CONTROLS
  useControls() {
    if (!this.modelStructure?.properties) {
      this.modelStructure = { properties: {} };
    }
    this.modelStructure.properties["controls"] = { type: "boolean" };
    this.modelSetters.controls = (oldValue, newValue) => {
      if (newValue) {
        window.addEventListener("keydown", this.keydown);
        window.addEventListener("keyup", this.keyup);
      } else {
        window.removeEventListener("keydown", this.keydown);
        window.removeEventListener("keyup", this.keyup);
      }
      if (this.modelStructure.properties.controlsActive) {
        this.setModelValue("controlsActive", newValue);
      }
    };
  }
  keyup = (e) => {
    if (this.modkeys.includes(e.code)) {
      this.keyspressed = this.keyspressed.filter((k) => k != `mod-${e.code}`);
    } else {
      this.keyspressed = this.keyspressed.filter((k) => k != e.code);
    }
  };
  keydown = (e) => {
    if (this.keyspressed.length > 3) {
      this.keyspressed = [];
      return;
    }
    if (this.modkeys.includes(e.code)) {
      this.keyspressed = [`mod-${e.code}`];
      return;
    }
    this.keyspressed.push(e.code);
    if (this.keyevent(this.keyspressed.join(" "))) {
      this.keyspressed = this.keyspressed.filter((k) => k.includes("mod"));
      return;
    }
    if (this.keyspressed.length > 0) {
      this.keyspressed = this.delegateChildControls(this.keyspressed, this);
    }
  };
  delegateChildControls(keyspressed, element) {
    const keys = keyspressed.join(" ");
    for (let child of element.controlElementSelectors) {
      const element2 = this.element(child);
      if (element2.keyevent(keys)) {
        return keyspressed.filter((k) => k.includes("mod"));
      }
      if (element2.controlElementSelectors) {
        return element2.delegateChildControls(keyspressed, element2);
      }
    }
    return keyspressed;
  }
  keyevent(keys) {
    const control = this.controls[keys];
    if (control) {
      this.actions[control](keys);
      return true;
    }
    return false;
  }
}
