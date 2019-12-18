import { Pos } from "../../floor/Pos";
import { Game } from "../../Game";
import { Player } from "../Player";
import { ArtificialPlayer } from "../ArtificialPlayer";


/**
 * 
 * @extends ArtificialPlayer
 */
export namespace ArtificialPlayerTypes {

    export class Chaser extends ArtificialPlayer {

        public static readonly TEAM_NUMBER = -1;

        protected constructor(game: Game, desc: Player.CtorArgs) {
            super(game, desc);
        }

        /**
         * @override
         */
        protected computeDesiredDestination(): Pos {
            return undefined!; // this.game.allHumanPlayers; // TODO
        }

        /**
         * @override
         */
        protected computeNextMovementTimer(): number {
            return undefined!; // TODO
        }

    }

}
