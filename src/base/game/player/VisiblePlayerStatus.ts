import { OmHooks } from "browser/OmHooks";
import type { Coord, Tile } from "floor/Tile";
import type { Player } from "./Player";

import { PlayerStatus } from "./PlayerStatus";


export class VisiblePlayerStatus<S extends Coord.System> extends PlayerStatus<S> {

    readonly #baseElem: HTMLElement;

    private readonly __immigrantInfoCache: Tile.VisibleImmigrantInfo;


    public constructor(player: Player<S>, noCheckGameOver: boolean) {
        super(player, noCheckGameOver);
        {
            const baseElem = document.createElement("div");
            baseElem.classList.add(OmHooks.Player.Class.BASE);
            this.#baseElem = baseElem;
        } {
            // Setup downedOverlay element:
            const dOverlayElem = document.createElement("div");
            dOverlayElem.classList.add(OmHooks.Player.Class.DOWNED_OVERLAY);
            this.#baseElem.appendChild(dOverlayElem);
        }
    }

    /**
     * @override
     */
    public __afterAllPlayersConstruction(): void {
        const player = this.player;
        const operator = this.player.game.operator!;
        if (!operator) {
            // This _would_ be the case if we did it in the constructor
            // where `this.player.game.operator` has not been defined yet.
            throw new Error("this never happens. see comment in source.");
        }
        this.#baseElem.dataset[OmHooks.Player.Dataset.FACE_SWATCH]
        = (player === operator) ? "me"
        : (player.teamId === operator.teamId) ? "teammate" : "opponent";

        // Setup spotlight element:
        if (player === operator) {
            const spotlightElem = document.createElement("div");
            spotlightElem.classList.add(OmHooks.Player.Class.SPOTLIGHT);
            this.#baseElem.appendChild(spotlightElem);
        }
        (this.__immigrantInfoCache as Tile.VisibleImmigrantInfo) = Object.freeze({
            playerElem: this.#baseElem,
            username: player.username,
        });
    }

    public get immigrantInfo(): Tile.VisibleImmigrantInfo {
        return this.__immigrantInfoCache;
    }


    public set score(newValue: Player.Health) {
        super.score = newValue;
    }

    public set health(newHealth: Player.Health) {
        const oldIsDowned = this.isDowned;
        super.health = newHealth;

        if (oldIsDowned !== this.isDowned) {
            // CSS integration for Player.isDowned rendering.
            const dataDowned = OmHooks.Player.Dataset.DOWNED;
            if (this.isDowned) {
                if (this.player.team.elimOrder) {
                    this.#baseElem.dataset[dataDowned] = "team";
                } else {
                    this.#baseElem.dataset[dataDowned] = "self";
                }
            } else {this.#baseElem.dataset[dataDowned] = "no"; }
        }
    }
}
Object.freeze(VisiblePlayerStatus);
Object.freeze(VisiblePlayerStatus.prototype);
