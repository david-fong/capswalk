import { Grid } from "floor/Grid";
import { VisibleGrid } from "floor/VisibleGrid";

import { Euclid2 } from "floor/impl/Euclid2";
import { Beehive } from "floor/impl/Beehive";

import { ArtificialPlayer } from "./player/ArtificialPlayer";
import { Chaser } from "./player/artificials/Chaser";


/**
 *
 */
export namespace IndexTasks {

    /**
     * This function should be imported and run at the beginning of each
     * index.js file before calling any constructors for SnaKey-related
     * classes.
     *
     * It serves the dual purpose of initializing implementation
     * registries _after_ implementations and their class hierarchy have
     * been defined, and of importing implementations so they don't get
     * tree-shaken-out by webpack.
     */
    export function INIT_CLASS_REGISTRIES(): void
    { {
        // Non-Visible Grid Implementation Registry:
        (<TU.NoRo<typeof Grid.__Constructors>>Grid.__Constructors)
        = Object.freeze({
            [ "EUCLID2" ]: Euclid2.Grid,
            [ "BEEHIVE" ]: Beehive.Grid,
        });
        Object.freeze(Grid);
        Object.freeze(Grid.prototype);
    } {
        // Visible Grid Implementation Registry:
        const VGr = VisibleGrid;
        (<TU.NoRo<typeof VGr.__Constructors>>VGr.__Constructors)
        = Object.freeze({
            [ "EUCLID2" ]: Euclid2.Grid.Visible,
            [ "BEEHIVE" ]: Beehive.Grid.Visible,
        });
        Object.freeze(VGr);
        // This is just an interface. There is no instance prototype to freeze.
    } {
        const AP = ArtificialPlayer;
        (<TU.NoRo<typeof AP.__Constructors>>AP.__Constructors)
        = Object.freeze({
            CHASER: Chaser,
        });
        Object.freeze(AP);
        Object.freeze(AP.prototype);
    } }
    Object.freeze(INIT_CLASS_REGISTRIES);
}
Object.freeze(IndexTasks);