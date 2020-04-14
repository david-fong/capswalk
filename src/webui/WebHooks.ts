
/**
 * Must be matched exactly in the html, css, and javascript.
 *
 * Things that don't go here:
 * - Event names go in `src/base/game/events`.
 * - Sound file names go in `./Sound.ts`
 */
export namespace WebHooks {

    export const Tile = Object.freeze(<const>{
        Class: Object.freeze(<const>{
            BASE:       "tile",
            LANG_CHAR:  "tile__char",
            LANG_SEQ:   "tile__seq",
        }),
        Dataset: Object.freeze(<const>{
            SCORE_VALUE: "scoreValue",
        }),
    });

    export const Grid = Object.freeze(<const>{
        Id: Object.freeze(<const>{
            GRID: "game-grid-host",
        }),
    });

    export const Player = Object.freeze(<const>{
        Class: Object.freeze(<const>{
            BASE: "player",
        }),
        Dataset: Object.freeze(<const>{
            IS_DOWNED:  "isDowned"
        }),
    });

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
     * https://www.w3schools.com/html/html5_webstorage.asp
     */
    export const WebStorageKeys = Object.freeze(<const>{
        RecentCoordSystem: "recent-coord-system",
        RecentLang: "recent-lang",
    });

    type HookDict = {
        [ DictKey in "Id" | "Class" | "Dataset" ]?: Readonly<{
            [ JsHook: string ]: string;
        }>;
    };

}
Object.freeze(WebHooks);
