import { JsUtils } from "defs/JsUtils";
import { OmHooks } from "defs/OmHooks";
import { StorageHooks } from "./StorageHooks";
import type { _PlayScreen } from "./screen/impl/Play/_Screen";
import type { BaseScreen } from "./screen/BaseScreen";

import { AllScreens } from "./screen/AllScreens";
import { ScreenTransition } from "./screen/ScreenTransition";
//import { BgMusic, MkBgMusic } from "./audio/BgMusic";
//import { SoundEffects } from "./audio/SoundEffects";

/**
 * @final
 */
export class TopLevel {

	public readonly defaultDocTitle: string;

	public readonly siteServerType: TopLevel.SiteServerType;

	public readonly storage: typeof StorageHooks;

	public readonly transition: ScreenTransition;
	/**
	 * Purposely made private. Screens are intended to navigate
	 * between each other without reference to this field.
	 */
	readonly #allScreens: AllScreens;

	//public readonly bgMusic: BgMusic;
	//public readonly sfx: SoundEffects;

	#socket: WebSocket | undefined;
	public get webSocket(): WebSocket | undefined { return this.#socket; }
	public setWebSocket(newSocket: WebSocket | undefined): void {
		if (this.webSocket !== undefined) {
			this.webSocket.close();
		}
		this.#socket = newSocket;
	}

	/** */
	public get clientIsGroupHost(): boolean {
		return this.#allScreens.dict.groupJoiner.isHost;
	}

	/** */
	public constructor() {
		this.defaultDocTitle = document.title;
		this.siteServerType = (() => {
			if (window.location.hostname.match(/github\.io/)) {
				return TopLevel.SiteServerType.GITHUB;
			} else if (window.location.protocol.startsWith("file")) {
				return TopLevel.SiteServerType.FILESYSTEM;
			} else {
				return TopLevel.SiteServerType.DEDICATED;
			}
		})();
		JsUtils.propNoWrite(this as TopLevel, "defaultDocTitle", "siteServerType");

		this.storage = StorageHooks;
		this.#socket = undefined;
		this.transition = new ScreenTransition();
		JsUtils.propNoWrite(this as TopLevel, "storage", "transition");

		const allScreensElem = document.getElementById(OmHooks.Screen.Id.ALL_SCREENS);
		if (!allScreensElem) { throw new Error("never"); }
		JsUtils.Web.prependComment(allScreensElem, "ALL SCREENS CONTAINER");
		this.#allScreens = new AllScreens(this, allScreensElem);

		//
		// MkBgMusic(BgMusic.TrackDescs[0].id).then(it => this.bgMusic = it);
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
	export const enum SiteServerType {
		GITHUB      = "github",
		FILESYSTEM  = "filesystem",
		DEDICATED   = "dedicated",
	}
	export const SiteServerTypeSuggestedGameServer = JsUtils.deepFreeze({
		[SiteServerType.GITHUB]: undefined,
		[SiteServerType.FILESYSTEM]: {
			value: "ws://localhost",
			description: "dev shortcut :)",
		},
		[SiteServerType.DEDICATED]: {
			value: (() => { const url = new URL(window.location.origin); url.protocol = "ws"; return url.toString(); })(),
			description: "this page's server",
		},
	});
}
Object.freeze(TopLevel);
Object.freeze(TopLevel.prototype);