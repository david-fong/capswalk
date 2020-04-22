import { OmHooks } from "browser/OmHooks";
import type { Coord } from "floor/Tile";
import type { Player } from "./Player";
import { OperatorPlayer } from "./OperatorPlayer";
import { PlayerStatus } from "./PlayerStatus";
import { Team } from "game/player/Team";


// TODO.impl make the overridden setters modify the HTML elements to
// visually indicate the changes.
export class VisiblePlayerStatus<S extends Coord.System> extends PlayerStatus<S> {

    declare public readonly baseElem: HTMLDivElement;


    public constructor(player: Player<S>, noCheckGameOver: boolean) {
        super(player, noCheckGameOver);
        {
            const baseElem = document.createElement("div");
            baseElem.classList.add(
                OmHooks.Player.Class.BASE,
                OmHooks.General.Class.FILL_PARENT,
            );
            this.baseElem = baseElem;
        } {
            if (this.player instanceof OperatorPlayer) {
                const spotlightElem = document.createElement("div");
                spotlightElem.classList.add(
                    OmHooks.Grid.Class.SPOTLIGHT,
                );
                this.baseElem.appendChild(spotlightElem);
            }
        } {
            // Setup downedOverlay element:
            const dOverlayElem = document.createElement("div");
            dOverlayElem.classList.add(
                OmHooks.Player.Class.DOWNED_OVERLAY,
                OmHooks.General.Class.FILL_PARENT,
            );
            this.baseElem.appendChild(dOverlayElem);
        }
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
                    this.baseElem.dataset[dataDowned] = "team";
                } else {
                    this.baseElem.dataset[dataDowned] = "self";
                }
            } else {this.baseElem.dataset[dataDowned] = "no"; }
        }
    }

}
export namespace VisiblePlayerStatus {
    /**
     * This must be called once after all teams are constructed.
     * @param teams -
     * @param operator
     * A reference to the operator player. Used to determine colouring.
     */
    export function colourizeTeamMembers<S extends Coord.System>(
        teams: TU.RoArr<Team<S>>,
        operator: OperatorPlayer<S>,
    ): void {
        for (const team of teams) {
            for (const member of team.members) {
                (member.status as VisiblePlayerStatus<S>)
                .baseElem.dataset[OmHooks.Player.Dataset.FACE_SWATCH]
                = (member === operator) ? "me"
                : (member.teamId === operator.teamId) ? "teammate" : "opponent";
            }
        }
    }
}
Object.freeze(VisiblePlayerStatus);
Object.freeze(VisiblePlayerStatus.prototype);
