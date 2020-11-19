import { Grid } from "floor/Grid";
import { Euclid2 } from "floor/impl/Euclid2/System";
import { Beehive } from "floor/impl/Beehive/System";

import { ArtificialPlayer } from "../player/ArtificialPlayer";
import { Chaser } from "../player/artificials/Chaser";

export default (): void => {{
	// Non-Visible Grid Implementation Registry:
	// @ts-expect-error : RO=
	Grid._Constructors
	= Object.freeze<typeof Grid._Constructors>({
		["EUCLID2"]: Euclid2.Grid,
		["BEEHIVE"]: Beehive.Grid,
	});
	Object.freeze(Grid);
	Object.freeze(Grid.prototype);
}{
	const AP = ArtificialPlayer;
	// @ts-expect-error : RO=
	AP._Constructors
	= Object.freeze<typeof AP._Constructors>({
		["CHASER"]: Chaser,
	});
	Object.freeze(AP);
	Object.freeze(AP.prototype);
}};