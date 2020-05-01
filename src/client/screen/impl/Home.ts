import { SkScreen } from "../SkScreen";
import { OmHooks } from 'defs/OmHooks';


/**
 *
 */
export class HomeScreen extends SkScreen {

    protected __lazyLoad(): void {
        this.baseElem.classList.add(
            OmHooks.Screen.Impl.Home.Class.SCREEN
        );
        this.baseElem.setAttribute("aria-label", "Home Page Screen");

        const nav = document.createElement("div");
        nav.setAttribute("role", "navigation");

        { const pOfflineB = document.createElement("button");
        pOfflineB.innerText = "Play Offline";
        pOfflineB.onclick = this.requestGoToScreen.bind(this, SkScreen.Id.PLAY_OFFLINE);
        nav.appendChild(pOfflineB); }

        { const joinOnlineB = document.createElement("button");
        joinOnlineB.innerText = "Join an Online Game";
        joinOnlineB.onclick = this.requestGoToScreen.bind(this, SkScreen.Id.PLAY_ONLINE);
        nav.appendChild(joinOnlineB); }

        { const hostOnlineB = document.createElement("button");
        hostOnlineB.innerText = "Host an Online Game";
        hostOnlineB.onclick = this.requestGoToScreen.bind(this, SkScreen.Id.HOW_TO_HOST);
        nav.appendChild(hostOnlineB); }

        this.baseElem.appendChild(nav);
    }
}
Object.freeze(HomeScreen);
Object.freeze(HomeScreen.prototype);
