
/**
 * Must be matched exactly in the html, css, and javascript.
 */
export namespace WebHooks {

    export namespace Tile {
        export const Class = Object.freeze(<const>{
            BASE:       "tile",
            LANG_CHAR:  "tile__char",
            LANG_SEQ:   "tile__seq",
        });
        export const Dataset = Object.freeze(<const>{
            SCORE_VALUE: "scoreValue",
        });
    }

    export namespace Grid {
        export const Id = Object.freeze(<const>{
            GRID:   "game-grid-host",
        });
    }

    export namespace Player {
        export const Class = Object.freeze(<const>{
            BASE: "player",
        });
        export const Dataset = Object.freeze(<const>{
            IS_DOWNED:  "isDowned"
        });
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
     * https://www.w3schools.com/html/html5_webstorage.asp
     */
    export const WebStorageKeys = Object.freeze(<const>{
        RecentCoordSystem: "recent-coord-system",
        RecentLang: "recent-lang",
    });

    // I can't find a way to use this and assert that the namespaces
    // no extra exports (yes I'm paranoid I know. To me it's a game).
    export type HookDict = {
        [ DictKey in "Id" | "Class" | "Dataset" ]?: Readonly<{
            [ JsHook: string ]: string;
        }>;
    };

}
Object.freeze(WebHooks);
