import { CustomElement } from "./index";
import { default as CanvasWorker } from "./CanvasWorker";
export class CanvasGrid extends CustomElement {
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
    this.canvasWorker = CanvasWorker;
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
}
;
