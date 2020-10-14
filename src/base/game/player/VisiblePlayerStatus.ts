import { JsUtils } from "defs/JsUtils";
import { OmHooks } from "defs/OmHooks";
import { SCROLL_INTO_CENTER } from "defs/TypeDefs";
import type { Coord, Tile } from "floor/Tile";
import type { Player } from "./Player";
import type { OperatorPlayer } from "game/player/OperatorPlayer";

import { PlayerStatus } from "./PlayerStatus";


/**
 *
 */
export class VisiblePlayerStatus<S extends Coord.System> extends PlayerStatus<S> {

    readonly #baseElem: HTMLElement;
    readonly #vBellAnims: Animation[];

    readonly #immigrantInfoCache: Tile.VisibleImmigrantInfo;


    public constructor(player: Player<S>, noCheckGameOver: boolean) {
        super(player, noCheckGameOver);
        {
            const baseElem
                = this.#baseElem
                = document.createElement("div");
            baseElem.classList.add(
                OmHooks.General.Class.CENTER_CONTENTS,
                OmHooks.General.Class.STACK_CONTENTS,
                OmHooks.Player.Class.BASE,
            );
        } {
            // Setup face element:
            const faceElem = document.createElement("div");
            faceElem.classList.add(OmHooks.Player.Class.FACE);
            const vBellAnims
            = this.#vBellAnims
            = (this.player.isALocalOperator) ? [
                // Note the 1-millisecond start delays required to
                // pause the animations before they start auto-playing.
                faceElem.animate({
                    filter: ["brightness(0.7)", "brightness(1.0)",],
                },{ duration: 300, easing: "ease-in", delay: 1, }),
                faceElem.animate({
                    transform: VisiblePlayerStatus.makeWiggleAnimation(10, 2),
                },{ duration: 270, easing: "ease-out", delay: 1, }),
            ] : [];
            vBellAnims.forEach((anim) => anim.pause());
            {
                // Setup downedOverlay element:
                const dOverlayElem = document.createElement("div");
                dOverlayElem.classList.add(OmHooks.Player.Class.DOWNED_OVERLAY);
                faceElem.appendChild(dOverlayElem);
            }
            this.#baseElem.appendChild(faceElem);
        }
    }

    /**
     * @override
     */
    public _afterAllPlayersConstruction(): void {
        // @ts-expect-error : RO=
        this.#immigrantInfoCache = Object.freeze({
            playerElem: this.#baseElem,
            username: this.player.username,
        });
    }

    public reset(): void {
        super.reset();
        const DDH = OmHooks.Player.Dataset.DOWNED;
        this.#baseElem.dataset[DDH.KEY] = DDH.VALUES.NO;
        // ^We need to do this explicitly. It won't be done
        // automatically when setting `health` because of the short-
        // circuit=optimization made when `isDowned` hasn't changed.
    }

    public get immigrantInfo(): Tile.VisibleImmigrantInfo {
        return this.#immigrantInfoCache;
    }

    public _notifyWillBecomeCurrent(spotlightElems: TU.RoArr<HTMLElement>): void {
        const currOperator = this.player.game.currentOperator;
        const nextOperator = this.player as OperatorPlayer<S>;
        requestAnimationFrame((time) => {
            spotlightElems.forEach((elem) => {
                this.#baseElem.appendChild(elem);
            });
            nextOperator.status.immigrantInfo.playerElem.scrollIntoView(SCROLL_INTO_CENTER);
        });
        if (nextOperator.teamId !== currOperator?.teamId) {
            // Must use the above nullish coalesce operator for first call to setCurrentOperator.
            nextOperator.game.players.forEach((otherPlayer) => {
                const isTeammate = (otherPlayer.teamId === nextOperator.teamId);
                (otherPlayer.status as VisiblePlayerStatus<S>).#baseElem.dataset[OmHooks.Player.Dataset.FACE_SWATCH]
                    = (otherPlayer.isALocalOperator) ? (isTeammate ? "me" : "meOppo")
                    : isTeammate ? "teammate" : "opponent";
                ;
            });
        }
    }

    public visualBell(): void {
        if (!this.#vBellAnims) {
        }
        window.requestAnimationFrame((time) => {
            this.#vBellAnims.forEach((anim) => anim.play());
        });
    }


    public get health(): Player.Health {
        return super.health;
    }
    public set health(newHealth: Player.Health) {
        const oldIsDowned = this.isDowned;
        super.health = newHealth;

        if (oldIsDowned !== this.isDowned) {
            // CSS integration for Player.isDowned rendering.
            const DDH = OmHooks.Player.Dataset.DOWNED;
            this.#baseElem.dataset[DDH.KEY] = (this.isDowned)
                ? ((this.player.team.elimOrder)
                    ? DDH.VALUES.TEAM
                    : DDH.VALUES.SELF
                ) : DDH.VALUES.NO;
        }
    }
}
export namespace VisiblePlayerStatus {
    export function makeWiggleAnimation(pctX: number, numWiggles: number): string[] {
        const arr = Array(numWiggles * 2).fill(pctX);
        arr.unshift(0); arr.push(0);
        return arr.map((n,i) => `translate(${(i%2)?n:-n}%)`);
    }

    /**
     * Append the base element to the players bar in the play-screen.
     * This is internally managed by the VisiblePlayerStatus class.
     */
    // TODO.impl Give each VisiblePlayerStatus one and update it within VisiblePlayerStatus' setters.
    export class Card {
        public readonly baseElem: HTMLElement;
        readonly #nameElem:  HTMLElement;
        readonly #scoreElem: HTMLElement;
        readonly #teamElem:  HTMLElement;

        public constructor(playerName: Player.Username) {
            this.baseElem = document.createElement("div");
            this.baseElem.setAttribute("label", "Player");

            this.#nameElem = document.createElement("div");
            const name = this.#nameElem;
            name.textContent = playerName;
            this.baseElem.appendChild(name);
        }
    }
}
JsUtils.protoNoEnum(VisiblePlayerStatus, ["_afterAllPlayersConstruction"]);
Object.freeze(VisiblePlayerStatus);
Object.freeze(VisiblePlayerStatus.prototype);