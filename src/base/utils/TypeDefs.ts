

export class Player<S> { }
export namespace Player {

    /**
     * @enum
     * Each implementation of the {@link ArtificialPlayer} class must
     * have an entry here.
     */
    export type Family = keyof typeof Family;
    export const Family = Object.freeze(<const>{
        HUMAN:  "HUMAN",
        CHASER: "CHASER",
    });
    Family as { [ key in Family ]: key };
    /**
     * @param string -
     */
    export function assertIsOperator(string: string): asserts string is Family {};

    /**
     * See the main documentation in game/player/Player.
     */
    export type Id = {
        family: Family;
        /**
         * A positive integer.
         */
        number: number;
    };

    export namespace Id {
        /**
         * See the main documentation in game/player/Player.
         */
        export const NULL = undefined;
        export type Nullable = Player.Id | typeof Player.Id.NULL;
    }

    export class Bundle<T> {

        public readonly contents: Bundle.Contents<T>;

        public constructor(contents: Bundle.Contents<T>) {
            Object.assign(this, contents);
        }

        public get(playerId: Player.Id): T {
            return this[playerId.family][playerId.number];
        };

        public get keys(): Array<Family> {
            return Object.keys(this) as Array<Family>;
        }

        public get values(): Array<ReadonlyArray<T>> {
            return Object.values(this);
        }

        public get entries(): Array<[Family,ReadonlyArray<T>]> {
            return Object.entries(this) as Array<[Family,ReadonlyArray<T>]>;
        }
    }

    export namespace Bundle {
        export type Contents<T> = Readonly<Record<Family, ReadonlyArray<T>>>;
    }
}



export namespace PlayerSkeleton {
    /**
     * Information used by a {@link VisibleTile} to decide how to
     * render the specified player. See {@link VisibleTile#occupantId}.
     * 
     * All fields are readonly.
     */
    export type VisibleState = Readonly<{
        playerId:   Player.Id.Nullable;
        isDowned:   boolean;
        isFrozen:   boolean;
        isBubbling: boolean;
        percentBubbleCharge: number;
    }>;

    export namespace VisibleState {
        /**
         * Use for Tile-occupant eviction.
         */
        export const NULL = Object.freeze(<const>{
            playerId:   Player.Id.NULL,
            isDowned:   false,
            isFrozen:   false,
            isBubbling: false,
            percentBubbleCharge: 0,
        });
        NULL as VisibleState;
    }
}


export class Lang {}
export namespace Lang {
    /**
     * See the main documentation in game/lang/Lang
     */
    export type Char = string;
    /**
     * See the main documentation in game/lang/Lang
     */
    export type Seq = string;
    /**
     * See the main documentation in game/lang/Lang
     */
    export type CharSeqPair = Readonly<{
        char: Lang.Char,
        seq:  Lang.Seq,
    }>;
    export namespace CharSeqPair {
        /**
         * Used to clear the {@link CharSeqPair} in a {@link Tile} during
         * a {@link Game} reset before grid-wide shuffling, or before a
         * single shuffling operation on the {@link Tile} to be shuffled.
         */
        export const NULL = Object.freeze(<const>{
            char: "",
            seq:  "",
        });
    }
}
