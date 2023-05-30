<nav class="vertical">
  <div>{<a href="#rendering">rendering</a>}</div>
  <div>{<a href="#synthesis">synthesis</a>}</div>
</nav>

## Rendering

The pattern editor is the heart of a tracker-like sequencer. Entering notes, automating digital effects, sequencing patterns... 99% of the work that goes into composing a track happens inside this one component.

![Soft Elixir](/assets/soft-elixir-2.png)

As well as handling a lot of data, it must also be snappy and responsive at rates of over 200 BPM. This is not a good fit for DOM-based rendering.

[Off-screen canvas rendering](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas) has obvious advantages. Expensive animation operations can be pushed to a separate rendering thread with a [web worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) in order to protect the main thread.

The main obstacle to overcome is communication between these two threads, which should be as lightweight as possible.

Each time the pattern editor needs to be updated, the rendering thread should draw the currently visible block of data to the canvas. What's the most efficient way of providing access to this data?

**Solution 1: serialising objects**

The simplest solution for sending data to the rendering thread is the [postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage) method.

Using this method, we can send any data we like from the main thread to the rendering thread, so long as it's supported by the [structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm).

However, this is also the slowest solution. A lot of computation time is wasted serialising objects on the main thread and deserialising them on the rendering thread with each update.

**Solution 2: transferring memory access**

Instead of serialising objects, why not just transfer ownership entirely from the main thread to the rendering thread?

The postMessage method allows us to specify which of the objects it's been handed are *transferable*, meaning that ownership of their allocated memory should be transferred between threads.

As such, data objects aren't serialised or copied as in the previous solution. The only thing sent with the call to postMessage is a reference to a location in memory. However, as part of the transferring process, we also lose access to the objects in the main thread. We can no-longer access or write to the transferred blocks of memory.

Just as with the previous solution, only certain items are supported by the *transferable* protocol. Additional mental overhead is incurred with the need to convert data to and from an [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) to satisfy these requirements.

**Solution 3: sharing memory**

With [SharedArrayBuffers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer), we can give both threads read/write access to the same block of memory. However, the data type limitations of the previous solution still apply.

Additionally, the problem of avoiding [race conditions](https://en.wikipedia.org/wiki/Race_condition) needs to be navigated.

**Solution 4: keep it simple, stupid**

If the main thread doesn't need access to the rendering data, why not just pass it to the rendering thread on initialisation?

Yes, the data will be serialised and deserialised if we use the postMessage method, but it will only happen once on creating the rendering thread. So long as the main thread has no use for the data, the allocated memory will be freed up by the garbage collector which means no wasted resources.

```
// CanvasWorker.js

let renderingData;

function createWorker(fn) {

  const blob = new Blob(["self.onmessage = ", fn.toString()], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  
  return new Worker(url);

}

export default createWorker((e) => {
  
  switch (e.data.msg) {

    case "init": {

      renderingData = e.data.renderingData;

    },

    case "render": {

      // use the renderingData variable here...

    },

  }

}
```

In the above snippet, we're generating an inline Web Worker. This is nice, because we don't need to serve a separate JavaScript file just containing our worker code. It also means that we can use module imports to include it in the file containing the rest of the code for our pattern component.

On initialisation, we assign the rendering data to a variable scoped to the context of the Web Worker. This means that we have access to it from the rendering portion of the code.

```
// PatternComponent.js

import { default as CanvasWorker } from "./CanvasWorker";

let activeCellX = 0;
let activeCellY = 0;

function init(data) {

  let renderingData = data;
  
  // extract data relevant for rendering
  // ...

  CanvasWorker.postMessage({ 
    msg: "init",
    renderingData: renderingData
  });

}

function navigate() {

  // update activeCellX and activeCellY
  // ...

  CanvasWorker.postMessage({
    msg: "render",
    activeCellX: activeCellX,
    activeCellY: activeCellY,
  });

}
```

Now, we only need to pass the location of the user's cursor from the pattern component to the Web Worker when navigating around our pattern.

**Conclusion**

There are a myriad of ways to communicate between worker threads in the browser.

If both threads need read/write access to the same data, consider sharing memory with a SharedArrayBuffer.

Otherwise, keep it simple.

## Synthesis