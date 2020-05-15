import { OmHooks } from "defs/OmHooks";
import { AllSkScreens } from "./screen/AllSkScreens";


/**
 *
 */
export class TopLevel {

    public readonly webpageHostType: TopLevel.WebpageHostType;

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
        this.webpageHostType = (() => {
            if (window.location.origin.match(/github\.io/)) {
                return TopLevel.WebpageHostType.GITHUB;
            } else if (window.location.protocol.startsWith("file")) {
                return TopLevel.WebpageHostType.FILESYSTEM;
            } else {
                return TopLevel.WebpageHostType.LAN_SERVER;
            }
        })();
        console.log("%c🩺 welcome! 🐍", "font:700 2.3em /1.5 monospace;"
        + " margin:0.4em; border:0.3em solid black;padding:0.4em;"
        + " color:white; background-color:#3f5e77; border-radius:0.7em; ");
    }

    public get socketIo(): Promise<typeof import("socket.io-client")> {
        // return this.#socketIoChunk
        // || (this.#socketIoChunk = import(
        //     /* webpackChunkName: "[request]" */
        //     "socket.io-client"
        // ));
        return new Promise<typeof import("socket.io-client")>((resolve, reject): void => {
            const script = document.getElementById("socket.io")!;
            if (io) return resolve(io);
            script.onload = () => {
                resolve(io);
            };
        });
    }
}
export namespace TopLevel {
    export const enum WebpageHostType {
        GITHUB      = "github",
        FILESYSTEM  = "filesystem",
        LAN_SERVER  = "lan-server",
    }
}
Object.freeze(TopLevel);
Object.freeze(TopLevel.prototype);
