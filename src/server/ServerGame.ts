import { Events } from "src/Events";
import { ServerTile } from "src/server/ServerTile";
import { Game } from "src/base/Game";
import { GroupSession } from "src/server/GroupSession";
import { PlayerMovementEvent } from "src/base/Player";

/**
 * 
 * 
 * @extends Game
 */
export class ServerGame extends Game {

    protected readonly session: GroupSession;

    public constructor(
        session: GroupSession,
        height: number,
        width: number = height
    ) {
        super(height, width);

        this.reset();
    }

    /**
     * @override
     */
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
     */
    public processMoveRequest(desc: PlayerMovementEvent): PlayerMovementEvent | null {
        desc = super.processMoveRequest(desc);
        if (desc !== null) {
            // Request was accepted:
            this.session.namespace.emit(
                Events.PlayerMovement.name,
                desc,
            );
        }
        return desc;
    }

}
