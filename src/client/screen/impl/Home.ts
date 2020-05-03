import { SkScreen } from "../SkScreen";
import { OmHooks } from 'defs/OmHooks';


/**
 *
 */
export class HomeScreen extends SkScreen {

    protected __lazyLoad(): void {
        const OMHC = OmHooks.Screen.Impl.Home.Class;
        this.baseElem.classList.add(
            OmHooks.General.Class.CENTER_CONTENTS,
            OMHC.SCREEN,
        );
        this.baseElem.setAttribute("aria-label", "Home Page Screen");

        const nav = document.createElement("div");
        nav.classList.add(OMHC.NAV);
        nav.setAttribute("role", "navigation");

        // NOTE: Define array entries in order that their
        // buttons should be tabbed through via keyboard.
        const buttonDescs: TU.RoArr<Readonly<{
            text: string;
            cssClass: typeof OMHC[keyof typeof OMHC];
            screenId: SkScreen.Id | URL;
        }>> = [{
            text:    "Play Offline",
            cssClass: OMHC.NAV_PLAY_OFFLINE,
            screenId: SkScreen.Id.PLAY_OFFLINE,
        },{
            text:    "Join an Online Game",
            cssClass: OMHC.NAV_JOIN_ONLINE,
            screenId: SkScreen.Id.SESH_JOINER,
        },{
            text:    "Host an Online Game",
            cssClass: OMHC.NAV_HOST_ONLINE,
            screenId: SkScreen.Id.HOW_TO_HOST,
        },{
            text:    "Tutorial",
            cssClass: OMHC.NAV_TUTORIAL,
            screenId: SkScreen.Id.HOW_TO_PLAY,
        },{
            text:    "Colour Schemes",
            cssClass: OMHC.NAV_COLOURS,
            screenId: SkScreen.Id.COLOUR_CTRL,
        },{
            text:    "Visit Repo",
            cssClass: OMHC.NAV_VIEW_REPO,
            screenId: new window.URL("https://github.com/david-fong/SnaKey-NTS"),
        },{
            text:    "Report Issue",
            cssClass: OMHC.NAV_RPT_ISSUE,
            screenId: new window.URL("https://github.com/david-fong/SnaKey-NTS/issues"),
        }];
        buttonDescs.forEach((desc) => {
            const isUrl = (desc.screenId instanceof URL);
            const navButton = document.createElement(isUrl ? "a" : "button");
            navButton.classList.add(
                OmHooks.General.Class.CENTER_CONTENTS,
                desc.cssClass,
            );
            navButton.innerText = desc.text;
            navButton.onpointerenter = () => navButton.focus();
            if (navButton instanceof HTMLButtonElement) {
                navButton.onclick = this.requestGoToScreen.bind(
                    this, desc.screenId as SkScreen.Id,
                );
            } else {
                navButton.href = (desc.screenId as URL).toString();
                navButton.referrerPolicy = "strict-origin-when-cross-origin";
                navButton.target = "_blank";
            }
            nav.appendChild(navButton);
        });
        this.baseElem.appendChild(nav);
    }
}
Object.freeze(HomeScreen);
Object.freeze(HomeScreen.prototype);
