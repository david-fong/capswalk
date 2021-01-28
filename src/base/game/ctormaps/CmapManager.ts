import { Grid } from "floor/Grid";
import { WrappedEuclid2 } from "floor/impl/Euclid2/System";
import { Beehive } from "floor/impl/Beehive/System";

import { RobotPlayer } from "game/player/RobotPlayer";
import { Chaser } from "game/player/robots/Chaser";

export default (): void => {{
	// Non-Visible Grid Implementation Registry:
	Object.freeze(Object.assign(Grid._Constructors, <typeof Grid._Constructors>{
		["W_EUCLID2"]: WrappedEuclid2.Grid,
		["BEEHIVE"]: Beehive.Grid,
	}));
	Object.freeze(Grid);
}{
	const Robot = RobotPlayer;
	Object.freeze(Object.assign(Robot._Constructors, <typeof Robot._Constructors>{
		["CHASER"]: Chaser,
	}));
	Object.freeze(Robot);
}};