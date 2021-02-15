import { JsUtils } from "defs/JsUtils";
import { OmHooks } from "defs/OmHooks";
import { StorageHooks } from "./StorageHooks";
import type { _PlayScreen } from "./screen/impl/Play/_Screen";
import type { BaseScreen } from "./screen/BaseScreen";

import { AllScreens } from "./screen/AllScreens";
import { ScreenTransition } from "./screen/ScreenTransition";
//import { BgMusic }      from "./audio/BgMusic";
//import { SoundEffects } from "./audio/SoundEffects";


/**
 * @final
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
	readonly #allScreens: AllScreens;

	//public readonly bgMusic: BgMusic;
	//public readonly sfx: SoundEffects;

	#socket?: WebSocket;
	public get socket(): WebSocket | undefined { return this.#socket; }
	public setSocket(newSocket: WebSocket | undefined): void {
		if (this.socket !== undefined) {
			this.socket.close();
		}
		this.#socket = newSocket;
	}

	/** */
	public get clientIsGroupHost(): boolean {
		return this.#allScreens.dict.groupJoiner.isHost;
	}
	public get groupLoginInfo(): Readonly<{ name?: string, passphrase?: string }> {
		return this.#allScreens.dict.groupJoiner.loginInfo;
	}


	public constructor() {
		this.defaultDocTitle = document.title;
		this.webpageHostType = (() => {
			if (window.location.hostname.match(/github\.io/)) {
				return TopLevel.WebpageHostType.GITHUB;
			} else if (window.location.protocol.startsWith("file")) {
				return TopLevel.WebpageHostType.FILESYSTEM;
			} else {
				return TopLevel.WebpageHostType.GAME_SERVER;
			}
		})();
		JsUtils.propNoWrite(this as TopLevel, "defaultDocTitle", "webpageHostType");

		this.storage = StorageHooks;
		this.socket = undefined;
		this.transition = new ScreenTransition();
		JsUtils.propNoWrite(this as TopLevel, "storage", "sockets", "transition");

		const allScreensElem = document.getElementById(OmHooks.Screen.Id.ALL_SCREENS);
		if (!allScreensElem) { throw new Error("never"); }
		JsUtils.Web.prependComment(allScreensElem, "ALL SCREENS CONTAINER");
		this.#allScreens = new AllScreens(this, allScreensElem);

		//
		// this.bgMusic = new BgMusic(BgMusic.TrackDescs[0].id);
		// this.sfx = new SoundEffects(SoundEffects.Descs[0].id);
		JsUtils.propNoWrite(this as TopLevel,
			/* "bgMusic", "sfx", */ // TODO.build uncomment when music classes implemented.
		);
		Object.seal(this); //🧊
	}

	public toast(message: string): void {
		// TODO.impl
		console.info(message);
	}
	public confirm(message: string): boolean {
		// TODO.impl
		return window.confirm(message);
	}

	/**
	 * @deprecated
	 * For debugging purposes- especially in the browser console.
	 * Not actually deprecated :P
	 */
	public get game() {
		return (this.#allScreens.dict.playOffline).probeCurrentGame
			?? (this.#allScreens.dict.playOnline ).probeCurrentGame;
	}

	/**
	 * @deprecated
	 * For debugging purposes- especially in the browser console.
	 */
	public get currentScreen(): BaseScreen<BaseScreen.Id> {
		return this.#allScreens.currentScreen;
	}
}
export namespace TopLevel {
	export const enum WebpageHostType {
		GITHUB      = "github",
		FILESYSTEM  = "filesystem",
		GAME_SERVER = "game-server",
	}
	export const WebpageHostTypeSuggestedHost = Object.freeze({
		"github":  undefined,
		"filesystem": {
			value: "localhost",
			description: "dev shortcut :)",
		},
		"game-server": {
			value: window.location.origin,
			description: "this page's server",
		},
	});
}
Object.freeze(TopLevel);
Object.freeze(TopLevel.prototype);