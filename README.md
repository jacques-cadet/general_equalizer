# general_equalizer

A graphic equalizer for React apps that play audio in the browser. It runs on the Web Audio API and has:

- **3, 7 or 11 bands** (low shelf, peaking mids, 8 kHz high shelf), each with a vertical fader and a typeable dB readout
- **Low cut / high cut knobs** (12 dB/oct high-pass from 20 Hz to 1 kHz, low-pass from 1 kHz to 20 kHz)
- **Bypass**, which takes the EQ out of the sound and keeps your settings
- **Limiter** (on/off), which stops boosted peaks from distorting without changing the level of quieter passages
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
| `defaultLimiter` | `false` | limiter on when nothing is saved yet |

The instance's methods:

| method | |
|---|---|
| `attach(mediaElement)` → `detach fn` | route an `<audio>`/`<video>` through the EQ |
| `connectSource(audioNode)` → `disconnect fn` | route any Web Audio node through the EQ |
| `detach(target?)` | take one element / node out, or all of them |
| `getState()` / `subscribe(fn)` | current state + change notifications (works with `useSyncExternalStore`) |
| `setMode(3 \| 7 \| 11)` | each mode keeps its own gains |
| `setGain(bandId, dB)`, `applyValues([dB...])`, `getValues()` | band ids come from `getState().bands` |
| `setRange(6 \| 12 \| 18)`, `setBypass(bool)`, `setLimiter(bool)`, `setCut("low" \| "high", hz)` | the limiter works with bypass on too |
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
| `showLimiter` | `true` | the Limiter on/off button |
| `onDone` | | `<Equalizer>` only: shows a **Done** button (the modal wires it to `onClose`) |

`<EqualizerModal>` renders into `<body>`. It closes on Escape, on a click on the backdrop, or on Done.

Also exported: `useEqualizer(eq)` (state hook), `Knob`, `fmtHz`, and the constants `MODES`, `MODE_LIST`, `RANGES`, `LOW_CUT`, `HIGH_CUT`, `STEP`, `MAX_RANGE`, `LIMITER` and `BUILT_IN_PRESETS`. TypeScript types are included.

### Using the panel

- **Faders:** drag them, or double-click a fader to reset it to 0.
- **dB readouts:** click one to type a value (e.g. `1.3`). ↑/↓ moves 0.1 dB, Shift + ↑/↓ moves 1 dB.
- **Knobs:** drag up/down, scroll, or use the arrow keys (hold Shift for fine or bigger steps). Home/End jump to the ends, and a double-click turns the cut off.

### The limiter

Boosting a band on music that is already mastered loud pushes peaks over full scale, and those clip (distort). With
**Limiter** on, the EQ output goes through a fast limiter (a `DynamicsCompressorNode`: threshold −2 dBFS, ratio 20:1,
hard knee). Web Audio compressors add automatic make-up gain; the EQ takes that back out, so quiet passages keep exactly
the same level with the limiter on or off. Measured in Chrome with a 1 kHz tone at −0.9 dBFS boosted +18 dB: peaks at
+17.1 dBFS without the limiter, −0.8 dBFS with it.

## Use it with general_player

[general_player](https://github.com/jacques-cadet/general_player) is a React player bar (playlist, shuffle, repeat,
waveform) that shows an EQ button for a general_equalizer instance and attaches it for you:

```jsx
const eq = createEqualizer();
<Player tracks={tracks} eq={eq} />
```

## Theming

The EQ ships a plain light grey look and no fonts of its own (it uses your app's font). Every class starts with `geq-`,
and every colour is a variable. Set any of them on `:root` or on any element above the EQ:

```css
:root {
  --geq-bg: #f3f4f6;               /* panel / dialog background */
  --geq-text: #1f2937;
  --geq-muted: #6b7280;
  --geq-accent: #4b5563;           /* active buttons, fader fill, readouts, knob arc */
  --geq-accent-text: #ffffff;      /* text on an active button */
  --geq-thumb: #374151;            /* fader thumb, knob pointer */
  --geq-thumb-active: #111827;     /* ...while adjusting */
  --geq-glow: rgba(17, 24, 39, .25);
  --geq-track: #c4c8cf;            /* unlit fader / knob track */
  --geq-surface: #e5e7eb;          /* buttons, inputs */
  --geq-surface-hover: #d1d5db;
  --geq-radius: 4px;
  --geq-fader-height: 180px;
  --geq-overlay-bg: rgba(17, 24, 39, .35);
  --geq-shadow: 0 12px 40px rgba(17, 24, 39, .25);
  --geq-z: 2000;                   /* dialog stacking order */
}
```

A dark version, for example:

```css
.dark {
  --geq-bg: #1f2329; --geq-text: #e5e7eb; --geq-muted: #9ca3af; --geq-accent: #d1d5db; --geq-accent-text: #111827;
  --geq-thumb: #e5e7eb; --geq-thumb-active: #ffffff; --geq-track: #4b5563; --geq-surface: #2d333b; --geq-surface-hover: #3a414b;
  --geq-glow: rgba(255, 255, 255, .25); --geq-overlay-bg: rgba(0, 0, 0, .6);
}
```

Every rule is a single class, so a one-class rule of yours that loads after `general_equalizer/style.css` wins.
`<Equalizer>` takes `className`, and `<EqualizerModal>` takes `className` (the panel), `dialogClassName` and `overlayClassName`.

### With Bootstrap

Load `general_equalizer/style.css` after Bootstrap. To follow your Bootstrap theme, point the variables at Bootstrap's own:

```css
:root {
  --geq-accent: var(--bs-primary); --geq-accent-text: #fff;
  --geq-bg: var(--bs-body-bg); --geq-text: var(--bs-body-color); --geq-muted: var(--bs-secondary-color);
  --geq-surface: var(--bs-tertiary-bg); --geq-surface-hover: var(--bs-secondary-bg); --geq-track: var(--bs-border-color);
  --geq-radius: var(--bs-border-radius);
}
```

Bootstrap's dark mode (`data-bs-theme="dark"`) then carries over by itself. The dialog sits at `z-index: 2000`, above Bootstrap's modals (1055); change `--geq-z` if you open it from inside one.

### With Tailwind CSS

**Tailwind v4:** import the stylesheet into Tailwind's `components` layer, so your utility classes win over it:

```css
@import "tailwindcss";
@import "general_equalizer/style.css" layer(components);

:root { --geq-accent: var(--color-indigo-600); --geq-bg: var(--color-white); }
```

**Tailwind v3:** import `general_equalizer/style.css` in your JS before your own CSS.

Then add utilities through the class props, or set variables with arbitrary properties:

```jsx
<EqualizerModal eq={eq} open={open} onClose={close}
  dialogClassName="rounded-2xl shadow-xl" className="[--geq-accent:theme(colors.emerald.600)]" />
```

Tailwind's preflight reset doesn't affect the EQ: its single-class rules out-rank preflight's element rules.

## Development

```sh
npm install
npm run dev     # demo page: pick a local audio file and try the EQ (and the themes)
npm test        # engine tests (vitest)
npm run build   # dist/ (ESM, CJS, style.css); dist/ is committed so installs from GitHub work without a build
```

## License

MIT
