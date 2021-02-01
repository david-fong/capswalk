import { JsUtils, BaseScreen } from "../BaseScreen";


/**
 *
 */
export class HowToHostScreen extends BaseScreen<BaseScreen.Id.HOW_TO_HOST> {

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
		"$ npm install \'https://github.com/david-fong/snakey3#gh-pages\'",
		"$ npm run start",
		"send the url to your friends",
	]);
}
Object.freeze(HowToHostScreen);
Object.freeze(HowToHostScreen.prototype);