
# Languages

Each implementation must:

- Implement the [`Lang`](./Lang.ts) interface.
- Follow a singleton pattern exposed through a static method "`getInstance`".
- Register their _file_ name in the [`Lang.Modules.NAMES`](Lang.ts) array for dynamic importing.
