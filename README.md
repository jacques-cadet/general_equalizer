# general_equalizer

A graphic equalizer for React apps that play audio in the browser. It runs on the Web Audio API and has:

- **3, 7 or 11 bands** (low shelf, peaking mids, 8 kHz high shelf), each with a vertical fader and a typeable dB readout
- **Low cut / high cut knobs** (12 dB/oct high-pass from 20 Hz to 1 kHz, low-pass from 1 kHz to 20 kHz)
- **Bypass**, which takes the EQ out of the sound and keeps your settings
- **±6 / ±12 / ±18 dB range**, in 0.1 dB steps. Narrowing the range and widening it again brings the old settings back.
- **Presets**: six built-ins, plus presets your users save, update and delete themselves
- **Saved settings** (localStorage by default, or your own storage)
- Keyboard and screen-reader support, a layout that fits phones, and theming through CSS variables

Its only dependencies are `react` and `react-dom` (18 or newer), as peer dependencies.

## Install

```sh
npm install github:jacques-cadet/general_equalizer
```

## Quick start

```jsx
import { useEffect, useRef, useState } from "react";
import { createEqualizer, EqualizerModal } from "general_equalizer";
import "general_equalizer/style.css";

// One instance for the app. Create it outside components, so re-renders and React StrictMode don't make a second one.
const eq = createEqualizer();

export default function Player({ src }) {
  const audio = useRef(null);
  const [open, setOpen] = useState(false);
  useEffect(() => eq.attach(audio.current), []);   // attach returns its own cleanup

  return (
    <>
      <audio ref={audio} src={src} controls crossOrigin="anonymous" />
      <button onClick={() => setOpen(true)}>EQ</button>
      <EqualizerModal eq={eq} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
```

If you'd rather put the panel in your own layout (a sidebar, a settings page) than in a dialog, use `<Equalizer eq={eq} />`.

### With WaveSurfer, Howler (HTML5 mode) or any player that has a media element

```js
const ws = WaveSurfer.create({ container, url });
const detach = eq.attach(ws.getMediaElement());
// later: detach(); ws.destroy();
```

### With your own Web Audio graph

```js
const ctx = new AudioContext();
const eq = createEqualizer({ audioContext: ctx, destination: myMasterGain });
eq.connectSource(myBufferSourceOrAnyNode);
```

## Browser notes

- **Cross-origin audio needs CORS.** If the audio file comes from another domain, that server must send `Access-Control-Allow-Origin`, and the `<audio>` element needs `crossOrigin="anonymous"`. Without both, the browser plays **silence** through the Web Audio API. Files from your own domain, and blob/object URLs, are fine.
- **Autoplay rules.** Browsers start an AudioContext suspended. The EQ resumes it when the attached element starts playing, which normally follows a click.
- **One source per element.** A media element can only ever be connected to one AudioContext. The EQ caches that connection, so attaching, detaching and re-attaching the same element is safe. Don't call `dispose()` and then attach the same element to a *new* EQ that creates its own context: pass a shared `audioContext` instead.
- After `detach()`, the element keeps playing directly to the speakers.

## API

### `createEqualizer(options?)`

| option | default | |
|---|---|---|
| `audioContext` | created on the first `attach` | use your own AudioContext |
| `destination` | `audioContext.destination` | where the EQ outputs |
| `storage` | `localStorage` | any `{ getItem, setItem }`; `null` saves nothing |
| `storageKey` | `"geq"` | prefix for the saved keys (`geq:mode`, `geq:gains`, ...); use different keys for several EQs |
| `defaultMode` | `3` | `3`, `7` or `11` bands |
| `defaultRange` | `12` | `6`, `12` or `18` dB |
| `presets` | `BUILT_IN_PRESETS` | built-in presets: `{ id, name, values: { 3: [...], 7: [...], 11: [...] } }` |
| `maxUserPresets` | `30` | |

The instance's methods:

| method | |
|---|---|
| `attach(mediaElement)` → `detach fn` | route an `<audio>`/`<video>` through the EQ |
| `connectSource(audioNode)` → `disconnect fn` | route any Web Audio node through the EQ |
| `detach(target?)` | take one element / node out, or all of them |
| `getState()` / `subscribe(fn)` | current state + change notifications (works with `useSyncExternalStore`) |
| `setMode(3 \| 7 \| 11)` | each mode keeps its own gains |
| `setGain(bandId, dB)`, `applyValues([dB...])`, `getValues()` | band ids come from `getState().bands` |
| `setRange(6 \| 12 \| 18)`, `setBypass(bool)`, `setCut("low" \| "high", hz)` | |
| `reset()` | flat bands + both cuts off |
| `applyPreset(id)`, `savePreset(name)`, `updatePreset(id)`, `deletePreset(id)` | `updatePreset` saves the current values into an existing user preset |
| `dispose()` | disconnect everything (closes the AudioContext if the EQ created it) |

### `<Equalizer eq />` and `<EqualizerModal eq open onClose />`

| prop | default | |
|---|---|---|
| `eq` | required | the instance |
| `title` | `"Equalizer"` | `""` hides it |
| `helpText` | how-to text | the text behind the **?** button; a string, a `(bands, range) => string` function, or `false` to hide the button |
| `showModes` | `true` | the 3 / 7 / 11-band switch |
| `showPresets` | `true` | the preset picker and the save field |
| `showCuts` | `true` | the low / high cut knobs |
| `onDone` | | `<Equalizer>` only: shows a **Done** button (the modal wires it to `onClose`) |

`<EqualizerModal>` renders into `<body>`. It closes on Escape, on a click on the backdrop, or on Done.

Also exported: `useEqualizer(eq)` (state hook), `Knob`, `fmtHz`, and the constants `MODES`, `MODE_LIST`, `RANGES`, `LOW_CUT`, `HIGH_CUT`, `STEP`, `MAX_RANGE` and `BUILT_IN_PRESETS`. TypeScript types are included.

### Using the panel

- **Faders:** drag them, or double-click a fader to reset it to 0.
- **dB readouts:** click one to type a value (e.g. `1.3`). ↑/↓ moves 0.1 dB, Shift + ↑/↓ moves 1 dB.
- **Knobs:** drag up/down, scroll, or use the arrow keys (hold Shift for fine or bigger steps). Home/End jump to the ends, and a double-click turns the cut off.

## Theming

Every class starts with `geq-`. Fonts are inherited from your app. To change the colours, set any of these variables on `:root` or on any element above the EQ:

```css
:root {
  --geq-bg: #14161b;            /* dialog background */
  --geq-text: #e8eaee;
  --geq-muted: rgba(232, 234, 238, .6);
  --geq-accent: #5ab0ff;        /* active buttons, fader fill, readouts, knob arc */
  --geq-accent-text: #0b1118;   /* text on an active button */
  --geq-thumb: #e8eaee;         /* fader thumb, knob pointer */
  --geq-thumb-active: #ffffff;  /* ...while adjusting */
  --geq-glow: rgba(90, 176, 255, .55);
  --geq-track: rgba(255, 255, 255, .18);
  --geq-surface: rgba(255, 255, 255, .06);        /* buttons, inputs */
  --geq-surface-hover: rgba(255, 255, 255, .12);
  --geq-radius: 4px;
  --geq-fader-height: 180px;
  --geq-overlay-bg: rgba(0, 0, 0, .7);
}
```

## Development

```sh
npm install
npm run dev     # demo page: pick a local audio file and try the EQ (and the themes)
npm test        # engine tests (vitest)
npm run build   # dist/ (ESM, CJS, style.css); dist/ is committed so installs from GitHub work without a build
```

## License

MIT
