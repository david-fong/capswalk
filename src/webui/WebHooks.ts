
/**
 * Must be matched exactly in the html, css, and javascript.
 *
 * Dataset values are defined for the javascript domain. The CSS should
 * use the CSS-cased version with dash-separators.
 *
 * Things that don't go here:
 * - Event names go in `src/base/game/events`.
 * - Sound file names go in `./Sound.ts`
 */
export namespace WebHooks {

    export const General = Object.freeze(<const>{
        Class: Object.freeze(<const>{
            FILL_PARENT: "fill-parent",
        })
    })

    export const Tile = Object.freeze(<const>{
        Class: Object.freeze(<const>{
            BASE:       "tile",
            LANG_CHAR:  "tile__char",
            LANG_SEQ:   "tile__seq",
        }),
        Dataset: Object.freeze(<const>{
            HEALTH:     "health",
        }),
    });


    export const Grid = Object.freeze(<const>{
        Id: Object.freeze(<const>{
            /**
             * js/ts and html are allowed to prepend or append to this
             * string. The specified element should _only_ contain the
             * grid element. Anything else will be removed by js/ts.
             */
            GRID:       "game-grid",
        }),
        Class: Object.freeze(<const>{
            GRID:       "game-grid",
            SPOTLIGHT:  "game-grid__spotlight",
        }),
        Dataset: Object.freeze(<const>{
            /**
             * Used as a part of CSS selector queries to specify coord-
             * system-specific styling.
             */
            COORD_SYS:  "coordSys",
        }),
    });


    export const Player = Object.freeze(<const>{
        Class: Object.freeze(<const>{
            BASE:       "player",
            DOWNED_OVERLAY: "player__downed-overlay"
        }),
        Dataset: Object.freeze(<const>{
            DOWNED:     "downed",
            FACE_SWATCH:"face",
        }),
    });


    /**
     * Final CSS variables declared for each color scheme are in the
     * form: `--colour-schemeId-swatchName`. js/ts should not need to
     * interface with these values directly. Instead, it should use
     * provided class names and dataset attributes as to minimize its
     * effort when colour schemes are swapped.
     */
    export namespace Colour {
        export const Swatch = Object.freeze(<const>[
            "mainFg", "mainBg",
            "tileFg", "tileBg", "tileBd",
            "health",
            "pFace0", "pFace1", "pFace2", "pFace3",
            "pFace4", "pFace5", "pFace6", "pFace7",
            "pFaceInvincible",
        ]);
        export const Scheme = Object.freeze(<const>{
            ["snakey"]: Object.freeze(<const>{
                displayName: "Snakey by N.W.",
            }),
        });
        export namespace Scheme {
            export type Id = keyof typeof Scheme;
        }
    }
    Object.freeze(Colour);


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
