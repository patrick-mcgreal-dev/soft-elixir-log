# Soft Elixir

Soft Elixir is a browser-based sequencer.

<!-- ![Soft Elixir]() -->

{[demo]()} // {[current features](#current-features)} // {[dev notes](#dev-notes)}

## Current features

- Tracker-style pattern sequencing
- Sampler

## Dev notes

{[to do](#to-do)} // {[sequencing](#sequencing)} // {[pattern editor](#pattern-editor)} //{[rendering](#rendering)}

### To do

| Area | Task | Status |
| --- | --- | --- |
| Rel | Prototype 1 | In development |
| UI | Number box | Complete |
| UI | Text box | In development |
| Func | Track solo controls | In development |
| Demo | Track 1 | In development |
| Demo | Track 2 | In development |
| Demo | Track 3 | Research |
| DSP | Delay | Research |
| DSP | Reverb | Research |
| Func | Track FX | - |
| Func | Song data schema validation | - |
| Func | Pattern play direction | - |
| UI | VU meters | - |
| UI | Waveform display | - |
| UI | Control range selection | - |
| UI | Control interpolation | - |
| Demo | Docs | - |
| DSP | EQ | - |
| DSP | Chorus | - |
| Other | Sequencing notes | - |
| Func | Networking | - |

### Sequencing



### Pattern editor

The heart of a tracker-based sequencer is the [pattern editor](https://www.renoise.com/sites/default/files/images/screenshots/pattern-editor-300.png)—a grid of cells into which audio events can be entered.

I want Soft Elixir to have first-class keyboard navigation, so it's important that moving around in the pattern editor feels snappy and intuitive.

<div class="grid-demo">
  <div class="grid-text">
    <h3>Grid demo</h3>
    <p>Navigate using arrow keys.</p>
    <p>Enter data with number keys. Clear with [ d ].</p>
    <br />
    <h3>Modifiers</h3>
    <ul>
      <li>[ a + arrow ] :: move to the end of the grid in the specified direction</li>
      <li>[ s + arrow-up ] :: increment number by one</li>
      <li>[ s + arrow-down ] :: decrement number by one</li>
      <li>[ s + arrow-right ] :: increment number by ten</li>
      <li>[ s + arrow-left ] :: decrement number by ten</li>
    </ul>
  </div>
  <grid-numbers></grid-numbers>
</div>

The grid control is built with my [custom element class]() as a base. This utility class provides me with the following: 

- A type-safe model that allows me to inject it with attributes
- A system for implementing keyboard controls, including the ability to use modifier keys

### Rendering

The demo version of Soft Elixir renders its display using DOM elements. As a web-developer, the DOM is a very intuitive way of working. It's also extremely inefficient when it comes to producing a constantly moving grid of data.

[Off-screen canvas rendering](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas) has obvious advantages. We can push expensive animation operations to a separate thread via a [web worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) in order to protect the main processing thread.

By implementing a simple `drawArea` function, we draw only what should currently be visible:

```
drawArea(top: number, bottom: number, left: number, right: number) {

  // clear canvas
  // ...

  // draw visible area
  for (let col = left; col <= right; col++) {
    for (let row = top; row <= bottom; row++) {
      // draw cell at [col, row]
    }
  }

}
```

To handle user navigation and input, a DOM element can be placed on top of the canvas. By locking the position of this DOM element to column width and row height, we can produce the effect of navigating the grid:

<video controls>
  <source src="/assets/canvas-1.mov" type="video/mp4">
</video>