import { JsUtils } from "defs/JsUtils";
import { OmHooks } from "defs/OmHooks";
import { StorageHooks } from "defs/StorageHooks";
import type { BrowserGameMixin, Game } from "./game/BrowserGame";
import type { _PlayScreen } from "./screen/impl/Play";
import type { Coord, SkScreen } from "../client/screen/SkScreen";

import { AllSkScreens } from "./screen/AllSkScreens";
import { BgMusic }      from "./audio/BgMusic";
import { SoundEffects } from "./audio/SoundEffects";


/**
 *
 */
export class TopLevel {

    public readonly defaultDocTitle: string;

    public readonly webpageHostType: TopLevel.WebpageHostType;

    public readonly storage: typeof StorageHooks;

    /**
     * Purposely made private. Screens are intended to navigate
     * between each other without reference to this field.
     */
    readonly #allScreens: AllSkScreens;

    public readonly bgMusic: BgMusic;
    public readonly sfx: SoundEffects;

    /**
     * This is managed by the `GroupJoiner` screen.
     */
    // TODO.impl change this to just a getter, and implement a setter method
    // that makes it clear that it is not generally safe to modify this field.
    public socket: typeof io.Socket | undefined;

    #socketIoChunk: Promise<typeof import("socket.io-client")>;

    /**
     */
    public get clientIsGroupHost(): boolean {
        return this.#allScreens.dict.groupJoiner.clientIsGroupHost;
    }


    public constructor() {
        this.defaultDocTitle = document.title;
        this.webpageHostType = (() => {
            if (window.location.origin.match(/github\.io/)) {
                return TopLevel.WebpageHostType.GITHUB;
            } else if (window.location.protocol.startsWith("file")) {
                return TopLevel.WebpageHostType.FILESYSTEM;
            } else {
                return TopLevel.WebpageHostType.SNAKEY_SERVER;
            }
        })();
        this.storage = StorageHooks;
        //
        const allScreensElem = document.getElementById(OmHooks.Screen.Id.ALL_SCREENS);
        if (!allScreensElem) { throw Error(); }
        this.prependComment(allScreensElem, "ALL SCREENS CONTAINER");
        this.#allScreens = new AllSkScreens(this, allScreensElem);

        //
        // this.bgMusic = new BgMusic(BgMusic.TrackDescs[0].id);
        // this.sfx = new SoundEffects(SoundEffects.Descs[0].id);

        JsUtils.propNoWrite(this as TopLevel, [
            "defaultDocTitle", "webpageHostType",
            "storage", /* "bgMusic", "sfx", */ // TODO.build uncomment when music classes implemented.
        ]);

        console.log("%c🩺 welcome! 🐍", "font:700 2.3em /1.5 monospace;"
        + " margin:0.4em; border:0.3em solid black;padding:0.4em;"
        + " color:white; background-color:#3f5e77; border-radius:0.7em; ");
    }

    public toast(message: string): void {
        // TODO.impl
        console.info(message);
    }

    /**
     * A non-user-facing markup utility.
     */
    public prependComment(node: HTMLElement, commentStr: string): void {
        node.parentNode!.insertBefore(document.createComment(" " + commentStr + " "), node);
    }

    public get socketIo(): Promise<typeof import("socket.io-client")> {
        // return this.#socketIoChunk
        // || (this.#socketIoChunk = import(
        //     /* webpackChunkName: "[request]" */
        //     "socket.io-client"
        // ));
        return (() => {
            let cached: undefined | Promise<typeof import("socket.io-client")>;
            return cached || (cached = new Promise<typeof import("socket.io-client")>((resolve, reject): void => {
                const script = document.createElement("script");
                script.onload = (): void => {
                    resolve(io);
                };
                script.src = (document.getElementById("socket.io-preload") as HTMLLinkElement).href;
                document.body.appendChild(script);
            }));
        })();
    }

    /**
     * For debugging purposes- especially in the browser console.
     */
    public get game(): BrowserGameMixin<Game.Type.Browser,Coord.System> | undefined {
        return (this.#allScreens.dict.playOffline).currentGame
            ?? (this.#allScreens.dict.playOnline ).currentGame;
    }

    /**
     * For debugging purposes- especially in the browser console.
     */
    public get currentScreen(): SkScreen<SkScreen.Id> {
        return this.#allScreens.currentScreen;
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