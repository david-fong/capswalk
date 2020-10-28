import { Grid } from "floor/Grid";
import { Euclid2 } from "floor/impl/Euclid2";
import { Beehive } from "floor/impl/Beehive";

import { ArtificialPlayer } from "../player/ArtificialPlayer";
import { Chaser } from "../player/artificials/Chaser";

export default (): void => {{
    // Non-Visible Grid Implementation Registry:
    (<TU.NoRo<typeof Grid._Constructors>>Grid._Constructors)
    = Object.freeze({
        [ "EUCLID2" ]: Euclid2.Grid,
        [ "BEEHIVE" ]: Beehive.Grid,
    });
    Object.freeze(Grid);
    Object.freeze(Grid.prototype);
}
{
    const AP = ArtificialPlayer;
    (<TU.NoRo<typeof AP._Constructors>>AP._Constructors)
    = Object.freeze({
        CHASER: Chaser,
    });
    Object.freeze(AP);
    Object.freeze(AP.prototype);
}};