function createWorker(fn) {
  const blob = new Blob(["self.onmessage = ", fn.toString()], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  return new Worker(url);
}
let canvas, ctx;
let data;
let layout;
let activeCellCoords;
let move;
let redrawActiveCell;
let drawGrid;
let getGridVisibleWidth;
export default createWorker((e) => {
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
