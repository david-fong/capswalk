import { OmHooks }      from "defs/OmHooks";
import { AllSkScreens } from "./screen/AllSkScreens";
import { BgMusic }      from "./audio/BgMusic";
import { SoundEffects } from "./audio/SoundEffects";


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

    public readonly bgMusic: BgMusic;
    public readonly sfx: SoundEffects;

    /**
     * This is managed by the `GroupJoiner` screen.
     */
    public socket: typeof io.Socket | undefined;

    #socketIoChunk: Promise<typeof import("socket.io-client")>;


    public constructor() {
        this.webpageHostType = (() => {
            if (window.location.origin.match(/github\.io/)) {
                return TopLevel.WebpageHostType.GITHUB;
            } else if (window.location.protocol.startsWith("file")) {
                return TopLevel.WebpageHostType.FILESYSTEM;
            } else {
                return TopLevel.WebpageHostType.SNAKEY_SERVER;
            }
        })();
        //
        const allScreensElem = document.getElementById(OmHooks.Screen.Id.ALL_SCREENS);
        if (!allScreensElem) { throw new Error; }
        this.allScreens = new AllSkScreens(this, allScreensElem);

        //
        // this.bgMusic = new BgMusic(BgMusic.TrackDescs[0].id);
        // this.sfx = new SoundEffects(SoundEffects.Descs[0].id);

        console.log("%c🩺 welcome! 🐍", "font:700 2.3em /1.5 monospace;"
        + " margin:0.4em; border:0.3em solid black;padding:0.4em;"
        + " color:white; background-color:#3f5e77; border-radius:0.7em; ");
    }

    public toast(message: string): void {
        // TODO.impl
        console.info(message);
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
        GITHUB        = "github",
        FILESYSTEM    = "filesystem",
        SNAKEY_SERVER = "sk-server",
    }
}
Object.freeze(TopLevel);
Object.freeze(TopLevel.prototype);
