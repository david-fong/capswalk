import { OmHooks } from "defs/OmHooks";
import { AllSkScreens } from "./screen/AllSkScreens";


/**
 *
 */
export class TopLevel {

    /**
     * Purposely made private. Screens are intended to navigate
     * between each other without reference to this field.
     */
    private readonly allScreens: AllSkScreens;

    /**
     * This is managed by the `GroupJoiner` screen.
     */
    public socket: typeof io.Socket | undefined;

    #socketIoChunk: Promise<typeof import("socket.io-client")>;


    public constructor() {
        const allScreensElem = document.getElementById(OmHooks.Screen.Id.ALL_SCREENS);
        if (!allScreensElem) { throw new Error; }
        this.allScreens = new AllSkScreens(this, allScreensElem);
    }

    public get socketIo(): Promise<typeof import("socket.io-client")> {
        return this.#socketIoChunk
        || (this.#socketIoChunk = import(
            /* webpackChunkName: "[request]" */
            "socket.io-client"
        ));
    }
}
export namespace TopLevel {
}
Object.freeze(TopLevel);
Object.freeze(TopLevel.prototype);
