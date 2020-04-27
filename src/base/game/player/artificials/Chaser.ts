import type { Coord, Tile } from "floor/Tile";
import type { GameManager } from "game/__gameparts/Manager";

import { Player } from "game/player/Player";
import { ArtificialPlayer } from "../ArtificialPlayer";


/**
 *
 * @extends ArtificialPlayer
 */
// TODO.impl
export class Chaser<S extends Coord.System> extends ArtificialPlayer<S> {

    private readonly threatProximity: Array<Player<S>>;
    private readonly targetProximity: Array<Player<S>>;

    private readonly behaviour: Chaser.Behaviour;

    protected constructor(game: GameManager<any,S>, desc: Player.CtorArgs) {
        super(game, desc);
    }

    public __afterAllPlayersConstruction(): void {
        super.__afterAllPlayersConstruction();
        // We need to cast off read-only-ness below.
        (this.threatProximity as Array<Player<S>>) = this.game.teams
            .filter((team) => team.id !== this.teamId)
            .flatMap((team) => team.members);
        (this.threatProximity as Array<Player<S>>) = this.threatProximity.slice();
    }

    protected computeDesiredDestination(): Coord<S> {
        // Check if there is anyone to run away from:
        this.threatProximity.sort((pa,pb) => {
            return this.game.grid.minMovesFromTo(pa.coord, this.coord)
                -  this.game.grid.minMovesFromTo(pb.coord, this.coord);
        });
        for (const threatP of this.threatProximity) {
            if (this.game.grid.minMovesFromTo(threatP.coord, this.coord)
                > this.behaviour.fearDistance) break;
            if (threatP.status.isDowned) continue;
            if (threatP.status.health > this.status.health) {
                return this.game.grid.getUntAwayFrom(this.coord, threatP.coord).coord;
            }
        }
        // If there is nobody to run away from,
        // Check if there is anyone we want to attack:
        this.targetProximity.sort((pa,pb) => {
            return this.game.grid.minMovesFromTo(this.coord, pa.coord)
                -  this.game.grid.minMovesFromTo(this.coord, pb.coord);
        });
        if (this.status.isDowned) {
        for (const targetP of this.targetProximity) {
            if (this.game.grid.minMovesFromTo(this.coord, targetP.coord)
                > this.behaviour.bloodThirstDistance) break;
            if (targetP.status.health < this.status.health - this.behaviour.healthReserve) {
                return this.game.grid.getUntToward(this.coord, targetP.coord).coord;
            }
        } }
        // If there is nobody we want to chase after to attack,
        // Head toward the nearest free health if it exists.
        if (this.game.freeHealthTiles.size === 0) {
            return this.game.grid.getRandomCoord();
        }
        let closestFht: Tile<S> = this.game.freeHealthTiles[0];
        let closestFhtDistance = Infinity;
        for (const fht of this.game.freeHealthTiles) {
            const distance = this.game.grid.minMovesFromTo(this.coord, fht.coord);
            if (distance < closestFhtDistance) {
                closestFht = fht;
                closestFhtDistance = distance;
            }
        }
        return this.game.grid.getUntToward(this.coord, closestFht.coord).coord;
    }

    protected getNextMoveType(): Player.MoveType {
        return Player.MoveType.NORMAL;
    }

    /**
     * @override
     */
    protected computeNextMovementTimer(): number {
        return undefined!;
    }
}
export namespace Chaser {
    /**
     *
     */
    export type Behaviour = Readonly<{
        /**
         * If the number of moves it would take for an opponent with
         * more health than this player to reach this player is less
         * than or equal to this value, then this player will try to
         * run away to safety.
         */
        fearDistance: number;
        /**
         * If the number of moves it would take for this player to reach
         * an opponent with less health is greater than this value,
         * this player will not even consider pursuing them in attack.
         */
        bloodThirstDistance: number;
        /**
         * The minimum amount of leftover health this player would try
         * to ensure having before going after an opponent. Negative
         * values are allowed, in which case, the player will go after
         * opponents even if they would end up being downed as a result.
         */
        healthReserve: number;
    }>;
}
Object.freeze(Chaser);
Object.freeze(Chaser.prototype);
