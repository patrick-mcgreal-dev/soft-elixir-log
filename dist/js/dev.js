(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // src/js/grid/index.js
  var grid_exports = {};
  __export(grid_exports, {
    CanvasGrid: () => CanvasGrid,
    CustomElement: () => CustomElement,
    NumberBox: () => NumberBox
  });

  // src/js/grid/CustomElement.js
  var cast = {
    "string": (value) => value,
    "number": (value) => Number(value),
    "boolean": (value) => !!value,
    "object": (value) => JSON.parse(value)
  };
  var CustomElement = class extends HTMLElement {
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
  };

  // src/js/grid/NumberBox.js
  var NumberBox = class extends CustomElement {
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
  };

  // src/js/grid/CanvasWorker.js
  function createWorker(fn) {
    const blob = new Blob(["self.onmessage = ", fn.toString()], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    return new Worker(url);
  }
  var canvas;
  var ctx;
  var data;
  var layout;
  var activeCellCoords;
  var move;
  var redrawActiveCell;
  var drawGrid;
  var getGridVisibleWidth;
  var CanvasWorker_default = createWorker((e) => {
    switch (e.data.msg) {
      case "init": {
        canvas = e.data.canvas;
        if (!canvas.getContext)
          throw new Error("Canvas is not supported");
        ctx = canvas.getContext("2d", { alpha: false });
        ctx.scale(e.data.dpr, e.data.dpr);
        ctx.font = `${e.data.fontSize}px Menlo`;
        ctx.textBaseline = "middle";
        data = e.data.data;
        const padding = e.data.cellPadding * 2;
        const monospaceWidth = Math.ceil(ctx.measureText("0").width);
        const weirdFontOffset = e.data.fontSize / 16;
        const rowHeight = Math.ceil(ctx.measureText("0").actualBoundingBoxAscent * 2 + padding);
        const beatMarkers = {
          x: 0,
          w: canvas.width,
          h: rowHeight
        };
        const stepNumbersWidth = monospaceWidth * 3 + padding;
        const stepNumbers = {
          x: 0,
          y: 0,
          w: stepNumbersWidth,
          h: canvas.height
        };
        const gridVisibleRows = Math.floor(canvas.height / (rowHeight * e.data.dpr));
        let gridColumnWidths = [];
        for (let i = 0; i < e.data.size.w; i++)
          gridColumnWidths.push(e.data.columns[i] * monospaceWidth + padding);
        let gridColumnPositions = [0];
        for (let i = 1; i <= e.data.size.w; i++)
          gridColumnPositions.push(gridColumnPositions[i - 1] + gridColumnWidths[i - 1]);
        let rowPositions = [];
        for (let i = 0; i <= gridVisibleRows; i++)
          rowPositions.push(i * rowHeight);
        const grid = {
          x: stepNumbersWidth,
          y: 0,
          w: e.data.width - stepNumbersWidth,
          cols: e.data.size.w,
          colCharWidths: e.data.columns,
          colWidths: gridColumnWidths,
          colPositions: gridColumnPositions,
          rows: e.data.size.h,
          rowHeight,
          rowPositions,
          visible: {
            top: 0,
            left: 0,
            width: 0,
            height: gridVisibleRows
          }
        };
        layout = {
          width: e.data.width,
          textY: Math.ceil(rowHeight / 2 + weirdFontOffset),
          cellPadding: e.data.cellPadding,
          beatMarkers,
          stepNumbers,
          grid
        };
        move = (data2) => {
          const horizontal = data2.activeCellCoords.x != activeCellCoords.x;
          let withinVisible = false;
          if (horizontal) {
            layout.grid.visible.width = getGridVisibleWidth();
            if (data2.activeCellCoords.x < layout.grid.visible.left) {
              layout.grid.visible.left = data2.activeCellCoords.x;
            } else if (data2.activeCellCoords.x >= layout.grid.visible.left + layout.grid.visible.width) {
              layout.grid.visible.left = data2.activeCellCoords.x + 1 - layout.grid.visible.width;
            } else {
              withinVisible = true;
            }
          } else {
            if (data2.activeCellCoords.y < layout.grid.visible.top) {
              layout.grid.visible.top = data2.activeCellCoords.y;
            } else if (data2.activeCellCoords.y >= layout.grid.visible.top + layout.grid.visible.height) {
              layout.grid.visible.top = data2.activeCellCoords.y + 1 - layout.grid.visible.height;
            } else {
              withinVisible = true;
            }
          }
          if (withinVisible) {
            redrawActiveCell(activeCellCoords, data2.activeCellCoords);
            activeCellCoords = data2.activeCellCoords;
          } else {
            activeCellCoords = data2.activeCellCoords;
            drawGrid();
          }
        };
        redrawActiveCell = (oldCoords, newCoords) => {
          const newX = layout.grid.x + (layout.grid.colPositions[newCoords.x] - layout.grid.colPositions[layout.grid.visible.left]);
          const newY = layout.grid.y + layout.grid.rowPositions[newCoords.y - layout.grid.visible.top];
          const oldX = layout.grid.x + (layout.grid.colPositions[oldCoords.x] - layout.grid.colPositions[layout.grid.visible.left]);
          const oldY = layout.grid.y + layout.grid.rowPositions[oldCoords.y - layout.grid.visible.top];
          ctx.fillStyle = "yellow";
          ctx.fillRect(newX, newY, layout.grid.colWidths[newCoords.x], layout.grid.rowHeight);
          ctx.fillStyle = oldCoords.y % 4 ? "white" : "#e3e0e0";
          ctx.fillRect(oldX, oldY, layout.grid.colWidths[oldCoords.x], layout.grid.rowHeight);
          ctx.fillStyle = "blue";
          ctx.fillText(data[oldCoords.x][oldCoords.y] || "\u2025", oldX + layout.cellPadding, oldY + layout.textY);
          ctx.fillText(data[newCoords.x][newCoords.y] || "\u2025", newX + layout.cellPadding, newY + layout.textY);
        };
        drawGrid = () => {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          const lastVisibleRow = Math.min(layout.grid.visible.top + layout.grid.visible.height, layout.grid.rows - 1);
          const lastVisibleCol = layout.grid.visible.left + layout.grid.visible.width;
          ctx.fillStyle = "#e3e0e0";
          let rowIndex = 0;
          for (let row = layout.grid.visible.top; row <= lastVisibleRow; row++) {
            if (!(row % 4)) {
              ctx.fillRect(layout.beatMarkers.x, layout.grid.rowPositions[rowIndex], layout.beatMarkers.w, layout.beatMarkers.h);
            }
            rowIndex++;
          }
          ctx.fillStyle = "yellow";
          ctx.fillRect(
            layout.grid.x + (layout.grid.colPositions[activeCellCoords.x] - layout.grid.colPositions[layout.grid.visible.left]),
            layout.grid.y + layout.grid.rowPositions[activeCellCoords.y - layout.grid.visible.top],
            layout.grid.colWidths[activeCellCoords.x],
            layout.grid.rowHeight
          );
          ctx.fillStyle = "blue";
          const firstRow = layout.grid.visible.top;
          let colX = layout.grid.x;
          for (let col = layout.grid.visible.left; col <= lastVisibleCol; col++) {
            const x = colX + layout.cellPadding;
            let rowCounter = 0;
            for (let row = firstRow; row <= lastVisibleRow; row++) {
              const y = layout.grid.y + layout.grid.rowPositions[rowCounter] + layout.textY;
              ctx.fillText(data[col][row] || "\u2025", x, y);
              rowCounter++;
            }
            colX += layout.grid.colWidths[col];
          }
          ctx.fillStyle = "darkgrey";
          ctx.fillRect(layout.stepNumbers.x, layout.stepNumbers.y, layout.stepNumbers.w, layout.stepNumbers.h);
          ctx.fillStyle = "black";
          rowIndex = 0;
          for (let row = layout.grid.visible.top; row <= lastVisibleRow; row++) {
            ctx.fillText(row.toString().padStart(3, "0"), layout.cellPadding, layout.grid.rowPositions[rowIndex] + layout.textY);
            rowIndex++;
          }
        };
        getGridVisibleWidth = () => {
          let colsWidth = 0;
          let colIndex = layout.grid.visible.left;
          while (colsWidth < layout.grid.w) {
            if (colIndex == layout.grid.cols)
              break;
            colsWidth += layout.grid.colWidths[colIndex];
            colIndex++;
          }
          return colIndex - layout.grid.visible.left;
        };
        activeCellCoords = { x: 0, y: 0 };
        layout.grid.visible.width = getGridVisibleWidth();
        drawGrid();
        postMessage("done");
        break;
      }
      case "move": {
        move(e.data);
        break;
      }
      case "updateCell": {
        data[e.data.pos.x][e.data.pos.y] = e.data.value;
        const isActiveCell = e.data.pos.x == activeCellCoords.x && e.data.pos.y == activeCellCoords.y;
        const x = layout.grid.x + (layout.grid.colPositions[e.data.pos.x] - layout.grid.colPositions[layout.grid.visible.left]);
        const y = layout.grid.y + layout.grid.rowPositions[e.data.pos.y - layout.grid.visible.top];
        ctx.fillStyle = isActiveCell ? "yellow" : e.data.pos.y % 4 ? "white" : "#e3e0e0";
        ctx.fillRect(x, y, layout.grid.colWidths[e.data.pos.x], layout.grid.rowHeight);
        ctx.fillStyle = "blue";
        ctx.fillText(e.data.value, x + layout.cellPadding, y + layout.textY);
        break;
      }
    }
  });

  // src/js/grid/CanvasGrid.js
  var CanvasGrid = class extends CustomElement {
    name = "comp-canvas-grid";
    markup = (
      /*html*/
      `
    <comp-number-box></comp-number-box>
    <canvas></canvas>
  `
    );
    cssVars = {
      padding: 0,
      width: 380
    };
    css = (
      /*css*/
      `
    :host {
      border: 1px dotted;
      padding: ${this.cssVars.padding}px;
      display: flex;
      width: ${this.cssVars.width}px;
      height: 600px;
    }
    canvas {
      flex-grow: 1;
      min-width: 0;
    }
  `
    );
    modelStructure = {
      properties: {
        size: { type: "object" },
        fontSize: { type: "number" },
        cellPadding: { type: "number" },
        columns: { type: "array" },
        data: { type: "array" }
      }
    };
    modelSetters = {
      model: (value) => {
        const viewData = new Array();
        for (let col = 0; col < this.model.size.w; col++) {
          viewData.push(new Array(this.model.size.h).fill(""));
        }
        for (let cell of this.model.data) {
          viewData[cell.x][cell.y] = cell.s;
        }
        this.canvasWorker.postMessage({
          msg: "init",
          canvas: this.offscreenCanvas,
          width: this.cssVars.width,
          dpr: window.devicePixelRatio,
          fontSize: value.fontSize,
          cellPadding: value.cellPadding,
          size: this.model.size,
          columns: this.model.columns,
          data: viewData
        }, [this.offscreenCanvas]);
        this.canvasWorker.onmessage = (e) => {
        };
      }
    };
    actions = {
      "nav-up": () => {
        this.activeCellCoords.y = this.activeCellCoords.y == 0 ? this.model.size.h - 1 : this.activeCellCoords.y - 1;
        this.move();
      },
      "nav-down": () => {
        this.activeCellCoords.y = this.activeCellCoords.y == this.model.size.h - 1 ? 0 : this.activeCellCoords.y + 1;
        this.move();
      },
      "nav-left": () => {
        this.activeCellCoords.x = this.activeCellCoords.x == 0 ? this.model.size.w - 1 : this.activeCellCoords.x - 1;
        this.move();
      },
      "nav-right": () => {
        this.activeCellCoords.x = this.activeCellCoords.x == this.model.size.w - 1 ? 0 : this.activeCellCoords.x + 1;
        this.move();
      },
      "nav-up-end": () => {
        if (this.activeCellCoords.y == 0)
          return;
        this.activeCellCoords.y = 0;
        this.move();
      },
      "nav-down-end": () => {
        if (this.activeCellCoords.y == this.model.size.h)
          return;
        this.activeCellCoords.y = this.model.size.h - 1;
        this.move();
      },
      "nav-left-end": () => {
        if (this.activeCellCoords.x == 0)
          return;
        this.activeCellCoords.x = 0;
        this.move();
      },
      "nav-right-end": () => {
        if (this.activeCellCoords.x == this.model.size.w - 1)
          return;
        this.activeCellCoords.x = this.model.size.w - 1;
        this.move();
      }
    };
    modkeys = ["KeyA", "KeyS"];
    controls = {
      "ArrowUp": "nav-up",
      "ArrowDown": "nav-down",
      "ArrowLeft": "nav-left",
      "ArrowRight": "nav-right",
      "mod-KeyA ArrowUp": "nav-up-end",
      "mod-KeyA ArrowDown": "nav-down-end",
      "mod-KeyA ArrowLeft": "nav-left-end",
      "mod-KeyA ArrowRight": "nav-right-end"
    };
    controlElementSelectors = [
      "comp-number-box"
    ];
    canvas;
    activeCellCoords = { x: 0, y: 0 };
    offscreenCanvas;
    canvasWorker;
    numberBox;
    constructor() {
      super();
      super.resetMarkup();
      this.numberBox = this.element("comp-number-box");
      this.numberBox.setModel({ digits: 2, min: 0, max: 99 });
      this.numberBox.addEventListener("value", (e) => {
      });
      this.canvas = this.element("canvas");
      this.setCanvasSize();
      this.offscreenCanvas = this.canvas.transferControlToOffscreen();
      this.canvasWorker = CanvasWorker_default;
      super.useControls();
    }
    setCanvasSize() {
      const rect = this.canvas.getBoundingClientRect();
      this.canvas.width = rect.width * window.devicePixelRatio;
      this.canvas.height = rect.height * window.devicePixelRatio;
      this.canvas.style.width = `${rect.width}px`;
      this.canvas.style.height = `${rect.height}px`;
    }
    // This functionality should be moved to the CanvasWorker.
    // ...
    // The lastVisibleCol value should not be recalculated on vertical movement.
    // On horizontal movement, use the most recent lastVisibleCol value to determine whether the screen needs to be redrawn.
    // When moving within the visible region, redraw only the current and previously active cell.
    move() {
      this.canvasWorker.postMessage({ msg: "move", activeCellCoords: this.activeCellCoords });
      this.numberBox.setAttribute("value", "-1");
    }
  };

  // src/js/dev.js
  console.log(grid_exports);
})();
