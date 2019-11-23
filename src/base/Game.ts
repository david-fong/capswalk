import { Lang, LangCharSeqPair, EMPTY_CSP } from "src/Lang";
import { BalancingScheme } from "src/LangSeqTreeNode";
import { BarePos, Tile } from "src/base/Tile";
import { Grid } from "src/base/Grid";

import { PlayerId, Player } from "src/base/Player";
import { ArtificialPlayer } from "src/base/ArtificialPlayer";
import { OnlineHumanPlayer } from "src/client/OnlineHumanPlayer";
import { PlayerMovementEvent } from "src/base/PlayerMovementEvent";
import { Bubble } from "src/base/Bubble";

export { Grid } from "src/base/Grid";

/**
 * 
 * 
 * This class performs the majority of management over {@link Tile}
 * and {@link Player} objects. As a design choice, players can only join
 * a game before it starts, and actions such as changing the language or
 * difficulty require a restart. These actions that require a restart will
 * all be exposed to operators through a pre-game page. Other such actions
 * include: changing teams.
 * 
 * An overview of subclasses:
 * Both {@link ClientGame} and {@link OfflineGame} use {@link VisualTile}s
 * while {@link ServerGame} uses {@link ServerTile}s. {@link ClientGame}'s
 * record of the state of the game comes completely from {@link ServerGame}.
 * 
 * There are overlaps between what each implementation needs to do:
 * - Offline and Server games maintain and control the master-game-state.
 * - Offline and Client games display the game-state to an operator via browser and HTML.
 * - Client  and Server games use network operations to communicate.
 * 
 * @extends Grid
 */
export abstract class Game extends Grid {

    public lang: Lang;

    /**
     * Set to `undefined` for {@link ServerGame}
     * 
     * TODO: initialize this field in constructor.
     */
    public readonly operator: OnlineHumanPlayer;

    /**
     * Does not use the HumanPlayer type annotation. This is to
     * indicate that a `Game` does not explicitly care about the
     * unique properties of a {@link HumanPlayer} over a regular
     * {@link Player}.
     */
    private readonly allHumanPlayers: Array<Player>;

    private readonly allArtifPlayers: Array<ArtificialPlayer>;



    /**
     * TODO: change the player arrays to be constructor arguments. Not
     * sure about the aritifial players. But definitely the human ones.
     * 
     * _Does not call reset._
     * 
     * @override
     */
    public constructor(dimensions: { height: number, width?: number, }) {
        super(dimensions);

        // TODO: set default language (must be done before call to reset):
        this.lang = null;

        // TODO: setup allHumanPlayers?
        this.allHumanPlayers = [];
        this.allArtifPlayers = [];
    }

    /**
     * Reset the grid and the language hit-counters, performs language
     * sequence shuffle-ins, respawns players, and spawns in targets.
     * 
     * @override {@link Grid#reset}
     */
    public reset(): void {
        super.reset();

        // Reset hit-counters in the current language:
        // This must be done before shuffling so that the previous
        // history of shuffle-ins has no effects on the new pairs.
        this.lang.reset();

        // Shuffle everything:
        this.grid.forEach(row => row.forEach(tile => {
            this.shuffleLangCharSeqAt(tile);
        }, this), this);

        // TODO: reset and respawn players:
        this.allHumanPlayers.forEach(player => player.reset());
        this.allArtifPlayers.forEach(player => player.reset());

        // TODO: spawn targets:
        // While not necessary, this should be done after players have
        // spawned so targets do not spawn under players.
    }



    /**
     * Helper for {@link Game#processMoveRequest}. Does execute usage
     * of the returned values, which is expected to be done externally.
     * However, this method will nullify the existing values at `tile`.
     * 
     * @param tile - The {@link Tile} to shuffle their {@link LangChar}-
     *      {@link LangSeq} pair for.
     * @returns A {@link LangCharSeqPair} that can be used as a replacement
     *      for that currently being used by `tile`.
     */
    private shuffleLangCharSeqAt(tile: Tile): LangCharSeqPair {
        // Clear values for the target tile so its current (to-be-
        // previous) values don't get unnecessarily avoided.
        tile.setLangCharSeq(EMPTY_CSP);
        return this.lang.getNonConflictingChar(
            this.getNeighbouringTiles(tile.pos)
                .map(tile => tile.langSeq)
                .filter(seq => seq), // no falsy values.
            this.langBalancingScheme,
        );
    }

    /**
     * @see PlayerMovementEvent
     * 
     * Call for a {@link HumanPlayer} whose {@link HumanPlayer#seqBuffer}
     * should be that of the {@link Tile} at `dest`. Reject the request
     * by returning `null` if `dest` is occupied, or if the player
     * specified by the given id does not exist, or if the requester has
     * not yet received updates for the destination they requested to
     * move to, or the requester is still bubbling.
     * 
     * Does not actually make any modifications to any part of the game
     * state, and instead, delegates the execution of all necessitated
     * changes to {@link Game#processMoveExecute}.
     * 
     * Should never be called by {@link ClientGame}.
     * 
     * @param desc - A descriptor of the request, with fields indicating
     *      the requester's views of critical parts of the game-state
     *      from their copy of the game-state at the time of the request.
     * @returns A descriptor of changes to be made, or `null` if the
     *      request was rejected for any of the reasons stated above.
     */
    public processMoveRequest(desc: PlayerMovementEvent): PlayerMovementEvent | null {
        const player = this.getPlayerById(desc.playerId);
        if (!(player) || player.isBubbling) {
            // The specified player does not exist or is bubbling.
            return null;

        } else if (desc.lastAccpectedRequestId !== player.lastAcceptedRequestId) {
            throw new RangeError((desc.lastAccpectedRequestId < player.lastAcceptedRequestId)
                ? ("Clients should not make requests until they have"
                    + " received my response to their last request")
                : ("Client seems to have incremented the request ID"
                    + " counter on their own, which is is illegal")
            );
        }
        const dest: Tile = this.getBenchableTileAt(desc.destPos, desc.playerId);
        if (dest.isOccupied() ||
            dest.numTimesOccupied !== desc.destNumTimesOccupied) {
            // The check concerning the destination `Tile`'s occupancy
            // counter is not absolutely necessary. It does not enforce
            // stronger invariant-keeping consistency, but it does enforce
            // stronger client-experience consistency: they cannot move
            // somewhere where they have not realized the `LangSeq` has
            // changed.
            return null;
        }

        // Set response fields according to spec in `PlayerMovementEvent`:

        desc.lastAccpectedRequestId = (1 + player.lastAcceptedRequestId);
        desc.destNumTimesOccupied   = (1 + dest.numTimesOccupied);

        desc.playerScore = (player.score + dest.scoreValue);
        if (Bubble.computeTimerDuration(player) >= Bubble.MIN_TIMER_DURATION) {
            // This allows the player's stockpile to increase if its
            // original stockpile value is not such that its calculated
            // timer is outside the required range.
            desc.playerStockpile = (player.stockpile + dest.scoreValue);
        }

        if (dest !== player.benchTile) {
            // Don't change this value for bench tiles:
            desc.newCharSeqPair = this.shuffleLangCharSeqAt(dest);
        }

        // We are all go! Do it:
        this.processMoveExecute(desc);
        return desc;
    }

    /**
     * Update the {@link Game#grid}. Call either at the end of
     * {@link Game#processMoveRequest} if I am a {@link ServerGame} or
     * {@link OfflineGame}, or as an event callback if I am a
     * {@link ClientGame}.
     * 
     * Automatically lowers the {@link Player#requestInFlight} field
     * for the requesting `Player` if the arriving event description
     * is the newest one for the specified `Player`.
     * 
     * It is essential that for these implementations, this method is
     * not scheduled for later since it is the "write" stage of that
     * critical operation. If I am a {@link ServerGame}, also notify
     * all clients of the movement event.
     * 
     * Updates that are received after others that are more recent and
     * concern the same {@link Tile} are ignored. This is okay since
     * the only thing that matters about a {@link Tile} to the outside
     * world is its last known state.
     * 
     * @param desc - A descriptor for all changes mandated by the
     *      player-movement event.
     */
    public processMoveExecute(desc: PlayerMovementEvent): void {
        const dest: Tile = this.getBenchableTileAt(desc.destPos, desc.playerId);
        const player = this.getPlayerById(desc.playerId);

        const playerLagState = player.lastAcceptedRequestId - desc.lastAccpectedRequestId;
        if ((playerLagState < -1) ||
            (dest.numTimesOccupied > desc.destNumTimesOccupied)) {
            // We have received even more recent updates already. This update
            // arrived out of order. The `Tile` occupancy counter should still
            // be updated if increasing, which will happen if this is an older
            // player movement. The rest of the event's effects can be ignored
            // as move operations for `Player`s are transitive in nature.
            if (dest.numTimesOccupied < desc.destNumTimesOccupied) {
                dest.numTimesOccupied = desc.destNumTimesOccupied;
            }
            return;
        }
        // Okay, we either got accepted or rejected now.
        player.requestInFlight = false;

        // If using relative values (which we are not), then this
        // should happen regardless of the order of receipt. These
        // values are currently never modified unless the request
        // succeeds, so they could technically go in the "else if"
        // block.
        player.score = desc.playerScore;
        player.stockpile = desc.playerStockpile;

        if (playerLagState === 0) {
            // The request was rejected by the Game Manager.
            return;

        } else if (playerLagState === -1) {
            // The `LangCharSeqPair` shuffle changes must take effect
            // before moving the player. See the spec for `#moveTo`.
            dest.setLangCharSeq(desc.newCharSeqPair);
            player.moveTo(dest);
            player.lastAcceptedRequestId = desc.lastAccpectedRequestId;
            dest.numTimesOccupied = desc.destNumTimesOccupied;

        } else {
            throw new RangeError("client seems to have tampered with their request counter");
        }
    }



    /**
     * @see Bubble.MakeEvent
     * 
     * @param desc - 
     * @returns todo
     */
    public processBubbleMakeRequest(desc: Bubble.MakeEvent): Bubble.MakeEvent {
        // TODO:
        // if successful, make sure to modify the score and stockpile fields.
        // make abstract method for player to trigger this event.
        // override to throw error in ClientGame.
        // make sure to use Math.max(Bubble.MIN_TIMER_VALUE, <bubbleTimerDuration>)
        return undefined;
    }

    public processBubbleMakeExecute(desc: Bubble.MakeEvent): void {
        // Note: We do not need to raise the "isBubbling" flag for the
        // player; doing that is their responsibility on the client-side.

        // TODO:
        // make the server game override this to also broadcast
        //   changes to all clients.
        ;
    }

    public processBubblePopExecute(desc: Bubble.PopEvent): Bubble.PopEvent {
        // TODO:
        // make sure to lower "isBubbling" flag for the player.
        // make the server game override this to also broadcast
        //   changes to all clients.
        ;
        return undefined;
    }



    public getBenchableTileAt(dest: BarePos, playerId: PlayerId): Tile {
        return ((Player.BENCH_POS.equals(dest))
            ? this.getPlayerById(playerId).benchTile
            : this.getTileAt(dest)
        );
    }

    /**
     * 
     * @param playerId - 
     * @returns `null` if the specified `playerId` is not allocated
     *      to any {@link Player} in this `Game`.
     */
    protected getPlayerById(playerId: PlayerId): Player | null {
        if (playerId === 0) {
            throw new RangeError("zero is reserved to mean \"no player\"");
        }
        const player: Player = ((playerId < 0)
            ? this.allArtifPlayers[(-playerId) - 1]
            : this.allHumanPlayers[( playerId) - 1]
        );
        return (player) ? player : null;
    }

    protected get langBalancingScheme(): BalancingScheme {
        // TODO
        //return this.settings.langBalancingScheme.selectedValue;
        return undefined;
    }

}



/**
 * TODO: move this class to its own file.
 */
export class GameStateDump {

    public static readonly EVENT_NAME = "dump game state";

    public constructor(game: Game) {
        ;
    }
}
