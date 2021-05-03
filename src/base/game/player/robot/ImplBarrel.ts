import type { GameMirror } from ":game/gameparts/GameMirror";
import type { Player } from "../Player";
import type { RobotPlayer } from "./RobotPlayer";
import { Chaser } from "./impl/Chaser";

const Dict: {
	readonly [ F in Player.RobotFamily ]: {
		new(
			game: GameMirror,
			desc: Player._CtorArgs[F]
		): RobotPlayer;
	};
} = {
	[ "Chaser" ]: Chaser,
};

/** */
export function GetRobotImpl(
	game: GameMirror,
	playerDesc: Player._CtorArgs[Player.RobotFamily],
): RobotPlayer {
	const familyId = playerDesc.familyId as Player.RobotFamily;
	if (DEF.DevAssert) {
		// Enforced By: Caller adherence to contract.
		if (!Object.getOwnPropertyNames(Dict).includes(familyId)) {
			throw new RangeError(familyId + " is not a valid robot player family id.");
		}
	}
	return new (Dict[familyId])(game, playerDesc);
}