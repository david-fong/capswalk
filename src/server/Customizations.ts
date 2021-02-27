Object.defineProperties(Array.prototype, {
	freeze: { value: function freeze() { return Object.freeze(this); } },
	seal: { value: function seal() { return Object.seal(this); } },
});
// In-House `--frozen-intrinsics`:
(<(keyof typeof globalThis)[]>[
	"Object", "String", "Number", "RegExp", "Date",
	"Array", "Map", "Set", "WeakMap", "WeakSet",
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