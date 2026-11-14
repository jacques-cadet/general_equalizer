import { useEffect as e, useId as t, useRef as n, useState as r, useSyncExternalStore as i } from "react";
import { Fragment as a, jsx as o, jsxs as s } from "react/jsx-runtime";
import { createPortal as c } from "react-dom";
// src/engine.js
var l = [
	6,
	12,
	18
], u = 18, d = .1, f = {
	min: 20,
	max: 1e3,
	off: 20
}, p = {
	min: 1e3,
	max: 2e4,
	off: 2e4
}, m = 20 * Math.log10(Math.SQRT1_2), h = {
	threshold: -2,
	knee: 0,
	ratio: 20,
	attack: .002,
	release: .15
}, g = -.6 * -h.threshold * (1 - 1 / h.ratio), _ = (e, t) => Math.round(Math.max(-t, Math.min(t, Number(e) || 0)) * 10) / 10, v = (e, { min: t, max: n }) => Math.round(Math.max(t, Math.min(n, Number(e) || 0))), y = (e) => +(1 / (2 * Math.sinh(Math.LN2 / 2 * e))).toFixed(2), b = (e) => e >= 1e3 ? `${e / 1e3}k` : `${e}`;
function x(e, t) {
	let n = t.map((e, n) => n === 0 ? 0 : Math.log2(e / t[n - 1]));
	return t.map((r, i) => {
		let a = {
			id: `${e}:f${r}`,
			label: b(r),
			freq: r
		};
		return i === 0 ? {
			...a,
			type: "lowshelf"
		} : i === t.length - 1 ? {
			...a,
			type: "highshelf"
		} : {
			...a,
			type: "peaking",
			q: y((n[i] + n[i + 1]) / 2)
		};
	});
}
var S = Object.freeze({
	3: x(3, [
		120,
		1e3,
		8e3
	]),
	7: x(7, [
		64,
		160,
		400,
		1e3,
		2e3,
		4e3,
		8e3
	]),
	11: x(11, [
		32,
		63,
		125,
		250,
		500,
		1e3,
		1500,
		2300,
		3500,
		5300,
		8e3
	])
}), C = [
	3,
	7,
	11
], w = C.flatMap((e) => S[e]).map((e) => e.id), T = Object.freeze([
	{
		id: "b-flat",
		name: "Flat",
		values: {
			3: [
				0,
				0,
				0
			],
			7: [
				0,
				0,
				0,
				0,
				0,
				0,
				0
			],
			11: [
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0
			]
		}
	},
	{
		id: "b-bass",
		name: "Bass boost",
		values: {
			3: [
				8,
				0,
				-1
			],
			7: [
				8,
				6,
				3,
				0,
				0,
				0,
				0
			],
			11: [
				8,
				7,
				5.5,
				3.5,
				1.5,
				0,
				0,
				0,
				0,
				0,
				-.5
			]
		}
	},
	{
		id: "b-vocal",
		name: "Vocal / presence",
		values: {
			3: [
				-2,
				4,
				2
			],
			7: [
				-3,
				-2,
				0,
				3,
				4,
				3,
				1
			],
			11: [
				-3,
				-3,
				-2,
				-1,
				.5,
				2.5,
				3.5,
				3.5,
				3,
				2,
				1
			]
		}
	},
	{
		id: "b-bright",
		name: "Bright",
		values: {
			3: [
				-1,
				0,
				7
			],
			7: [
				-1,
				0,
				0,
				0,
				2,
				5,
				7
			],
			11: [
				-1,
				-1,
				-.5,
				0,
				0,
				0,
				1.5,
				3,
				4.5,
				6,
				7
			]
		}
	},
	{
		id: "b-loud",
		name: "Loudness",
		values: {
			3: [
				6,
				-2,
				5
			],
			7: [
				7,
				4,
				0,
				-2,
				-1,
				3,
				6
			],
			11: [
				7,
				6,
				4,
				1.5,
				-1,
				-2,
				-1.5,
				.5,
				3,
				4.5,
				6
			]
		}
	},
	{
		id: "b-warm",
		name: "Warm",
		values: {
			3: [
				3,
				1,
				-4
			],
			7: [
				4,
				3,
				2,
				0,
				-1,
				-3,
				-5
			],
			11: [
				4,
				4,
				3,
				2.5,
				1.5,
				0,
				-1,
				-2,
				-3,
				-4,
				-5
			]
		}
	}
]), E = /* @__PURE__ */ new WeakMap();
function D(e, t) {
	let n = E.get(e);
	n || E.set(e, n = /* @__PURE__ */ new WeakMap());
	let r = n.get(t);
	return r || n.set(t, r = e.createMediaElementSource(t)), r;
}
function O() {
	try {
		return typeof window < "u" && window.localStorage ? window.localStorage : null;
	} catch {
		return null;
	}
}
function k(e = {}) {
	let { audioContext: t = null, destination: n = null, storageKey: r = "geq", defaultMode: i = 3, defaultRange: a = 12, presets: o = T, maxUserPresets: s = 30, defaultLimiter: c = !1 } = e, u = e.storage === void 0 ? O() : e.storage, d = (e) => `${r}:${e}`, y = (e) => {
		try {
			return JSON.parse(u?.getItem(d(e)) ?? "null");
		} catch {
			return null;
		}
	}, b = (e, t) => {
		try {
			u?.setItem(d(e), JSON.stringify(t));
		} catch {}
	}, x = (e) => C.includes(e) ? e : C.includes(i) ? i : 3, E = (e) => l.includes(e) ? e : l.includes(a) ? a : 12, k = (e) => e && typeof e.name == "string" && C.includes(e.mode) && Array.isArray(e.values), A = x(y("mode")), j = E(y("range")), M = y("bypass") === !0, N = typeof y("limiter") == "boolean" ? y("limiter") : !!c, P = y("cuts") || {}, F = {
		low: v(P.low ?? f.off, f),
		high: v(P.high ?? p.off, p)
	}, I = y("gains") || {}, L = Object.fromEntries(w.map((e) => [e, Number.isFinite(I[e]) ? _(I[e], 18) : 0])), R = (Array.isArray(y("presets")) ? y("presets") : []).filter(k), z = (e) => _(e, j), B = (e) => _(L[e], j), V = /* @__PURE__ */ new Set(), H = null, U = () => {
		H = null, V.forEach((e) => {
			try {
				e();
			} catch (e) {
				console.error(e);
			}
		});
	}, W = t, G = !1, K = null, q = null, J = null, Y = null, X = null, Z = null, Q = /* @__PURE__ */ new Map(), ee = () => n || W.destination, te = () => N && X ? X : ee();
	function ne() {
		if (!K) return;
		try {
			K.disconnect();
		} catch {}
		K.connect(M ? te() : q);
		let e = Y?.[Y.length - 1];
		if (e) {
			try {
				e.disconnect();
			} catch {}
			e.connect(te());
		}
	}
	function re() {
		[
			q,
			J,
			...Y || []
		].forEach((e) => {
			try {
				e?.disconnect();
			} catch {}
		}), q = W.createBiquadFilter(), q.type = "highpass", q.frequency.value = F.low, q.Q.value = m, J = W.createBiquadFilter(), J.type = "lowpass", J.frequency.value = F.high, J.Q.value = m, Y = S[A].map((e) => {
			let t = W.createBiquadFilter();
			return t.type = e.type, t.frequency.value = e.freq, t.gain.value = B(e.id), e.q && (t.Q.value = e.q), t;
		}), [
			q,
			J,
			...Y
		].reduce((e, t) => (e.connect(t), t)), ne();
	}
	function ie() {
		if (K) return W;
		if (!W) {
			let e = typeof window < "u" && (window.AudioContext || window.webkitAudioContext);
			if (!e) throw Error("general_equalizer: Web Audio API is not available");
			W = new e(), G = !0;
		}
		if (K = W.createGain(), W.createDynamicsCompressor) {
			X = W.createDynamicsCompressor();
			for (let [e, t] of Object.entries(h)) X[e].value = t;
			Z = W.createGain(), Z.gain.value = 10 ** (g / 20), X.connect(Z).connect(ee());
		}
		return re(), W;
	}
	let ae = () => {
		W && W.state === "suspended" && W.resume().catch(() => {});
	}, $ = {
		attach(e) {
			ie();
			let t = D(W, e);
			if (Q.has(t)) return () => $.detach(e);
			try {
				t.disconnect();
			} catch {}
			t.connect(K);
			let n = ae;
			return e.addEventListener("play", n), Q.set(t, {
				el: e,
				onPlay: n
			}), e.paused || ae(), () => $.detach(e);
		},
		connectSource(e) {
			return ie(), Q.has(e) || (e.connect(K), Q.set(e, {})), () => $.detach(e);
		},
		detach(e) {
			for (let [t, n] of [...Q]) if (e === void 0 || e === t || e === n.el) {
				try {
					t.disconnect(K);
				} catch {}
				if (n.el) {
					n.el.removeEventListener("play", n.onPlay);
					try {
						t.connect(W.destination);
					} catch {}
				}
				Q.delete(t);
			}
		},
		get audioContext() {
			return W;
		},
		get input() {
			return K;
		},
		getState() {
			return H ||= Object.freeze({
				mode: A,
				range: j,
				bypass: M,
				limiter: N,
				bands: S[A],
				gains: Object.freeze(Object.fromEntries(w.map((e) => [e, B(e)]))),
				values: Object.freeze(S[A].map((e) => B(e.id))),
				cuts: Object.freeze({ ...F }),
				presets: o,
				userPresets: Object.freeze(R.slice())
			}), H;
		},
		subscribe(e) {
			return V.add(e), () => V.delete(e);
		},
		clampDb: z,
		setMode(e) {
			let t = x(e);
			t !== A && (A = t, b("mode", A), K && re(), U());
		},
		setGain(e, t) {
			if (!(e in L)) return;
			L = {
				...L,
				[e]: z(t)
			};
			let n = S[A].findIndex((t) => t.id === e);
			Y && n >= 0 && (Y[n].gain.value = B(e)), b("gains", L), U();
		},
		applyValues(e) {
			S[A].forEach((t, n) => {
				L = {
					...L,
					[t.id]: z(e?.[n])
				}, Y && (Y[n].gain.value = B(t.id));
			}), b("gains", L), U();
		},
		getValues: () => S[A].map((e) => B(e.id)),
		setRange(e) {
			l.includes(e) && e !== j && (j = e, b("range", j), Y && S[A].forEach((e, t) => {
				Y[t].gain.value = B(e.id);
			}), U());
		},
		setBypass(e) {
			M = !!e, b("bypass", M), ne(), U();
		},
		setLimiter(e) {
			N = !!e, b("limiter", N), ne(), U();
		},
		setCut(e, t) {
			if (e !== "low" && e !== "high") return;
			let n = e === "low" ? f : p;
			F = {
				...F,
				[e]: v(t, n)
			}, b("cuts", F);
			let r = e === "low" ? q : J;
			r && r.frequency.setTargetAtTime(F[e], W.currentTime, .015), U();
		},
		reset() {
			$.applyValues(S[A].map(() => 0)), $.setCut("low", f.off), $.setCut("high", p.off);
		},
		applyPreset(e) {
			let t = o.find((t) => t.id === e), n = R.find((t) => t.id === e), r = t ? t.values[A] : n && n.mode === A ? n.values : null;
			return r && $.applyValues(r), !!r;
		},
		savePreset(e) {
			let t = String(e ?? "").trim().slice(0, 30);
			if (!t) return null;
			let n = {
				id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
				name: t,
				mode: A,
				values: $.getValues()
			};
			return R = [...R.filter((e) => e.mode !== A || e.name.toLowerCase() !== t.toLowerCase()), n].slice(-s), b("presets", R), U(), n;
		},
		updatePreset(e) {
			let t = R.find((t) => t.id === e);
			if (!t || t.mode !== A) return null;
			let n = {
				...t,
				values: $.getValues()
			};
			return R = R.map((t) => t.id === e ? n : t), b("presets", R), U(), n;
		},
		deletePreset(e) {
			R = R.filter((t) => t.id !== e), b("presets", R), U();
		},
		dispose() {
			$.detach(), [
				K,
				q,
				J,
				X,
				Z,
				...Y || []
			].forEach((e) => {
				try {
					e?.disconnect();
				} catch {}
			}), K = q = J = Y = X = Z = null, G &&= (W.close?.().catch(() => {}), W = null, !1);
		}
	};
	return $;
}
// src/react/Knob.jsx
var A = 270, j = 22, M = 28, N = (e, t = j) => {
	let n = (-135 + e * A - 90) * (Math.PI / 180);
	return [M + t * Math.cos(n), M + t * Math.sin(n)];
}, P = (e, t) => {
	if (t - e < .002) return "";
	let [n, r] = N(e), [i, a] = N(t);
	return `M ${n} ${r} A ${j} ${j} 0 ${+((t - e) * A > 180)} 1 ${i} ${a}`;
}, F = (e) => e < 1e3 ? `${Math.round(e)} Hz` : `${(e / 1e3).toFixed(+(e < 1e4))}k`;
function I({ label: t, value: r, min: i, max: a, off: c, onChange: l, offText: u = "Off", format: d = F }) {
	let f = n(null), p = n(null), m = (e) => Math.log(e / i) / Math.log(a / i), h = (e) => i * (a / i) ** +Math.max(0, Math.min(1, e)), g = m(r), _ = m(c ?? i), v = (e) => l(h(m(r) + e));
	e(() => {
		let e = f.current, t = (e) => {
			e.preventDefault(), v((e.deltaY < 0 ? 1 : -1) * (e.shiftKey ? .005 : .02));
		};
		return e.addEventListener("wheel", t, { passive: !1 }), () => e.removeEventListener("wheel", t);
	});
	let y = (e) => {
		e.currentTarget.setPointerCapture?.(e.pointerId), p.current = {
			y: e.clientY,
			t: g
		};
	}, b = (e) => {
		if (!p.current) return;
		let t = (p.current.y - e.clientY) / (e.shiftKey ? 720 : 180);
		l(h(p.current.t + t));
	}, x = () => {
		p.current = null;
	}, S = (e) => {
		let t = e.shiftKey ? .05 : .01, n = {
			ArrowUp: t,
			ArrowRight: t,
			ArrowDown: -t,
			ArrowLeft: -t,
			PageUp: .1,
			PageDown: -.1
		};
		e.key in n ? (e.preventDefault(), v(n[e.key])) : e.key === "Home" ? (e.preventDefault(), l(i)) : e.key === "End" && (e.preventDefault(), l(a));
	}, C = c != null && Math.abs(r - c) < .5, w = C ? u : d(r), [T, E] = N(g, 13), [D, O] = N(g, 21);
	return /* @__PURE__ */ s("div", {
		className: `geq-knob${C ? "" : " is-on"}`,
		children: [
			/* @__PURE__ */ o("div", {
				ref: f,
				className: "geq-knob-dial",
				role: "slider",
				tabIndex: 0,
				"aria-label": t,
				"aria-valuemin": i,
				"aria-valuemax": a,
				"aria-valuenow": Math.round(r),
				"aria-valuetext": w,
				onPointerDown: y,
				onPointerMove: b,
				onPointerUp: x,
				onPointerCancel: x,
				onKeyDown: S,
				onDoubleClick: () => c != null && l(c),
				title: `${t}: drag, scroll or use the arrow keys${c == null ? "" : "; double-click = off"}`,
				children: /* @__PURE__ */ s("svg", {
					viewBox: "0 0 56 56",
					width: "56",
					height: "56",
					"aria-hidden": "true",
					children: [
						/* @__PURE__ */ o("circle", {
							cx: M,
							cy: M,
							r: 17,
							className: "geq-knob-cap"
						}),
						/* @__PURE__ */ o("path", {
							d: P(0, 1),
							className: "geq-knob-track"
						}),
						/* @__PURE__ */ o("path", {
							d: _ <= g ? P(_, g) : P(g, _),
							className: "geq-knob-value"
						}),
						/* @__PURE__ */ o("line", {
							x1: T,
							y1: E,
							x2: D,
							y2: O,
							className: "geq-knob-pointer"
						})
					]
				})
			}),
			/* @__PURE__ */ o("span", {
				className: "geq-knob-label",
				children: t
			}),
			/* @__PURE__ */ o("span", {
				className: "geq-knob-text",
				children: w
			})
		]
	});
}
// src/react/useEqualizer.js
function L(e) {
	return i(e.subscribe, e.getState, e.getState);
}
// src/react/Equalizer.jsx
var R = (e) => `${e > 0 ? "+" : ""}${e.toFixed(1)}`;
function z({ value: e, label: t, clampDb: n, onChange: i }) {
	let [a, s] = r(null), c = () => {
		if (a !== null) {
			let e = parseFloat(a.replace(",", "."));
			Number.isFinite(e) && i(n(e)), s(null);
		}
	};
	return /* @__PURE__ */ o("input", {
		className: "geq-db",
		type: "text",
		inputMode: "decimal",
		"aria-label": `${t} Hz gain in dB`,
		value: a ?? R(e),
		onChange: (e) => s(e.target.value),
		onFocus: (e) => e.target.select(),
		onBlur: c,
		onKeyDown: (t) => {
			if (t.key === "Enter") c(), t.currentTarget.blur();
			else if (t.key === "Escape") t.stopPropagation(), s(null), t.currentTarget.blur();
			else if (t.key === "ArrowUp" || t.key === "ArrowDown") {
				t.preventDefault();
				let r = (t.shiftKey ? 1 : d) * (t.key === "ArrowUp" ? 1 : -1);
				s(null), i(n(e + r));
			}
		}
	});
}
var B = (e, t) => {
	let n = (e + t) / (2 * t) * 100, [r, i] = n >= 50 ? [50, n] : [n, 50];
	return `linear-gradient(to right, var(--_track) ${r}%, var(--_accent) ${r}%, var(--_accent) ${i}%, var(--_track) ${i}%)`;
}, V = (e, t) => `${e[0].label} Hz – ${e[e.length - 1].label.replace("k", " k")}Hz · ±${t} dB in 0.1 dB steps · type a value (e.g. 1.3) or use ↑/↓ · double-click a band or knob to reset it · Limiter stops boosts from distorting`, H = ({ on: e, className: t = "", ...n }) => /* @__PURE__ */ o("button", {
	type: "button",
	className: `geq-btn${e ? " is-on" : ""} ${t}`.trim(),
	...n
});
function U({ eq: e, title: n = "Equalizer", helpText: i, showPresets: c = !0, showCuts: u = !0, showModes: m = !0, showLimiter: h = !0, onDone: g, className: _ = "", ...v }) {
	let y = L(e), { mode: b, range: x, bypass: S, limiter: w, bands: T, gains: E, cuts: D } = y, [O, k] = r(!1), [A, j] = r(""), [M, N] = r(""), P = t(), F = y.userPresets.filter((e) => e.mode === b), R = F.find((e) => e.id === A), U = !!R && T.some((e, t) => R.values[t] !== E[e.id]), W = (e) => y.userPresets.some((t) => t.id === e) ? e : "", G = i === !1 ? null : typeof i == "function" ? i(T, x) : i ?? V(T, x), K = (t, n) => {
		e.setGain(t, n), j(W);
	}, q = (t) => {
		j(t), t && e.applyPreset(t);
	}, J = (t) => {
		t.preventDefault();
		let n = e.savePreset(M);
		n && (j(n.id), N(""));
	};
	return /* @__PURE__ */ s("div", {
		className: `geq${T.length > 7 ? " geq-dense" : ""}${S ? " is-bypassed" : ""} ${_}`.trim(),
		...v,
		children: [
			/* @__PURE__ */ s("div", {
				className: "geq-head",
				children: [n ? /* @__PURE__ */ o("h2", {
					className: "geq-title",
					children: n
				}) : /* @__PURE__ */ o("span", {}), /* @__PURE__ */ s("div", {
					className: "geq-head-tools",
					children: [m && /* @__PURE__ */ o("div", {
						className: "geq-group",
						role: "group",
						"aria-label": "Number of bands",
						children: C.map((t) => /* @__PURE__ */ s(H, {
							on: b === t,
							"aria-pressed": b === t,
							onClick: () => {
								e.setMode(t), j("");
							},
							children: [t, "-band"]
						}, t))
					}), G != null && /* @__PURE__ */ o(H, {
						on: O,
						className: "geq-help-btn",
						"aria-expanded": O,
						"aria-controls": P,
						"aria-label": "Help",
						title: "Help",
						onClick: () => k((e) => !e),
						children: "?"
					})]
				})]
			}),
			O && G != null && /* @__PURE__ */ o("p", {
				id: P,
				className: "geq-help",
				children: G
			}),
			c && /* @__PURE__ */ s("div", {
				className: "geq-presets",
				children: [
					/* @__PURE__ */ s("select", {
						className: "geq-input",
						value: A,
						onChange: (e) => q(e.target.value),
						"aria-label": "Preset",
						children: [
							/* @__PURE__ */ o("option", {
								value: "",
								children: "Preset…"
							}),
							/* @__PURE__ */ o("optgroup", {
								label: "Built-in",
								children: y.presets.map((e) => /* @__PURE__ */ o("option", {
									value: e.id,
									children: e.name
								}, e.id))
							}),
							F.length > 0 && /* @__PURE__ */ o("optgroup", {
								label: "My presets",
								children: F.map((e) => /* @__PURE__ */ o("option", {
									value: e.id,
									children: e.name
								}, e.id))
							})
						]
					}),
					R && /* @__PURE__ */ s(a, { children: [/* @__PURE__ */ o(H, {
						on: !0,
						onClick: () => e.updatePreset(A),
						disabled: !U,
						title: U ? `Save the current settings into "${R.name}"` : "Change a band to update this preset",
						children: "Update"
					}), /* @__PURE__ */ o(H, {
						onClick: () => {
							e.deletePreset(A), j("");
						},
						children: "Delete"
					})] }),
					/* @__PURE__ */ s("form", {
						className: "geq-save",
						onSubmit: J,
						children: [/* @__PURE__ */ o("input", {
							className: "geq-input",
							value: M,
							maxLength: 30,
							placeholder: "Save as…",
							onChange: (e) => N(e.target.value),
							"aria-label": "Preset name"
						}), /* @__PURE__ */ o(H, {
							type: "submit",
							on: !0,
							disabled: !M.trim(),
							children: "Save"
						})]
					})
				]
			}),
			/* @__PURE__ */ s("div", {
				className: "geq-main",
				children: [
					u && /* @__PURE__ */ o(I, {
						label: "Low cut",
						value: D.low,
						min: f.min,
						max: f.max,
						off: f.off,
						onChange: (t) => e.setCut("low", t)
					}),
					/* @__PURE__ */ o("div", {
						className: "geq-bands",
						children: T.map((t) => /* @__PURE__ */ s("div", {
							className: "geq-band",
							children: [
								/* @__PURE__ */ o(z, {
									value: E[t.id],
									label: t.label,
									clampDb: e.clampDb,
									onChange: (e) => K(t.id, e)
								}),
								/* @__PURE__ */ o("div", {
									className: "geq-fader-box",
									children: /* @__PURE__ */ o("input", {
										type: "range",
										className: "geq-fader",
										min: -x,
										max: x,
										step: d,
										value: E[t.id],
										style: { "--geq-fill": B(E[t.id], x) },
										onChange: (e) => K(t.id, +e.target.value),
										"aria-label": `${t.label} Hz`,
										onDoubleClick: () => K(t.id, 0)
									})
								}),
								/* @__PURE__ */ o("span", {
									className: "geq-band-label",
									children: t.label
								})
							]
						}, t.id))
					}),
					u && /* @__PURE__ */ o(I, {
						label: "High cut",
						value: D.high,
						min: p.min,
						max: p.max,
						off: p.off,
						onChange: (t) => e.setCut("high", t)
					})
				]
			}),
			/* @__PURE__ */ s("div", {
				className: "geq-footer",
				children: [
					/* @__PURE__ */ s("div", {
						className: "geq-footer-start",
						children: [/* @__PURE__ */ o(H, {
							on: S,
							className: "geq-bypass",
							"aria-pressed": S,
							onClick: () => e.setBypass(!S),
							title: "Take the EQ out of the sound (settings are kept)",
							children: S ? "Bypassed" : "Bypass"
						}), h && /* @__PURE__ */ o(H, {
							on: w,
							className: "geq-limiter",
							"aria-pressed": w,
							onClick: () => e.setLimiter(!w),
							title: "Stop boosted peaks from distorting (clipping)",
							children: "Limiter"
						})]
					}),
					/* @__PURE__ */ o("div", {
						className: "geq-group geq-range",
						role: "group",
						"aria-label": "Fader range",
						children: l.map((t) => /* @__PURE__ */ s(H, {
							on: x === t,
							"aria-pressed": x === t,
							onClick: () => e.setRange(t),
							children: [
								"±",
								t,
								" dB"
							]
						}, t))
					}),
					/* @__PURE__ */ s("div", {
						className: "geq-done",
						children: [/* @__PURE__ */ o(H, {
							onClick: () => {
								e.reset(), j(W);
							},
							children: "Reset"
						}), g && /* @__PURE__ */ o(H, {
							on: !0,
							onClick: g,
							children: "Done"
						})]
					})
				]
			})
		]
	});
}
// src/react/EqualizerModal.jsx
function W({ eq: t, open: n = !0, onClose: r, title: i = "Equalizer", overlayClassName: a = "", dialogClassName: s = "", ...l }) {
	let { bands: u } = L(t);
	return e(() => {
		if (!n) return;
		let e = (e) => e.key === "Escape" && r?.();
		return window.addEventListener("keydown", e), () => window.removeEventListener("keydown", e);
	}, [n, r]), !n || typeof document > "u" ? null : c(/* @__PURE__ */ o("div", {
		className: `geq-overlay ${a}`.trim(),
		onMouseDown: (e) => e.target === e.currentTarget && r?.(),
		children: /* @__PURE__ */ o("div", {
			className: `geq-dialog${u.length > 7 ? " geq-wide" : ""} ${s}`.trim(),
			role: "dialog",
			"aria-modal": "true",
			"aria-label": i || "Equalizer",
			children: /* @__PURE__ */ o(U, {
				eq: t,
				title: i,
				onDone: r,
				...l
			})
		})
	}), document.body);
}
export { T as BUILT_IN_PRESETS, U as Equalizer, W as EqualizerModal, p as HIGH_CUT, I as Knob, h as LIMITER, f as LOW_CUT, u as MAX_RANGE, S as MODES, C as MODE_LIST, l as RANGES, d as STEP, k as createEqualizer, F as fmtHz, L as useEqualizer };

//# sourceMappingURL=index.js.map