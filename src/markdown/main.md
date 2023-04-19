# Soft Elixir

Soft Elixir is a browser-based sequencer.

![Soft Elixir]()

{[demo]()} // {[current features](#current-features)} // {[dev notes](#dev-notes)}

## Current features

- Tracker-style pattern sequencing
- Sampler

## Dev notes

{[todo](#todo)} // {[sequencing](#sequencing)} // {[rendering](#rendering)}

### Todo

| Area | Task | Status |
| --- | --- | --- |
| Func | Track solo controls | In development |
| Demo | Track 1 | In development |
| Demo | Track 2 | In development |
| Demo | Track 3 | Research |
| DSP | Delay | Reearch |
| DSP | Reverb | Research |
| Func | Track FX | - |
| Func | Song data schema validation | - |
| Func | Pattern play direction | - |
| UI | VU meters | - |
| UI | Number box | - |
| UI | Text box | - |
| Demo | Docs | - |
| DSP | EQ | - |
| DSP | Chorus | - |
| Func | Networking | - |

### Rendering

The demo version of Soft Elixir renders its display using DOM elements. As a web-developer, the DOM is a very intuitive way of working. It's also extremely inefficient when it comes to producing a constantly moving grid of data.

[Off-screen canvas rendering](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas) has obvious advantages. We can push expensive animation operations to a separate thread via a [web worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) in order to protect the main processing thread.

By implementing a simple `drawArea` function, we draw only what should currently be visible:

```
drawArea(top: number, bottom: number, left: number, right: number) {

  // clear canvas
  // ...

  // draw visible area
  for (let column = left; column <= right; column++) {
    for (let row = top; row <= bottom; row++) {
      // draw cell
    }
  }

}
```

To handle user navigation and input, a DOM element can be placed on top of the canvas. By locking the position of this DOM element to column width and row height, we can produce the effect of navigating the grid:

<video controls>
  <source src="/assets/canvas-1.mov" type="video/mp4">
</video>

### Sequencing