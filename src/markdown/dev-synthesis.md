## ~ Synthesis ~

<p>
  <nav class="vertical">
    <div>~ <a href="#introduction">Introduction</a></div>
    <div>~ <a href="#hello-world">Hello, world</a></div>
    <div>~ <a href="#arguments">Arguments</a></div>
    <div>~ <a href="#utility-functions">Utility functions</a></div>
    <div>~ <a href="#argument-defaults">Argument defaults</a></div>
  </nav>
</p>

### Introduction

The backend of *Soft Elixir* consists of two components:

1. A scheduling system
2. A synthesis function signature

The first component takes care of scheduling audio events to be played back at some specified future time, whilst the second takes care of the audio events themselves.

In order to write synthesis functions compatible with *Soft Elixir*, we need to understand the second component.

The synthesis function signature that *Soft Elixir* exposes is called *EventFunc*, and it looks like this:

```
export type EventFunc = (

  ac: AudioContext, 
  eventStartTime: number, 
  eventEndTime: number, 
  args: {}

) => AudioNode;
```

Any synthesis functions exposed by the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) are usable within an *EventFunc* function. The only requirement is that it returns a single object of type *AudioNode*.

### Hello, world

Let's write a very simple synthesis function which will produce a short sine wave at a specific frequency.

Here's a function variable that implements the *EventFunc* signature:

```
const SineSynthFn: EventFunc = (
  ac: AudioContext, eventStartTime: number, eventEndTime: number, args: {}) => {

  const oscNode = ac.createOscillator();
  oscNode.frequency.value = 440;
  oscNode.start(eventStartTime);
  oscNode.stop(eventStartTime + 0.05);

  return oscNode;

}
```

*SineSynthFn* uses the supplied *AudioContext* argument to create an [OscillatorNode](https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode).

The *eventStartTime* argument is used to set the start and stop time of the oscillator.

Finally, the oscillator node is returned.

### Arguments

A synth function that only produces a 440Hz tone isn't very useful, so let's tell it to expect some frequency data from *Soft Elixir*.

```
interface SineSynthArgs {
  freq: number
}

const SineSynthFn: EventFunc = (
  ac: AudioContext, eventStartTime: number, eventEndTime: number, args: SineSynthArgs) => {

  const oscNode = ac.createOscillator();
  oscNode.frequency.value = args.freq;
  oscNode.start(eventStartTime);
  oscNode.stop(eventStartTime + 0.05);
  
  return oscNode;

}
```

In the snippet above, we've replaced the generic object expected by *SineSynthFn* with the type *SineSynthArgs*. We can pass any useful data from *Soft Elixir* to our synthesis function using this object type.

### Utility functions

Right now, we're only passing a *frequency* variable. Let's add some gain and panning variables:

```
interface SynthArgs {
  gain: number,
  pan: number,
}

interface SineSynthArgs extends SynthArgs {
  freq: number
}

const SineSynthFn: EventFunc = (
  ac: AudioContext, eventStartTime: number, eventEndTime: number, args: SineSynthArgs) => {

  const oscNode = ac.createOscillator();
  oscNode.frequency.value = args.freq;
  oscNode.start(eventStartTime);
  oscNode.stop(eventStartTime + 0.05);

  let lastNode: AudioNode = applyGain(ac, oscNode, args.gain);
  if (args.pan != 0) lastNode = applyPan(ac, lastNode, args.pan);

  return lastNode;

}
```

We've made use of the existing *SynthArgs* type to add *gain* and *pan* variables to our *SineSynthArgs* type. Since we often want control over gain and panning, this is a really useful base type for any synthesis function.

Additionally, we've used two existing utility functions (*applyGain* and *applyPan*) to manage our gain and pan. We're also making sure to return the last node in the chain from *SineSynthFn*. If, as before, we returned the oscillator node, neither gain nor panning would be audible.

Here's what the *applyGain* and *applyPan* utility functions look like:

```
function applyGain(ac: AudioContext, node: AudioNode, gain: number) : GainNode {

  const gainNode = ac.createGain();
  gainNode.gain.value = gain;
  node.connect(gainNode);

  return gainNode;

}
```

```
function applyPan(ac: AudioContext, node: AudioNode, pan: number) : StereoPannerNode {

  const panNode = ac.createStereoPanner();
  panNode.pan.value = pan;
  node.connect(panNode);

  return panNode;
  
}
```

### Argument defaults

When we're using *Soft Elixir* to sequence our function, it might be that we don't want to supply every possible argument with each musical event.

As a final step, let's generate some default arguments that will be used in such a case:

```
const SineSynthArgs_default: SineSynthArgs = {
  gain: 0.5,
  pan: 0,
  freq: 440
}
```

The default argument object is named with the following convention: ```<ArgsObjectName>_default```.

In the case that a particular argument isn't sent from *Soft Elixir* to the synthesis function, the values in this object will be used as default.