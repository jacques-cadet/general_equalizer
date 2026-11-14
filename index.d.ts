import type { ComponentPropsWithoutRef, ReactElement } from "react";

export type EqMode = 3 | 7 | 11;
export type EqRange = 6 | 12 | 18;

export interface EqBand {
  /** e.g. "7:f1000" (ids are per mode, so each mode keeps its own gains) */
  id: string;
  label: string;
  freq: number;
  type: "lowshelf" | "peaking" | "highshelf";
  /** peaking bands only */
  q?: number;
}

export interface EqPreset {
  id: string;
  name: string;
  /** dB per band, low -> high, for each mode */
  values: Record<EqMode, number[]>;
}

export interface EqUserPreset {
  id: string;
  name: string;
  mode: EqMode;
  values: number[];
}

export interface EqState {
  mode: EqMode;
  range: EqRange;
  bypass: boolean;
  /** Limiter on: boosted peaks are held under 0 dBFS instead of clipping. */
  limiter: boolean;
  bands: readonly EqBand[];
  /** gain as heard (clamped to the range), by band id, for every mode */
  gains: Readonly<Record<string, number>>;
  /** the current mode's gains, low -> high */
  values: readonly number[];
  cuts: Readonly<{ low: number; high: number }>;
  presets: readonly EqPreset[];
  userPresets: readonly EqUserPreset[];
}

export interface EqStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface EqualizerOptions {
  /** Use this context (default: one is created on the first attach / connectSource). */
  audioContext?: AudioContext | null;
  /** Where the EQ outputs (default: audioContext.destination). */
  destination?: AudioNode | null;
  /** Where settings are saved (default: localStorage; null = don't save). */
  storage?: EqStorage | null;
  /** Prefix for the saved keys (default "geq"). */
  storageKey?: string;
  defaultMode?: EqMode;
  defaultRange?: EqRange;
  /** Limiter on when nothing is saved yet. Default false. */
  defaultLimiter?: boolean;
  /** Built-in presets (default: BUILT_IN_PRESETS). */
  presets?: readonly EqPreset[];
  /** default 30 */
  maxUserPresets?: number;
}

export interface EqualizerInstance {
  /** Route a media element through the EQ. Returns a function that detaches it. */
  attach(el: HTMLMediaElement): () => void;
  /** Route any Web Audio node through the EQ. Returns a function that disconnects it. */
  connectSource(node: AudioNode): () => void;
  /** Detach one element / node, or everything when called with no argument. Detached elements play straight to the speakers. */
  detach(target?: HTMLMediaElement | AudioNode): void;
  readonly audioContext: AudioContext | null;
  readonly input: AudioNode | null;

  getState(): EqState;
  subscribe(listener: () => void): () => void;

  /** Round to 0.1 dB and clamp to the current range. */
  clampDb(value: number): number;
  setMode(mode: EqMode): void;
  setGain(bandId: string, db: number): void;
  applyValues(values: number[]): void;
  getValues(): number[];
  setRange(range: EqRange): void;
  setBypass(on: boolean): void;
  /** Limiter on / off (works with bypass too). Saved. */
  setLimiter(on: boolean): void;
  setCut(which: "low" | "high", hz: number): void;
  /** Flat bands (current mode) and both cuts off. */
  reset(): void;

  applyPreset(id: string): boolean;
  savePreset(name: string): EqUserPreset | null;
  /** Save the current values into an existing user preset of the current mode. */
  updatePreset(id: string): EqUserPreset | null;
  deletePreset(id: string): void;

  /** Detach everything, drop the filters, and close the AudioContext if the EQ created it. */
  dispose(): void;
}

export function createEqualizer(options?: EqualizerOptions): EqualizerInstance;

export const MODES: Readonly<Record<EqMode, readonly EqBand[]>>;
export const MODE_LIST: EqMode[];
export const RANGES: EqRange[];
export const MAX_RANGE: 18;
export const LIMITER: { threshold: number; knee: number; ratio: number; attack: number; release: number };
export const STEP: 0.1;
export const LOW_CUT: { min: number; max: number; off: number };
export const HIGH_CUT: { min: number; max: number; off: number };
export const BUILT_IN_PRESETS: readonly EqPreset[];

export interface EqualizerProps extends Omit<ComponentPropsWithoutRef<"div">, "title"> {
  eq: EqualizerInstance;
  /** Heading text (default "Equalizer"); "" hides it. */
  title?: string;
  /** Text behind the "?" button; false hides the button. Default: range + how-to text. */
  helpText?: string | false | ((bands: readonly EqBand[], range: EqRange) => string);
  showPresets?: boolean;
  showCuts?: boolean;
  /** 3 / 7 / 11-band switch */
  showModes?: boolean;
  /** Limiter on/off button. Default true. */
  showLimiter?: boolean;
  /** Shows a Done button that calls this. */
  onDone?: () => void;
}
export function Equalizer(props: EqualizerProps): ReactElement;

export interface EqualizerModalProps extends Omit<EqualizerProps, "onDone"> {
  /** default true */
  open?: boolean;
  /** Escape, a backdrop click and Done call this. */
  onClose?: () => void;
  /** Extra classes on the full-screen backdrop (e.g. Tailwind / Bootstrap utilities). */
  overlayClassName?: string;
  /** Extra classes on the dialog box. */
  dialogClassName?: string;
}
export function EqualizerModal(props: EqualizerModalProps): ReactElement | null;

export interface KnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  /** value treated as "off" (double-click returns here) */
  off?: number;
  onChange(value: number): void;
  offText?: string;
  format?: (value: number) => string;
}
export function Knob(props: KnobProps): ReactElement;
export function fmtHz(hz: number): string;

export function useEqualizer(eq: EqualizerInstance): EqState;
