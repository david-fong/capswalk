

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
     * See the main documentation in game/player/Player.
     */
    export type Id = {
        family: Family;
        /**
         * A positive integer used to index into an array of members
         * of the same Family.
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

    /**
     * See the main documentation in game/player/Player.
     */
    export type Health = number;
    export namespace Health {
        /**
         * See the main documentation in game/player/Player.
         */
        export type Raw = number;
    }

    export class Bundle<T> {

        // weakly immutable.
        public readonly contents: Bundle.Contents<T>;

        public constructor(contents: Bundle.Contents<T>) {
            this.contents = contents;
        }

        public get(playerId: Player.Id): T {
            return this.contents[playerId.family][playerId.number];
        };

        public get keys(): Array<Family> {
            return Object.keys(this.contents) as Array<Family>;
        }

        public get values(): Array<ReadonlyArray<T>> {
            return Object.values(this.contents);
        }

        public get entries(): Array<[Family,ReadonlyArray<T>]> {
            return Object.entries(this.contents) as Array<[Family,ReadonlyArray<T>]>;
        }

        public get counts(): Bundle.Counts {
            return Object.freeze(this.entries.reduce
                    <Record<Player.Family, number>>
                    ((build, [family, players,]) => {
                build[family] = players.length;
                return build;
            }, {} as Record<Player.Family, number>));
        }
    }

    export namespace Bundle {

        /**
         * (weakly) **Immutable**.
         *
         * Entries in each family-array can be modified, but this
         * object's references to those entries cannot be reassigned.
         */
        export type Contents<T> = Readonly<Record<Family, ReadonlyArray<T>>>;

        export type Counts = Readonly<Record<Player.Family, number>>;

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
