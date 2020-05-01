/**
 *
 */

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
 * https://www.w3schools.com/html/html5_webstorage.asp
 */
export namespace StorageHooks {
    /**
     * Keys for this origin's local storage records.
     *
     * These are used to store identifiers for "last-used" settings to
     * be restored on startup.
     */
    export const LocalKeys = Object.freeze(<const>{
        MUSIC_VOLUME:   "musicVolume",
        SFX_VOLUME:     "sfxVolume",
        /**
         * Only used to highlight the last-used colour scheme when
         * cold-initializing the colour selection screen.
         */
        COLOUR_ID:      "colourSchemeId",
        /**
         * Stores a css rule string for quick recovery on page load
         * without even needing any colour scheme CSS files loaded.
         */
        COLOUR_LITERAL: "colourSchemeStyleLiteral",

        GAME_PRESET:    "gamePresetId",

        USERNAME:       "username",
        AVATAR:         "avatarId",
    });

    /**
     * Keys for this origin's session storage records.
     */
    export const SessionKeys = Object.freeze(<const>{
    });

    export namespace IDB {
        /**
         *
         */
        export const DB_NAME = "snakeyDB";

        /**
         *
         */
        export namespace UserGamePresetStore {
            export const STORE_NAME = "userGamePresets";
        }
        Object.freeze(UserGamePresetStore);
    }
    Object.freeze(IDB);
}
Object.freeze(StorageHooks);
