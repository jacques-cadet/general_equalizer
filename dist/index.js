import { useEffect as e, useId as t, useRef as n, useState as r, useSyncExternalStore as i } from "react";
import { jsx as a, jsxs as o } from "react/jsx-runtime";
import { createPortal as s } from "react-dom";
// src/engine.js
var c = [
	6,
	12,
	18
], l = 18, u = .1, d = {
	min: 20,
	max: 1e3,
	off: 20
}, f = {
	min: 1e3,
	max: 2e4,
	off: 2e4
}, p = 20 * Math.log10(Math.SQRT1_2), m = (e, t) => Math.round(Math.max(-t, Math.min(t, Number(e) || 0)) * 10) / 10, h = (e, { min: t, max: n }) => Math.round(Math.max(t, Math.min(n, Number(e) || 0))), g = (e) => +(1 / (2 * Math.sinh(Math.LN2 / 2 * e))).toFixed(2), _ = (e) => e >= 1e3 ? `${e / 1e3}k` : `${e}`;
function v(e, t) {
	let n = t.map((e, n) => n === 0 ? 0 : Math.log2(e / t[n - 1]));
	return t.map((r, i) => {
		let a = {
			id: `${e}:f${r}`,
			label: _(r),
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
			q: g((n[i] + n[i + 1]) / 2)
		};
	});
}
var y = Object.freeze({
	3: v(3, [
		120,
		1e3,
		8e3
	]),
	7: v(7, [
		64,
		160,
		400,
		1e3,
		2e3,
		4e3,
		8e3
	]),
	11: v(11, [
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
}), b = [
	3,
	7,
	11
], x = b.flatMap((e) => y[e]).map((e) => e.id), S = Object.freeze([
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
]), C = /* @__PURE__ */ new WeakMap();
function w(e, t) {
	let n = C.get(e);
	n || C.set(e, n = /* @__PURE__ */ new WeakMap());
	let r = n.get(t);
	return r || n.set(t, r = e.createMediaElementSource(t)), r;
}
function T() {
	try {
		return typeof window < "u" && window.localStorage ? window.localStorage : null;
	} catch {
		return null;
	}
}
function E(e = {}) {
	let { audioContext: t = null, destination: n = null, storageKey: r = "geq", defaultMode: i = 3, defaultRange: a = 12, presets: o = S, maxUserPresets: s = 30 } = e, l = e.storage === void 0 ? T() : e.storage, u = (e) => `${r}:${e}`, g = (e) => {
		try {
			return JSON.parse(l?.getItem(u(e)) ?? "null");
		} catch {
			return null;
		}
	}, _ = (e, t) => {
		try {
			l?.setItem(u(e), JSON.stringify(t));
		} catch {}
	}, v = (e) => b.includes(e) ? e : b.includes(i) ? i : 3, C = (e) => c.includes(e) ? e : c.includes(a) ? a : 12, E = (e) => e && typeof e.name == "string" && b.includes(e.mode) && Array.isArray(e.values), D = v(g("mode")), O = C(g("range")), k = g("bypass") === !0, A = g("cuts") || {}, j = {
		low: h(A.low ?? d.off, d),
		high: h(A.high ?? f.off, f)
	}, M = g("gains") || {}, N = Object.fromEntries(x.map((e) => [e, Number.isFinite(M[e]) ? m(M[e], 18) : 0])), P = (Array.isArray(g("presets")) ? g("presets") : []).filter(E), F = (e) => m(e, O), I = (e) => m(N[e], O), L = /* @__PURE__ */ new Set(), R = null, z = () => {
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
		}), U = B.createBiquadFilter(), U.type = "highpass", U.frequency.value = j.low, U.Q.value = p, W = B.createBiquadFilter(), W.type = "lowpass", W.frequency.value = j.high, W.Q.value = p, G = y[D].map((e) => {
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
			let t = w(B, e);
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
				bands: y[D],
				gains: Object.freeze(Object.fromEntries(x.map((e) => [e, I(e)]))),
				values: Object.freeze(y[D].map((e) => I(e.id))),
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
			let n = y[D].findIndex((t) => t.id === e);
			G && n >= 0 && (G[n].gain.value = I(e)), _("gains", N), z();
		},
		applyValues(e) {
			y[D].forEach((t, n) => {
				N = {
					...N,
					[t.id]: F(e?.[n])
				}, G && (G[n].gain.value = I(t.id));
			}), _("gains", N), z();
		},
		getValues: () => y[D].map((e) => I(e.id)),
		setRange(e) {
			c.includes(e) && e !== O && (O = e, _("range", O), G && y[D].forEach((e, t) => {
				G[t].gain.value = I(e.id);
			}), z());
		},
		setBypass(e) {
			k = !!e, _("bypass", k), J(), z();
		},
		setCut(e, t) {
			if (e !== "low" && e !== "high") return;
			let n = e === "low" ? d : f;
			j = {
				...j,
				[e]: h(t, n)
			}, _("cuts", j);
			let r = e === "low" ? U : W;
			r && r.frequency.setTargetAtTime(j[e], B.currentTime, .015), z();
		},
		reset() {
			Q.applyValues(y[D].map(() => 0)), Q.setCut("low", d.off), Q.setCut("high", f.off);
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
var D = 270, O = 22, k = 28, A = (e, t = O) => {
	let n = (-135 + e * D - 90) * (Math.PI / 180);
	return [k + t * Math.cos(n), k + t * Math.sin(n)];
}, j = (e, t) => {
	if (t - e < .002) return "";
	let [n, r] = A(e), [i, a] = A(t);
	return `M ${n} ${r} A ${O} ${O} 0 ${+((t - e) * D > 180)} 1 ${i} ${a}`;
}, M = (e) => e < 1e3 ? `${Math.round(e)} Hz` : `${(e / 1e3).toFixed(+(e < 1e4))}k`;
function N({ label: t, value: r, min: i, max: s, off: c, onChange: l, offText: u = "Off", format: d = M }) {
	let f = n(null), p = n(null), m = (e) => Math.log(e / i) / Math.log(s / i), h = (e) => i * (s / i) ** +Math.max(0, Math.min(1, e)), g = m(r), _ = m(c ?? i), v = (e) => l(h(m(r) + e));
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
		e.key in n ? (e.preventDefault(), v(n[e.key])) : e.key === "Home" ? (e.preventDefault(), l(i)) : e.key === "End" && (e.preventDefault(), l(s));
	}, C = c != null && Math.abs(r - c) < .5, w = C ? u : d(r), [T, E] = A(g, 13), [D, O] = A(g, 21);
	return /* @__PURE__ */ o("div", {
		className: `geq-knob${C ? "" : " is-on"}`,
		children: [
			/* @__PURE__ */ a("div", {
				ref: f,
				className: "geq-knob-dial",
				role: "slider",
				tabIndex: 0,
				"aria-label": t,
				"aria-valuemin": i,
				"aria-valuemax": s,
				"aria-valuenow": Math.round(r),
				"aria-valuetext": w,
				onPointerDown: y,
				onPointerMove: b,
				onPointerUp: x,
				onPointerCancel: x,
				onKeyDown: S,
				onDoubleClick: () => c != null && l(c),
				title: `${t}: drag, scroll or use the arrow keys${c == null ? "" : "; double-click = off"}`,
				children: /* @__PURE__ */ o("svg", {
					viewBox: "0 0 56 56",
					width: "56",
					height: "56",
					"aria-hidden": "true",
					children: [
						/* @__PURE__ */ a("circle", {
							cx: k,
							cy: k,
							r: 17,
							className: "geq-knob-cap"
						}),
						/* @__PURE__ */ a("path", {
							d: j(0, 1),
							className: "geq-knob-track"
						}),
						/* @__PURE__ */ a("path", {
							d: _ <= g ? j(_, g) : j(g, _),
							className: "geq-knob-value"
						}),
						/* @__PURE__ */ a("line", {
							x1: T,
							y1: E,
							x2: D,
							y2: O,
							className: "geq-knob-pointer"
						})
					]
				})
			}),
			/* @__PURE__ */ a("span", {
				className: "geq-knob-label",
				children: t
			}),
			/* @__PURE__ */ a("span", {
				className: "geq-knob-text",
				children: w
			})
		]
	});
}
// src/react/useEqualizer.js
function P(e) {
	return i(e.subscribe, e.getState, e.getState);
}
// src/react/Equalizer.jsx
var F = (e) => `${e > 0 ? "+" : ""}${e.toFixed(1)}`;
function I({ value: e, label: t, clampDb: n, onChange: i }) {
	let [o, s] = r(null), c = () => {
		if (o !== null) {
			let e = parseFloat(o.replace(",", "."));
			Number.isFinite(e) && i(n(e)), s(null);
		}
	};
	return /* @__PURE__ */ a("input", {
		className: "geq-db",
		type: "text",
		inputMode: "decimal",
		"aria-label": `${t} Hz gain in dB`,
		value: o ?? F(e),
		onChange: (e) => s(e.target.value),
		onFocus: (e) => e.target.select(),
		onBlur: c,
		onKeyDown: (t) => {
			if (t.key === "Enter") c(), t.currentTarget.blur();
			else if (t.key === "Escape") t.stopPropagation(), s(null), t.currentTarget.blur();
			else if (t.key === "ArrowUp" || t.key === "ArrowDown") {
				t.preventDefault();
				let r = (t.shiftKey ? 1 : u) * (t.key === "ArrowUp" ? 1 : -1);
				s(null), i(n(e + r));
			}
		}
	});
}
var L = (e, t) => {
	let n = (e + t) / (2 * t) * 100, [r, i] = n >= 50 ? [50, n] : [n, 50];
	return `linear-gradient(to right, var(--_track) ${r}%, var(--_accent) ${r}%, var(--_accent) ${i}%, var(--_track) ${i}%)`;
}, R = (e, t) => `${e[0].label} Hz – ${e[e.length - 1].label.replace("k", " k")}Hz · ±${t} dB in 0.1 dB steps · type a value (e.g. 1.3) or use ↑/↓ · double-click a band or knob to reset it`, z = ({ on: e, className: t = "", ...n }) => /* @__PURE__ */ a("button", {
	type: "button",
	className: `geq-btn${e ? " is-on" : ""} ${t}`.trim(),
	...n
});
function B({ eq: e, title: n = "Equalizer", helpText: i, showPresets: s = !0, showCuts: l = !0, showModes: p = !0, onDone: m, className: h = "", ...g }) {
	let _ = P(e), { mode: v, range: y, bypass: x, bands: S, gains: C, cuts: w } = _, [T, E] = r(!1), [D, O] = r(""), [k, A] = r(""), j = t(), M = _.userPresets.filter((e) => e.mode === v), F = i === !1 ? null : typeof i == "function" ? i(S, y) : i ?? R(S, y), B = (t, n) => {
		e.setGain(t, n), O("");
	}, V = (t) => {
		O(t), t && e.applyPreset(t);
	}, H = (t) => {
		t.preventDefault();
		let n = e.savePreset(k);
		n && (O(n.id), A(""));
	};
	return /* @__PURE__ */ o("div", {
		className: `geq${S.length > 7 ? " geq-dense" : ""}${x ? " is-bypassed" : ""} ${h}`.trim(),
		...g,
		children: [
			/* @__PURE__ */ o("div", {
				className: "geq-head",
				children: [n ? /* @__PURE__ */ a("h2", {
					className: "geq-title",
					children: n
				}) : /* @__PURE__ */ a("span", {}), /* @__PURE__ */ o("div", {
					className: "geq-head-tools",
					children: [p && /* @__PURE__ */ a("div", {
						className: "geq-group",
						role: "group",
						"aria-label": "Number of bands",
						children: b.map((t) => /* @__PURE__ */ o(z, {
							on: v === t,
							"aria-pressed": v === t,
							onClick: () => {
								e.setMode(t), O("");
							},
							children: [t, "-band"]
						}, t))
					}), F != null && /* @__PURE__ */ a(z, {
						on: T,
						className: "geq-help-btn",
						"aria-expanded": T,
						"aria-controls": j,
						"aria-label": "Help",
						title: "Help",
						onClick: () => E((e) => !e),
						children: "?"
					})]
				})]
			}),
			T && F != null && /* @__PURE__ */ a("p", {
				id: j,
				className: "geq-help",
				children: F
			}),
			s && /* @__PURE__ */ o("div", {
				className: "geq-presets",
				children: [
					/* @__PURE__ */ o("select", {
						className: "geq-input",
						value: D,
						onChange: (e) => V(e.target.value),
						"aria-label": "Preset",
						children: [
							/* @__PURE__ */ a("option", {
								value: "",
								children: "Preset…"
							}),
							/* @__PURE__ */ a("optgroup", {
								label: "Built-in",
								children: _.presets.map((e) => /* @__PURE__ */ a("option", {
									value: e.id,
									children: e.name
								}, e.id))
							}),
							M.length > 0 && /* @__PURE__ */ a("optgroup", {
								label: "My presets",
								children: M.map((e) => /* @__PURE__ */ a("option", {
									value: e.id,
									children: e.name
								}, e.id))
							})
						]
					}),
					M.some((e) => e.id === D) && /* @__PURE__ */ a(z, {
						onClick: () => {
							e.deletePreset(D), O("");
						},
						children: "Delete"
					}),
					/* @__PURE__ */ o("form", {
						className: "geq-save",
						onSubmit: H,
						children: [/* @__PURE__ */ a("input", {
							className: "geq-input",
							value: k,
							maxLength: 30,
							placeholder: "Save as…",
							onChange: (e) => A(e.target.value),
							"aria-label": "Preset name"
						}), /* @__PURE__ */ a(z, {
							type: "submit",
							on: !0,
							disabled: !k.trim(),
							children: "Save"
						})]
					})
				]
			}),
			/* @__PURE__ */ o("div", {
				className: "geq-main",
				children: [
					l && /* @__PURE__ */ a(N, {
						label: "Low cut",
						value: w.low,
						min: d.min,
						max: d.max,
						off: d.off,
						onChange: (t) => e.setCut("low", t)
					}),
					/* @__PURE__ */ a("div", {
						className: "geq-bands",
						children: S.map((t) => /* @__PURE__ */ o("div", {
							className: "geq-band",
							children: [
								/* @__PURE__ */ a(I, {
									value: C[t.id],
									label: t.label,
									clampDb: e.clampDb,
									onChange: (e) => B(t.id, e)
								}),
								/* @__PURE__ */ a("div", {
									className: "geq-fader-box",
									children: /* @__PURE__ */ a("input", {
										type: "range",
										className: "geq-fader",
										min: -y,
										max: y,
										step: u,
										value: C[t.id],
										style: { "--geq-fill": L(C[t.id], y) },
										onChange: (e) => B(t.id, +e.target.value),
										"aria-label": `${t.label} Hz`,
										onDoubleClick: () => B(t.id, 0)
									})
								}),
								/* @__PURE__ */ a("span", {
									className: "geq-band-label",
									children: t.label
								})
							]
						}, t.id))
					}),
					l && /* @__PURE__ */ a(N, {
						label: "High cut",
						value: w.high,
						min: f.min,
						max: f.max,
						off: f.off,
						onChange: (t) => e.setCut("high", t)
					})
				]
			}),
			/* @__PURE__ */ o("div", {
				className: "geq-footer",
				children: [
					/* @__PURE__ */ a(z, {
						on: x,
						className: "geq-bypass",
						"aria-pressed": x,
						onClick: () => e.setBypass(!x),
						title: "Take the EQ out of the sound (settings are kept)",
						children: x ? "Bypassed" : "Bypass"
					}),
					/* @__PURE__ */ a("div", {
						className: "geq-group geq-range",
						role: "group",
						"aria-label": "Fader range",
						children: c.map((t) => /* @__PURE__ */ o(z, {
							on: y === t,
							"aria-pressed": y === t,
							onClick: () => e.setRange(t),
							children: [
								"±",
								t,
								" dB"
							]
						}, t))
					}),
					/* @__PURE__ */ o("div", {
						className: "geq-done",
						children: [/* @__PURE__ */ a(z, {
							onClick: () => {
								e.reset(), O("");
							},
							children: "Reset"
						}), m && /* @__PURE__ */ a(z, {
							on: !0,
							onClick: m,
							children: "Done"
						})]
					})
				]
			})
		]
	});
}
// src/react/EqualizerModal.jsx
function V({ eq: t, open: n = !0, onClose: r, title: i = "Equalizer", ...o }) {
	let { bands: c } = P(t);
	return e(() => {
		if (!n) return;
		let e = (e) => e.key === "Escape" && r?.();
		return window.addEventListener("keydown", e), () => window.removeEventListener("keydown", e);
	}, [n, r]), !n || typeof document > "u" ? null : s(/* @__PURE__ */ a("div", {
		className: "geq-overlay",
		onMouseDown: (e) => e.target === e.currentTarget && r?.(),
		children: /* @__PURE__ */ a("div", {
			className: `geq-dialog${c.length > 7 ? " geq-wide" : ""}`,
			role: "dialog",
			"aria-modal": "true",
			"aria-label": i || "Equalizer",
			children: /* @__PURE__ */ a(B, {
				eq: t,
				title: i,
				onDone: r,
				...o
			})
		})
	}), document.body);
}
export { S as BUILT_IN_PRESETS, B as Equalizer, V as EqualizerModal, f as HIGH_CUT, N as Knob, d as LOW_CUT, l as MAX_RANGE, y as MODES, b as MODE_LIST, c as RANGES, u as STEP, E as createEqualizer, M as fmtHz, P as useEqualizer };

//# sourceMappingURL=index.js.map