import { JsUtils } from "defs/JsUtils";
import { OmHooks } from "defs/OmHooks";
import { StorageHooks } from "defs/StorageHooks";
import type { BrowserGameMixin, Game } from "./game/BrowserGame";
import type { _PlayScreen } from "./screen/impl/Play";
import type { Coord, SkScreen } from "../client/screen/SkScreen";

import { AllSkScreens } from "./screen/AllSkScreens";
import { ScreenTransition }   from "./screen/ScreenTransition";
//import { BgMusic }      from "./audio/BgMusic";
//import { SoundEffects } from "./audio/SoundEffects";
import { SkSockets }    from "./SkSockets";


/**
 *
 */
export class TopLevel {

    public readonly defaultDocTitle: string;

    public readonly webpageHostType: TopLevel.WebpageHostType;

    public readonly storage: typeof StorageHooks;

    public readonly transition: ScreenTransition;
    /**
     * Purposely made private. Screens are intended to navigate
     * between each other without reference to this field.
     */
    readonly #allScreens: AllSkScreens;

    //public readonly bgMusic: BgMusic;
    //public readonly sfx: SoundEffects;

    public readonly sockets: SkSockets;

    /**
     */
    public get clientIsGroupHost(): boolean {
        return this.#allScreens.dict.groupJoiner.clientIsGroupHost;
    }
    public get groupLoginInfo(): Readonly<{ name?: string, passphrase?: string }> {
        return this.#allScreens.dict.groupJoiner.loginInfo;
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
        JsUtils.propNoWrite(this as TopLevel, [
            "defaultDocTitle", "webpageHostType",
        ]);

        this.storage = StorageHooks;
        this.sockets = new SkSockets();
        this.transition = new ScreenTransition();
        JsUtils.propNoWrite(this as TopLevel, [
            "storage", "sockets", "transition",
        ]);

        const allScreensElem = document.getElementById(OmHooks.Screen.Id.ALL_SCREENS);
        if (!allScreensElem) { throw new Error("never"); }
        JsUtils.prependComment(allScreensElem, "ALL SCREENS CONTAINER");
        this.#allScreens = new AllSkScreens(this, allScreensElem);

        //
        // this.bgMusic = new BgMusic(BgMusic.TrackDescs[0].id);
        // this.sfx = new SoundEffects(SoundEffects.Descs[0].id);
        JsUtils.propNoWrite(this as TopLevel, [
            /* "bgMusic", "sfx", */ // TODO.build uncomment when music classes implemented.
        ]);
    }

    public toast(message: string): void {
        // TODO.impl
        console.info(message);
    }

    /**
     * For debugging purposes- especially in the browser console.
     */
    public get game(): BrowserGameMixin<Game.Type.Browser,Coord.System> | undefined {
        return (this.#allScreens.dict.playOffline).probeCurrentGame
            ?? (this.#allScreens.dict.playOnline ).probeCurrentGame;
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