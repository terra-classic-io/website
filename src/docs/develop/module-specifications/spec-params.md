> **Note**
>
> The params module has been deprecated in favor of letting each module keep its own parameters in the app state.  
> Some modules still use the params module for governance proposals, but this is not recommended. These modules, until migrated, use the params keeper to store module parameter sets under individual subspaces. Those parameters can be updated through parameter-change proposals.
>
> Please refer to the [upstream documentation](https://docs.cosmos.network/main/modules/params/) for more details.
