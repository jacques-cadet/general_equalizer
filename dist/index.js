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
}, m = 20 * Math.log10(Math.SQRT1_2), h = (e, t) => Math.round(Math.max(-t, Math.min(t, Number(e) || 0)) * 10) / 10, g = (e, { min: t, max: n }) => Math.round(Math.max(t, Math.min(n, Number(e) || 0))), _ = (e) => +(1 / (2 * Math.sinh(Math.LN2 / 2 * e))).toFixed(2), v = (e) => e >= 1e3 ? `${e / 1e3}k` : `${e}`;
function y(e, t) {
	let n = t.map((e, n) => n === 0 ? 0 : Math.log2(e / t[n - 1]));
	return t.map((r, i) => {
		let a = {
			id: `${e}:f${r}`,
			label: v(r),
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
			q: _((n[i] + n[i + 1]) / 2)
		};
	});
}
var b = Object.freeze({
	3: y(3, [
		120,
		1e3,
		8e3
	]),
	7: y(7, [
		64,
		160,
		400,
		1e3,
		2e3,
		4e3,
		8e3
	]),
	11: y(11, [
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
}), x = [
	3,
	7,
	11
], S = x.flatMap((e) => b[e]).map((e) => e.id), C = Object.freeze([
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
]), w = /* @__PURE__ */ new WeakMap();
function T(e, t) {
	let n = w.get(e);
	n || w.set(e, n = /* @__PURE__ */ new WeakMap());
	let r = n.get(t);
	return r || n.set(t, r = e.createMediaElementSource(t)), r;
}
function E() {
	try {
		return typeof window < "u" && window.localStorage ? window.localStorage : null;
	} catch {
		return null;
	}
}
function D(e = {}) {
	let { audioContext: t = null, destination: n = null, storageKey: r = "geq", defaultMode: i = 3, defaultRange: a = 12, presets: o = C, maxUserPresets: s = 30 } = e, c = e.storage === void 0 ? E() : e.storage, u = (e) => `${r}:${e}`, d = (e) => {
		try {
			return JSON.parse(c?.getItem(u(e)) ?? "null");
		} catch {
			return null;
		}
	}, _ = (e, t) => {
		try {
			c?.setItem(u(e), JSON.stringify(t));
		} catch {}
	}, v = (e) => x.includes(e) ? e : x.includes(i) ? i : 3, y = (e) => l.includes(e) ? e : l.includes(a) ? a : 12, w = (e) => e && typeof e.name == "string" && x.includes(e.mode) && Array.isArray(e.values), D = v(d("mode")), O = y(d("range")), k = d("bypass") === !0, A = d("cuts") || {}, j = {
		low: g(A.low ?? f.off, f),
		high: g(A.high ?? p.off, p)
	}, M = d("gains") || {}, N = Object.fromEntries(S.map((e) => [e, Number.isFinite(M[e]) ? h(M[e], 18) : 0])), P = (Array.isArray(d("presets")) ? d("presets") : []).filter(w), F = (e) => h(e, O), I = (e) => h(N[e], O), L = /* @__PURE__ */ new Set(), R = null, z = () => {
		R = null, L.forEach((e) => {
			try {
				e();
			} catch (e) {
				console.error(e);
			}
		});
	}, B = t, V = !1, H = null, U = null, W = null, G = null, K = /* @__PURE__ */ new Map(), q = () => n || B.destination;
	function J() {
		if (H) {
			try {
				H.disconnect();
			} catch {}
			H.connect(k ? q() : U);
		}
	}
	function Y() {
		[
			U,
			W,
			...G || []
		].forEach((e) => {
			try {
				e?.disconnect();
			} catch {}
		}), U = B.createBiquadFilter(), U.type = "highpass", U.frequency.value = j.low, U.Q.value = m, W = B.createBiquadFilter(), W.type = "lowpass", W.frequency.value = j.high, W.Q.value = m, G = b[D].map((e) => {
			let t = B.createBiquadFilter();
			return t.type = e.type, t.frequency.value = e.freq, t.gain.value = I(e.id), e.q && (t.Q.value = e.q), t;
		}), [
			U,
			W,
			...G
		].reduce((e, t) => (e.connect(t), t)).connect(q()), J();
	}
	function X() {
		if (H) return B;
		if (!B) {
			let e = typeof window < "u" && (window.AudioContext || window.webkitAudioContext);
			if (!e) throw Error("general_equalizer: Web Audio API is not available");
			B = new e(), V = !0;
		}
		return H = B.createGain(), Y(), B;
	}
	let Z = () => {
		B && B.state === "suspended" && B.resume().catch(() => {});
	}, Q = {
		attach(e) {
			X();
			let t = T(B, e);
			if (K.has(t)) return () => Q.detach(e);
			try {
				t.disconnect();
			} catch {}
			t.connect(H);
			let n = Z;
			return e.addEventListener("play", n), K.set(t, {
				el: e,
				onPlay: n
			}), e.paused || Z(), () => Q.detach(e);
		},
		connectSource(e) {
			return X(), K.has(e) || (e.connect(H), K.set(e, {})), () => Q.detach(e);
		},
		detach(e) {
			for (let [t, n] of [...K]) if (e === void 0 || e === t || e === n.el) {
				try {
					t.disconnect(H);
				} catch {}
				if (n.el) {
					n.el.removeEventListener("play", n.onPlay);
					try {
						t.connect(B.destination);
					} catch {}
				}
				K.delete(t);
			}
		},
		get audioContext() {
			return B;
		},
		get input() {
			return H;
		},
		getState() {
			return R ||= Object.freeze({
				mode: D,
				range: O,
				bypass: k,
				bands: b[D],
				gains: Object.freeze(Object.fromEntries(S.map((e) => [e, I(e)]))),
				values: Object.freeze(b[D].map((e) => I(e.id))),
				cuts: Object.freeze({ ...j }),
				presets: o,
				userPresets: Object.freeze(P.slice())
			}), R;
		},
		subscribe(e) {
			return L.add(e), () => L.delete(e);
		},
		clampDb: F,
		setMode(e) {
			let t = v(e);
			t !== D && (D = t, _("mode", D), H && Y(), z());
		},
		setGain(e, t) {
			if (!(e in N)) return;
			N = {
				...N,
				[e]: F(t)
			};
			let n = b[D].findIndex((t) => t.id === e);
			G && n >= 0 && (G[n].gain.value = I(e)), _("gains", N), z();
		},
		applyValues(e) {
			b[D].forEach((t, n) => {
				N = {
					...N,
					[t.id]: F(e?.[n])
				}, G && (G[n].gain.value = I(t.id));
			}), _("gains", N), z();
		},
		getValues: () => b[D].map((e) => I(e.id)),
		setRange(e) {
			l.includes(e) && e !== O && (O = e, _("range", O), G && b[D].forEach((e, t) => {
				G[t].gain.value = I(e.id);
			}), z());
		},
		setBypass(e) {
			k = !!e, _("bypass", k), J(), z();
		},
		setCut(e, t) {
			if (e !== "low" && e !== "high") return;
			let n = e === "low" ? f : p;
			j = {
				...j,
				[e]: g(t, n)
			}, _("cuts", j);
			let r = e === "low" ? U : W;
			r && r.frequency.setTargetAtTime(j[e], B.currentTime, .015), z();
		},
		reset() {
			Q.applyValues(b[D].map(() => 0)), Q.setCut("low", f.off), Q.setCut("high", p.off);
		},
		applyPreset(e) {
			let t = o.find((t) => t.id === e), n = P.find((t) => t.id === e), r = t ? t.values[D] : n && n.mode === D ? n.values : null;
			return r && Q.applyValues(r), !!r;
		},
		savePreset(e) {
			let t = String(e ?? "").trim().slice(0, 30);
			if (!t) return null;
			let n = {
				id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
				name: t,
				mode: D,
				values: Q.getValues()
			};
			return P = [...P.filter((e) => e.mode !== D || e.name.toLowerCase() !== t.toLowerCase()), n].slice(-s), _("presets", P), z(), n;
		},
		updatePreset(e) {
			let t = P.find((t) => t.id === e);
			if (!t || t.mode !== D) return null;
			let n = {
				...t,
				values: Q.getValues()
			};
			return P = P.map((t) => t.id === e ? n : t), _("presets", P), z(), n;
		},
		deletePreset(e) {
			P = P.filter((t) => t.id !== e), _("presets", P), z();
		},
		dispose() {
			Q.detach(), [
				H,
				U,
				W,
				...G || []
			].forEach((e) => {
				try {
					e?.disconnect();
				} catch {}
			}), H = U = W = G = null, V &&= (B.close?.().catch(() => {}), B = null, !1);
		}
	};
	return Q;
}
// src/react/Knob.jsx
var O = 270, k = 22, A = 28, j = (e, t = k) => {
	let n = (-135 + e * O - 90) * (Math.PI / 180);
	return [A + t * Math.cos(n), A + t * Math.sin(n)];
}, M = (e, t) => {
	if (t - e < .002) return "";
	let [n, r] = j(e), [i, a] = j(t);
	return `M ${n} ${r} A ${k} ${k} 0 ${+((t - e) * O > 180)} 1 ${i} ${a}`;
}, N = (e) => e < 1e3 ? `${Math.round(e)} Hz` : `${(e / 1e3).toFixed(+(e < 1e4))}k`;
function P({ label: t, value: r, min: i, max: a, off: c, onChange: l, offText: u = "Off", format: d = N }) {
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
	}, C = c != null && Math.abs(r - c) < .5, w = C ? u : d(r), [T, E] = j(g, 13), [D, O] = j(g, 21);
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
							cx: A,
							cy: A,
							r: 17,
							className: "geq-knob-cap"
						}),
						/* @__PURE__ */ o("path", {
							d: M(0, 1),
							className: "geq-knob-track"
						}),
						/* @__PURE__ */ o("path", {
							d: _ <= g ? M(_, g) : M(g, _),
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
function F(e) {
	return i(e.subscribe, e.getState, e.getState);
}
// src/react/Equalizer.jsx
var I = (e) => `${e > 0 ? "+" : ""}${e.toFixed(1)}`;
function L({ value: e, label: t, clampDb: n, onChange: i }) {
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
		value: a ?? I(e),
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
var R = (e, t) => {
	let n = (e + t) / (2 * t) * 100, [r, i] = n >= 50 ? [50, n] : [n, 50];
	return `linear-gradient(to right, var(--_track) ${r}%, var(--_accent) ${r}%, var(--_accent) ${i}%, var(--_track) ${i}%)`;
}, z = (e, t) => `${e[0].label} Hz – ${e[e.length - 1].label.replace("k", " k")}Hz · ±${t} dB in 0.1 dB steps · type a value (e.g. 1.3) or use ↑/↓ · double-click a band or knob to reset it`, B = ({ on: e, className: t = "", ...n }) => /* @__PURE__ */ o("button", {
	type: "button",
	className: `geq-btn${e ? " is-on" : ""} ${t}`.trim(),
	...n
});
function V({ eq: e, title: n = "Equalizer", helpText: i, showPresets: c = !0, showCuts: u = !0, showModes: m = !0, onDone: h, className: g = "", ..._ }) {
	let v = F(e), { mode: y, range: b, bypass: S, bands: C, gains: w, cuts: T } = v, [E, D] = r(!1), [O, k] = r(""), [A, j] = r(""), M = t(), N = v.userPresets.filter((e) => e.mode === y), I = N.find((e) => e.id === O), V = !!I && C.some((e, t) => I.values[t] !== w[e.id]), H = (e) => v.userPresets.some((t) => t.id === e) ? e : "", U = i === !1 ? null : typeof i == "function" ? i(C, b) : i ?? z(C, b), W = (t, n) => {
		e.setGain(t, n), k(H);
	}, G = (t) => {
		k(t), t && e.applyPreset(t);
	}, K = (t) => {
		t.preventDefault();
		let n = e.savePreset(A);
		n && (k(n.id), j(""));
	};
	return /* @__PURE__ */ s("div", {
		className: `geq${C.length > 7 ? " geq-dense" : ""}${S ? " is-bypassed" : ""} ${g}`.trim(),
		..._,
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
						children: x.map((t) => /* @__PURE__ */ s(B, {
							on: y === t,
							"aria-pressed": y === t,
							onClick: () => {
								e.setMode(t), k("");
							},
							children: [t, "-band"]
						}, t))
					}), U != null && /* @__PURE__ */ o(B, {
						on: E,
						className: "geq-help-btn",
						"aria-expanded": E,
						"aria-controls": M,
						"aria-label": "Help",
						title: "Help",
						onClick: () => D((e) => !e),
						children: "?"
					})]
				})]
			}),
			E && U != null && /* @__PURE__ */ o("p", {
				id: M,
				className: "geq-help",
				children: U
			}),
			c && /* @__PURE__ */ s("div", {
				className: "geq-presets",
				children: [
					/* @__PURE__ */ s("select", {
						className: "geq-input",
						value: O,
						onChange: (e) => G(e.target.value),
						"aria-label": "Preset",
						children: [
							/* @__PURE__ */ o("option", {
								value: "",
								children: "Preset…"
							}),
							/* @__PURE__ */ o("optgroup", {
								label: "Built-in",
								children: v.presets.map((e) => /* @__PURE__ */ o("option", {
									value: e.id,
									children: e.name
								}, e.id))
							}),
							N.length > 0 && /* @__PURE__ */ o("optgroup", {
								label: "My presets",
								children: N.map((e) => /* @__PURE__ */ o("option", {
									value: e.id,
									children: e.name
								}, e.id))
							})
						]
					}),
					I && /* @__PURE__ */ s(a, { children: [/* @__PURE__ */ o(B, {
						on: !0,
						onClick: () => e.updatePreset(O),
						disabled: !V,
						title: V ? `Save the current settings into "${I.name}"` : "Change a band to update this preset",
						children: "Update"
					}), /* @__PURE__ */ o(B, {
						onClick: () => {
							e.deletePreset(O), k("");
						},
						children: "Delete"
					})] }),
					/* @__PURE__ */ s("form", {
						className: "geq-save",
						onSubmit: K,
						children: [/* @__PURE__ */ o("input", {
							className: "geq-input",
							value: A,
							maxLength: 30,
							placeholder: "Save as…",
							onChange: (e) => j(e.target.value),
							"aria-label": "Preset name"
						}), /* @__PURE__ */ o(B, {
							type: "submit",
							on: !0,
							disabled: !A.trim(),
							children: "Save"
						})]
					})
				]
			}),
			/* @__PURE__ */ s("div", {
				className: "geq-main",
				children: [
					u && /* @__PURE__ */ o(P, {
						label: "Low cut",
						value: T.low,
						min: f.min,
						max: f.max,
						off: f.off,
						onChange: (t) => e.setCut("low", t)
					}),
					/* @__PURE__ */ o("div", {
						className: "geq-bands",
						children: C.map((t) => /* @__PURE__ */ s("div", {
							className: "geq-band",
							children: [
								/* @__PURE__ */ o(L, {
									value: w[t.id],
									label: t.label,
									clampDb: e.clampDb,
									onChange: (e) => W(t.id, e)
								}),
								/* @__PURE__ */ o("div", {
									className: "geq-fader-box",
									children: /* @__PURE__ */ o("input", {
										type: "range",
										className: "geq-fader",
										min: -b,
										max: b,
										step: d,
										value: w[t.id],
										style: { "--geq-fill": R(w[t.id], b) },
										onChange: (e) => W(t.id, +e.target.value),
										"aria-label": `${t.label} Hz`,
										onDoubleClick: () => W(t.id, 0)
									})
								}),
								/* @__PURE__ */ o("span", {
									className: "geq-band-label",
									children: t.label
								})
							]
						}, t.id))
					}),
					u && /* @__PURE__ */ o(P, {
						label: "High cut",
						value: T.high,
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
					/* @__PURE__ */ o(B, {
						on: S,
						className: "geq-bypass",
						"aria-pressed": S,
						onClick: () => e.setBypass(!S),
						title: "Take the EQ out of the sound (settings are kept)",
						children: S ? "Bypassed" : "Bypass"
					}),
					/* @__PURE__ */ o("div", {
						className: "geq-group geq-range",
						role: "group",
						"aria-label": "Fader range",
						children: l.map((t) => /* @__PURE__ */ s(B, {
							on: b === t,
							"aria-pressed": b === t,
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
						children: [/* @__PURE__ */ o(B, {
							onClick: () => {
								e.reset(), k(H);
							},
							children: "Reset"
						}), h && /* @__PURE__ */ o(B, {
							on: !0,
							onClick: h,
							children: "Done"
						})]
					})
				]
			})
		]
	});
}
// src/react/EqualizerModal.jsx
function H({ eq: t, open: n = !0, onClose: r, title: i = "Equalizer", ...a }) {
	let { bands: s } = F(t);
	return e(() => {
		if (!n) return;
		let e = (e) => e.key === "Escape" && r?.();
		return window.addEventListener("keydown", e), () => window.removeEventListener("keydown", e);
	}, [n, r]), !n || typeof document > "u" ? null : c(/* @__PURE__ */ o("div", {
		className: "geq-overlay",
		onMouseDown: (e) => e.target === e.currentTarget && r?.(),
		children: /* @__PURE__ */ o("div", {
			className: `geq-dialog${s.length > 7 ? " geq-wide" : ""}`,
			role: "dialog",
			"aria-modal": "true",
			"aria-label": i || "Equalizer",
			children: /* @__PURE__ */ o(V, {
				eq: t,
				title: i,
				onDone: r,
				...a
			})
		})
	}), document.body);
}
export { C as BUILT_IN_PRESETS, V as Equalizer, H as EqualizerModal, p as HIGH_CUT, P as Knob, f as LOW_CUT, u as MAX_RANGE, b as MODES, x as MODE_LIST, l as RANGES, d as STEP, D as createEqualizer, N as fmtHz, F as useEqualizer };

//# sourceMappingURL=index.js.map