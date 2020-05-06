import { OmHooks } from "defs/OmHooks";
import type { Coord, Tile } from "floor/Tile";
import type { Player } from "./Player";

import { PlayerStatus } from "./PlayerStatus";


/**
 *
 */
export class VisiblePlayerStatus<S extends Coord.System> extends PlayerStatus<S> {

    readonly #baseElem: HTMLElement;
    readonly #visualBellAnimations: Animation[];

    private readonly __immigrantInfoCache: Tile.VisibleImmigrantInfo;


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
            const anims = this.#visualBellAnimations = (this.player.isALocalOperator) ? [
                faceElem.animate({
                    filter: ["brightness(0.7)", "brightness(1.0)",],
                },{ duration: 300, easing: "ease-in", }),
                faceElem.animate({
                    transform: VisiblePlayerStatus.makeWiggleAnimation(10, 2),
                },{ duration: 270, easing: "ease-out", }),
            ] : [];
            // anims.forEach((anim) => anim.pause());
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
    public __afterAllPlayersConstruction(): void {
        const player = this.player;
        const operatorTeamId = this.player.game.operators[0].teamId;
        this.#baseElem.dataset[OmHooks.Player.Dataset.FACE_SWATCH]
        = (player.isALocalOperator) ? "me"
        : (player.teamId === operatorTeamId) ? "teammate" : "opponent";

        (this.__immigrantInfoCache as Tile.VisibleImmigrantInfo) = Object.freeze({
            playerElem: this.#baseElem,
            username: player.username,
        });
    }

    public reset(): void {
        super.reset();
        const DDH = OmHooks.Player.Dataset.DOWNED
        this.#baseElem.dataset[DDH.KEY] = DDH.VALUES.NO;
        // ^We need to do this explicitly. It won't be done
        // automatically when setting `health` because of the short-
        // circuit=optimization made when `isDowned` hasn't changed.
    }

    public get immigrantInfo(): Tile.VisibleImmigrantInfo {
        return this.__immigrantInfoCache;
    }

    public __notifyBecomeCurrent(spotlightElems: TU.RoArr<HTMLElement>): void {
        spotlightElems.forEach((elem) => {
            this.#baseElem.appendChild(elem);
        });
    }

    public visualBell(): void {
        window.requestAnimationFrame((time) => {
            this.#visualBellAnimations.forEach((anim) => anim.play());
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
}
Object.freeze(VisiblePlayerStatus);
Object.freeze(VisiblePlayerStatus.prototype);
