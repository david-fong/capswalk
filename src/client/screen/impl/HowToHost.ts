import { JsUtils, SkScreen } from "../SkScreen";


/**
 *
 */
export class HowToHostScreen extends SkScreen<SkScreen.Id.HOW_TO_HOST> {

    /**
     * @override
     */
    protected _lazyLoad(): void {
        ;
    }
}
export namespace HowToHostScreen {
    // TODO.doc
    export const INSTRUCTIONS_STEPS = Object.freeze(<const>[
        "$ npm install \'https://github.com/david-fong/SnaKey-NTS#gh-pages\'",
        "$ npm run start",
        "send the url to your friends",
    ]);
}
Object.freeze(HowToHostScreen);
Object.freeze(HowToHostScreen.prototype);