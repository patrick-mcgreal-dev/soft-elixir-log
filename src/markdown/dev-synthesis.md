## ~ Synthesis ~

<p>
  <nav class="vertical">
    <div>~ <a href="#introduction">Introduction</a></div>
    <div>~ <a href="#hello-world">Hello, world</a></div>
  </nav>
</p>

### Introduction

The backend of *Soft Elixir* consists of two components:

1. A scheduling system
2. A synthesis function signature

The first system takes care of scheduling audio events to be played back at some specified future time, whilst the second system takes care of the audio events themselves.

In order to write synthesis functions compatible with *Soft Elixir*, we need to understand the second system.

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

```
interface TestSynthArgs extends SynthArgs {
  freq: number
}
```

```
const TestSynthArgs_default: TestSynthArgs = {
  gain: 0.5,
  pan: 0,
  freq: 440
}
```

```
const TestSynthFn: EventFunc = (
  ac: AudioContext, eventStartTime: number, eventEndTime: number, args: TestSynthArgs) => {

  const oscNode = ac.createOscillator();
  oscNode.frequency.value = args.freq;
  oscNode.start(eventStartTime);
  oscNode.stop(eventStartTime + 0.05);

  let lastNode: AudioNode = applyGain(ac, oscNode, args.gain);
  if (args.pan != 0) lastNode = applyPan(ac, lastNode, args.pan);

  return lastNode;

}
```