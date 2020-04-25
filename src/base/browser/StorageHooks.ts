

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
 * https://www.w3schools.com/html/html5_webstorage.asp
 */
export namespace StorageHooks {
    export const Keys = Object.freeze(<const>{
        MUSIC_VOLUME:   "musicVolume",
        SFX_VOLUME:     "sfxVolume",
        SAVED_GAME_SETUPS: "savedGameSetups",
        USERNAME:       "username",
        AVATAR:         "avatarId",
        COLOUR:         "colourSchemeId",
    });
}
