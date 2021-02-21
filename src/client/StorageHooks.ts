import { JsUtils } from "defs/JsUtils";
import { Player } from "defs/TypeDefs";

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
 * https://www.w3schools.com/html/html5_webstorage.asp
 */
export namespace StorageHooks {
	// Let's just take a moment to appreciate that TypeScript
	// actually recognizes references to the example object.
	export const Local = JsUtils.Web._makeSmartStorage("capswalk", localStorage, {
		musicVolume: 1,
		sfxVolume: 1,
		/**
		 * Only used to highlight the last-used colour scheme when
		 * cold-initializing the colour selection screen.
		 */
		colourSchemeId: "",
		/**
		 * Stores a css rule string for quick recovery on page load
		 * without even needing any colour scheme CSS files loaded.
		 *
		 * This is also referenced in a script tag in index.html.
		 */
		colourSchemeStyleLiteral: "",

		gamePresetId: "",

		username: "",
		avatar: "",
	});

	export function getLastUserInfo(): Player.UserInfo {
		return Object.freeze(<Player.UserInfo>{
			username: Local.username ?? "unnamed player",
			teamId: 0,
			avatar: Local.avatar ?? Player.Avatar.GET_RANDOM()
		});
	}

	/** */
	export const Session = JsUtils.Web._makeSmartStorage("capswalk", localStorage, Object.freeze({
	}));

	export namespace IDB {
		/** */
		export const DB_NAME = "capswalk_db";

		/** */
		export namespace UserGamePresetStore {
			export const STORE_NAME = "userGamePresets";
		}
		Object.freeze(UserGamePresetStore);
	}
	Object.freeze(IDB);
}
Object.freeze(StorageHooks);