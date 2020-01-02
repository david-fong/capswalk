
# Languages

Each implementation must:

- Go under the [`./impl/`](./impl/) folder.
- Implement the [`Lang`](./Lang.ts) interface.
- Assert its own class literal as a [`Lang.Info`](./Lang.ts) instance.
  - Expose static getters for a name string and a blurb string.
  - Follow a singleton pattern exposed through a static method "`getInstance`".
- TODO: ~Register their _file_ name in the [`Lang.Modules.NAMES`](Lang.ts) array for dynamic importing.~
