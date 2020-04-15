import { WebHooks } from "../../../webui/WebHooks";
import type { Coord } from "floor/Tile";
import type { Player } from "./Player";
import type { OperatorPlayer } from "./OperatorPlayer";
import { PlayerStatus } from "./PlayerStatus";
import { Team } from "game/player/Team";


// TODO.impl make the overridden setters modify the HTML elements to
// visually indicate the changes.
export class VisiblePlayerStatus<S extends Coord.System> extends PlayerStatus<S> {

    /**
     * @override
     */
    declare protected readonly player: OperatorPlayer<S>;

    public readonly playerDivElem: HTMLDivElement;


    public constructor(player: Player<S>, noCheckGameOver: boolean) {
        super(player, noCheckGameOver);
        {
            // TODO.design create a spotlight mask using the below CSS properties:
            // https://developer.mozilla.org/en-US/docs/Web/CSS/mix-blend-mode
            const pDiv = document.createElement("div");
            const operator = this.player.game.operator;
            pDiv.classList.add(
                WebHooks.Player.Class.BASE,
                WebHooks.General.Class.FILL_PARENT,
            );
            this.playerDivElem = pDiv;
        } {
            // Setup downedOverlay element:
            const doDiv = document.createElement("div");
            doDiv.classList.add(
                WebHooks.Player.Class.DOWNED_OVERLAY,
                WebHooks.General.Class.FILL_PARENT,
            );
            this.playerDivElem.appendChild(doDiv);
        }
    }


    public set score(newValue: Player.Health) {
        super.score = newValue;
    }

    public set health(newHealth: Player.Health) {
        super.health = newHealth;

        // CSS integration for Player.isDowned rendering.
        const dataDowned = WebHooks.Player.Dataset.DOWNED;
        if (this.isDowned) {
            if (this.player.team.elimOrder) {
                this.playerDivElem.dataset[dataDowned] = "team";
            } else {
                this.playerDivElem.dataset[dataDowned] = "self";
            }
        } else {this.playerDivElem.dataset[dataDowned] = "no"; }
    }

}
export namespace VisiblePlayerStatus {
    /**
     * This must be called once after all teams are constructed.
     * @param teams -
     */
    export function colourizeTeamMembers<S extends Coord.System>(
        teams: TU.RoArr<Team<S>>,
        operator: OperatorPlayer<S>,
    ): void {
        for (const team of teams) {
            for (const member of team.members) {
                (member.status as VisiblePlayerStatus<S>)
                .playerDivElem.dataset[WebHooks.Player.Dataset.FACE_SWATCH]
                = (member === operator) ? "me"
                : (member.teamId === operator.teamId) ? "teammate" : "opponent";
            }
        }
    }
}
Object.freeze(VisiblePlayerStatus);
Object.freeze(VisiblePlayerStatus.prototype);
