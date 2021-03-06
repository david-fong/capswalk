import AvatarValues from "./Avatars.json5";

export const SCROLL_INTO_CENTER = Object.freeze(<const>{
	behavior: "smooth",
	block:    "center",
	inline:   "center",
});
SCROLL_INTO_CENTER as ScrollIntoViewOptions;


/** */
export abstract class Player { }
export namespace Player {

	/**
	 * @enum
	 * Each implementation of the {@link RobotPlayer} class must
	 * have an entry here.
	 */
	export type Family = keyof typeof Family;
	export const Family = Object.freeze(<const>{
		HUMAN:  "HUMAN",
		CHASER: "CHASER",
	});
	Family as {
		[ key in Family ]: key;
	};

	/** See the main documentation in game/player/Player. */
	export type Id = number;
	export namespace Id {
		export const NULL = (-1);
	}

	export type Username = string;
	export namespace Username {
		export const REGEXP = /[ a-zA-Z0-9:-]+/;
		export const MAX_LENGTH = 15; // rather arbitrary choice.
	}

	export type Avatar = string;
	export namespace Avatar {
		export const Values = (AvatarValues as string[]).freeze();
		/** */
		export function GET_RANDOM(): Avatar {
			return Values[Math.floor(Math.random() * Values.length)]!;
		}
	}

	export interface UserInfo {
		readonly username: Username;
		readonly teamId:   number;
		readonly avatar:   Avatar;
	}

	/** See the main documentation in game/player/Player. */
	export type Health = number;
}
Object.freeze(Player);


/** */
export abstract class Lang {}
export namespace Lang {
	/**
	 * See the main documentation in game/lang/Lang
	 */
	export type Char = string;
	/**
	 * See the main documentation in game/lang/Lang
	 */
	export type Seq = string;
	export namespace Seq {
		/**
		 * The choice of this pattern is not out of necessity, but following
		 * the mindset of spec designers when they mark something as reserved:
		 * For the language implementations I have in mind, I don't see the
		 * need to include characters other than these.
		 *
		 * Characters that must never be unmarked as reserved (state reason):
		 * (currently none. update as needed)
		 */
		export const REGEXP = new RegExp("^[a-zA-Z0-9!@#$%^&*()\-_=+;:'\"\\|,.<>/?]+$");
	}
	/** See the main documentation in game/lang/Lang */
	export type CharSeqPair = {
		readonly char: Lang.Char,
		readonly seq:  Lang.Seq,
	};
	export namespace CharSeqPair {
		/**  Used at the beginning of the shuffling operation. */
		export const NULL = Object.freeze(<const>{
			char: "",
			seq:  "",
		});
	}
	/** See the main documentation in game/lang/Lang */
	export type WeightExaggeration = number;
	export namespace WeightExaggeration {
		/**
		 * The choice of this value is somewhat up to taste.
		 * It must be greater than one.
		 */
		export const MAX = 4;
	}
	/**
	 * The choice of the upper bound on the number of times
	 * is rather arbitrary, but it should not be too small.
	 */
	export const CHAR_HIT_COUNT_SEED_CEILING = 5;

	/** */
	export type Desc = Readonly<{
		id: string;
		/** Pretty much a file name. */
		module: string;
		/** A property-access chain. */
		export: string;
		/** The output must match against `Lang.Seq.REGEXP`. */
		remapFunc: {(input: string): string};
		/** */
		isolatedMinOpts: number;
		displayName:string;
		blurb: string;
	}>;
}
Object.freeze(Lang);
Object.freeze(Lang.prototype);