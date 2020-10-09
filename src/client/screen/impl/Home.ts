import { OmHooks, SkScreen } from "../SkScreen";


/**
 *
 */
export class HomeScreen extends SkScreen<SkScreen.Id.HOME> {

    private readonly navElem: HTMLElement;

    /**
     * @override
     */
    protected _lazyLoad(): void {
        const OMHC = OmHooks.Screen.Impl.Home.Class;
        type  OMHC = typeof OMHC;
        this.baseElem.classList.add(
            OmHooks.General.Class.CENTER_CONTENTS,
            OMHC.BASE,
        );

        const nav
            // @ts-expect-error : RO=
            = this.navElem
            = document.createElement("div");
        nav.classList.add(
            OmHooks.General.Class.TEXT_SELECT_DISABLED,
            OmHooks.General.Class.INPUT_GROUP,
            OMHC.NAV,
        );
        nav.setAttribute("role", "navigation");
        nav.addEventListener("pointerleave", () => {
            if (document.activeElement?.parentElement === nav) {
                (document.activeElement as HTMLElement).blur();
            }
        });
        const addToNav = (elem: HTMLElement, desc: { text: string, cssClass: string; }): void => {
            elem.classList.add(
                OmHooks.General.Class.CENTER_CONTENTS,
                OmHooks.General.Class.INPUT_GROUP_ITEM,
                desc.cssClass,
            );
            elem.textContent = desc.text;
            elem.addEventListener("pointerenter", () => {
                window.requestAnimationFrame((time) => {
                    elem.focus();
                });
                // TODO.impl play a keyboard click sound.
                // this.top.sfx;
            });
            nav.appendChild(elem);
        };

        // NOTE: Define array entries in order that their
        // buttons should be tabbed through via keyboard.
        (<const>[{
            text:    "Offline Single-player",
            cssClass: OMHC.NAV_PLAY_OFFLINE,
            screenId: SkScreen.Id.SETUP_OFFLINE,
        },{
            text:    "Online Multi-player",
            cssClass: OMHC.NAV_PLAY_ONLINE,
            screenId: SkScreen.Id.GROUP_JOINER,
        },{
            text:    "How To Play",
            cssClass: OMHC.NAV_HOW_TO_PLAY,
            screenId: SkScreen.Id.HOW_TO_PLAY,
        },{
            text:    "How To Host",
            cssClass: OMHC.NAV_HOW_TO_HOST,
            screenId: SkScreen.Id.HOW_TO_HOST,
        },{
            text:    "Colour Schemes",
            cssClass: OMHC.NAV_COLOURS,
            screenId: SkScreen.Id.COLOUR_CTRL,
        },])
        .map<Readonly<{
            text: string;
            cssClass: OMHC[keyof OMHC];
            screenId: SkScreen.Id | ((ev: MouseEvent) => void);
        }>>((desc) => Object.freeze(desc))
        .forEach((desc) => {
            const button = document.createElement("button");
            button.onclick = (desc.screenId instanceof Function) ? desc.screenId : () => {
                // TODO.impl play a health-up sound.
                // this.top.sfx.;
                this.requestGoToScreen(desc.screenId as SkScreen.Id, {});
            };
            addToNav(button, desc);
        });

        (<const>[{
            text:    "Visit\nRepo",
            cssClass: OMHC.NAV_VIEW_REPO,
            href:     new window.URL("https://github.com/david-fong/SnaKey-NTS"),
        },{
            text:    "Report\nIssue",
            cssClass: OMHC.NAV_RPT_ISSUE,
            href:     new window.URL("https://github.com/david-fong/SnaKey-NTS/issues"),
        },])
        .map<Readonly<{
            text: string;
            cssClass: OMHC[keyof OMHC];
            href: URL;
        }>>((desc) => Object.freeze(desc))
        .forEach((desc) => {
            const a = document.createElement("a");
            a.href = (desc.href).toString();
            a.referrerPolicy = "strict-origin-when-cross-origin";
            a.rel = "noopener"; // Defaulted on modern browsers when target === "_blank".
            a.target = "_blank";
            addToNav(a, desc);
        });

        this.baseElem.appendChild(nav);
    }
}
Object.freeze(HomeScreen);
Object.freeze(HomeScreen.prototype);