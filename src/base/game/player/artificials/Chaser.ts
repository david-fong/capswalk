import type { Coord, Tile } from "floor/Tile";
import type { GamepartManager } from "game/gameparts/GamepartManager";

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

    private readonly grid: Chaser<S>["game"]["grid"];
    #prevCoord: Coord<S>;

    public constructor(game: GamepartManager<any,S>, desc: Player._CtorArgs<"CHASER">) {
        super(game, desc);
        this.behaviour = Object.freeze(desc.familyArgs);
        this.grid = this.game.grid;
    }

    public _afterAllPlayersConstruction(): void {
        super._afterAllPlayersConstruction();
        // We need to cast off read-only-ness below.
        (this.threatProximity as Array<Player<S>>) = this.game.teams
            .filter((team) => team.id !== this.teamId)
            .flatMap((team) => team.members);

        (this.targetProximity as Array<Player<S>>) = this.threatProximity.slice();
    }

    public reset(spawnTile: Tile<S>): void {
        super.reset(spawnTile);
        this.#prevCoord = this.coord;
    }

    public moveTo(dest: Tile<S>): void {
        this.#prevCoord = this.coord;
        super.moveTo(dest);
    }

    protected computeDesiredDestination(): Coord<S> {
        // Check if there is anyone to run away from:
        this.threatProximity.sort((pa,pb) => {
            return this.grid.minMovesFromTo(pa.coord, this.coord)
                -  this.grid.minMovesFromTo(pb.coord, this.coord);
        });
        for (const threatP of this.threatProximity) {
            if (this.grid.minMovesFromTo(threatP.coord, this.coord)
                > this.behaviour.fearDistance) break;
            if (threatP.status.isDowned) continue;
            if (threatP.status.health > this.status.health) {
                // TODO.design Something that avoids getting cornered.
                return this.grid.getUntAwayFrom(this.coord, threatP.coord).coord;
            }
        }
        // If there is nobody to run away from,
        // Check if there is anyone we want to attack:
        this.targetProximity.sort((pa,pb) => {
            return this.grid.minMovesFromTo(this.coord, pa.coord)
                -  this.grid.minMovesFromTo(this.coord, pb.coord);
        });
        if (this.status.isDowned) {
        for (const targetP of this.targetProximity) {
            if (this.grid.minMovesFromTo(this.coord, targetP.coord)
                > this.behaviour.bloodThirstDistance) break;
            if (targetP.status.health < this.status.health - this.behaviour.healthReserve) {
                return targetP.coord;
            }
        } }
        // If there is nobody we want to chase after to attack,
        // Head toward the nearest free health if it exists.
        if (this.game.freeHealthTiles.size === 0) {
            // No tiles close by. Wander around:
            const chanceOfBigDirectionChange = 0.2;
            if (Math.random() < chanceOfBigDirectionChange) {
                // Big direction change:
                return this.grid.getRandomCoordAround(this.coord, 3);
            } else {
                // Continue wandering with a subtle, random direction:
                return this.grid.getRandomCoordAround(this.grid.getUntAwayFrom(
                    this.grid.getUntAwayFrom(this.coord, this.#prevCoord).coord,
                this.#prevCoord).coord, 1);
            }
        }
        let closestFht: Tile<S> = undefined!;
        let closestFhtDistance = Infinity;
        for (const fht of this.game.freeHealthTiles) {
            const distance = this.grid.minMovesFromTo(this.coord, fht.coord);
            if (distance < closestFhtDistance) {
                closestFht = fht;
                closestFhtDistance = distance;
            }
        }
        return closestFht.coord;
    }

    protected getNextMoveType(): Player.MoveType {
        return Player.MoveType.NORMAL;
    }

    protected computeNextMovementTimer(): number {
        return 1000 / this.behaviour.movesPerSecond;
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
        /**
         * How often this player moves in units of moves-per-second.
         */
        movesPerSecond: number;
    }>;
}
Object.freeze(Chaser);
Object.freeze(Chaser.prototype);
