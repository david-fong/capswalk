import { Grid } from "floor/Grid";
import { WrappedEuclid2 } from "floor/impl/Euclid2/System";
import { Beehive } from "floor/impl/Beehive/System";

import { ArtificialPlayer } from "../player/ArtificialPlayer";
import { Chaser } from "../player/artificials/Chaser";

export default (): void => {{
	// Non-Visible Grid Implementation Registry:
	Object.freeze(Object.assign(Grid._Constructors, <typeof Grid._Constructors>{
		["W_EUCLID2"]: WrappedEuclid2.Grid,
		["BEEHIVE"]: Beehive.Grid,
	}));
	Object.freeze(Grid);
}{
	const AP = ArtificialPlayer;
	Object.freeze(Object.assign(AP._Constructors, <typeof AP._Constructors>{
		["CHASER"]: Chaser,
	}));
	Object.freeze(AP);
}};