
# Languages

Each implementation must:

- Go under the [`./impl/`](./impl/) folder.
- Implement the [`Lang` and `Lang.ClassIf`](./Lang.ts) interfaces.
- Assert its own class literal as a [`Lang.Info`](./Lang.ts) instance.
  - Follow a singleton pattern exposed through a static method "`getInstance`".
- Register their filename (without the extension) and exports in the [`Lang.FrontendDescs`](../../defs/TypeDefs.ts) array for dynamic importing.
- Call `Object.seal` on its constructor and prototype objects. If you can use `Object.freeze`, that's even better.
