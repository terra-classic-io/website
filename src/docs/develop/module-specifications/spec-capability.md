> **Note**
>
> Terra Classic uses the Cosmos SDK capability keeper to isolate IBC, wasm, and tax sub-modules. The Classic application seals the keeper during boot to prevent capability leakage and preserve deterministic middleware ordering.

## Role in Terra Classic

`x/capability` provides scoped capability sub-keepers to modules that interact with external systems:

- `x/ibc` and `x/transfer` claim channel and port capabilities.
- `ibc-hooks` registers wasm callback scopes for contract-triggered IBC packets.
- `x/wasm` inherits a scoped keeper to bind contract callbacks safely.

Once the Terra app creates all scoped keepers in `app/keepers/keepers.go`, it seals the main keeper (`InitializeAndSeal`) to prevent additional scopes from being created at runtime. This protects against modules trying to access foreign capabilities.

## State

- KV store: retains the global capability index and owners mapping.
- Memory store: caches active capability pointers for fast lookup.

State keys mirror Cosmos SDK defaults (`capability/types`). Classic does not modify the data structure.

## Initialization flow

1. Instantiate `capability.Keeper` with persistent and in-memory store keys.
2. Create scoped keepers for IBC core, transfer, wasm, dyncomm, and other modules.
3. Call `InitializeAndSeal` after loading state to populate the in-memory cache and lock the keeper.

## Notes for integrators

- Creating a new module that needs capability access requires wiring through `app/keepers/keepers.go` before sealing.
- Governance proposals cannot add new scopes without a software upgrade, ensuring deterministic capability ownership.
