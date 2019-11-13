import { BarePos } from "src/Pos";
import { ServerTile } from "src/server/ServerTile";
import { Game, PlayerMovementEvent } from "src/base/Game";
import { GroupSession } from "src/server/GroupSession";
import { Events } from "src/Events";

/**
 * 
 * 
 * @extends Game
 */
export class ServerGame extends Game {

    protected readonly session: GroupSession;

    public constructor(session: GroupSession, height: number, width: number = height) {
        super(height, width);

        this.reset();
    }

    public reset(): void {
        super.reset();
    }

    /**
     * @override {@link Grid#createTile}
     */
    public createTile(x: number, y: number): ServerTile {
        return new ServerTile(x, y);
    }



    /**
     * @override {@link Game#processMoveRequest}
     * 
     * @param playerId - 
     * @param destPos - 
     */
    public processMoveRequest(playerId: number, destPos: BarePos): PlayerMovementEvent | null {
        const desc: PlayerMovementEvent = super.processMoveRequest(playerId, destPos);
        if (desc !== null) {
            this.session.namespace.emit(
                Events.PlayerMovement.name,
                desc,
            );
        }
        return desc;
    }

}
