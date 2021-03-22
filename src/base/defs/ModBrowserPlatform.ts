Object.defineProperties(Array.prototype, {
	freeze: { value: function freeze() { return Object.freeze(this); }, enumerable: true },
	seal: { value: function seal() { return Object.seal(this); }, enumerable: true },
});

// In-House `--frozen-intrinsics`:
(<(keyof typeof globalThis)[]>[
	"Object", "String", "Number", "RegExp", "Date",
	"Array", "Map", "Set", "WeakMap", "WeakSet",
	// .-- web-specific --.
	"URL",
	"HTMLElement", "HTMLDivElement", "HTMLSpanElement", "HTMLPreElement",
	"HTMLButtonElement", "HTMLInputElement", "HTMLSelectElement", "HTMLOptionElement",
	"HTMLScriptElement", "HTMLStyleElement", "HTMLLinkElement", "HTMLAnchorElement",
	"HTMLDocument", "HTMLIFrameElement", "HTMLCanvasElement",
])
.forEach((key) => {
	Object.defineProperty(globalThis, key, {
		enumerable: true,
		writable: false,
		configurable: false,
	});
	Object.freeze((globalThis as any)[key]);
	Object.freeze((globalThis as any)[key].prototype);
});

// Enforce JS running on nav back to page:
// (https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload#notes)
window.addEventListener("onbeforeunload", () => {});
