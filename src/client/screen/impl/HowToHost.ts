import { JsUtils, BaseScreen } from "../BaseScreen";

/** */
export class HowToHostScreen extends BaseScreen<BaseScreen.Id.HOW_TO_HOST> {

	protected override _abstractLazyLoad(): void {
		Object.freeze(this); //🧊
	}
}
export namespace HowToHostScreen {
	export const INSTRUCTIONS_STEPS = Object.freeze(<const>[
		"$ npm install 'https://github.com/david-fong/capswalk#gh-pages'",
		"$ npm run start",
		"send the url to your friends",
	]);
}
Object.freeze(HowToHostScreen);
Object.freeze(HowToHostScreen.prototype);