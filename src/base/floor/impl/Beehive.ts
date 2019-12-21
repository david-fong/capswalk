import { Coord as AbstractCoord } from "../Coord";


/**
 * # 🐝 BEES !
 * 
 * # 🐝 BEES !
 * 
 * # 🐝 BEES !
 * 
 * ```text
 *   ___   ___
 *  //  \_//  \__
 *  \\__/  \__/  \
 *     \\__/ \\__/
 * ```
 * 
 * 
 * [(bees)](https://giphy.com/gifs/oprah-bees-VhFps32TlNgsg)
 */
export namespace Beehive {

    type B = Coord.Bare;

    export class Coord extends AbstractCoord<AbstractCoord.System.BEEHIVE> implements B {

        /**
         * # 🕒 3'o'clock direction
         */
        public readonly dash: number;

        /**
         * # 🕔 5'o'clock direction
         */
        public readonly bash: number;

        public constructor(desc: B) {
            super(desc);
            this.dash  = desc.dash;
            this.bash = desc.bash;
            Object.freeze(this);
        }

        /**
         * @override
         */
        public equals(other: B): boolean {
            return (this.dash === other.dash) && (this.bash === other.bash);
        }

        /**
         * @override
         */
        public round(): Coord {
            // TODO: is this correct? I don't think so...
            return new Coord({
                dash: Math.round(this.dash),
                bash: Math.round(this.bash),
            });
        }

        /**
         * @override
         */
        public originOneNorm(): number {
            return Math.abs(this.x) + Math.abs(this.y);
        }

        /**
         * @override
         */
        public originInfNorm(): number {
            return Math.max(Math.abs(this.x), Math.abs(this.y));
        }

        /**
         * @override
         */
        public originAxialAlignment(): number {
            return Math.abs(Math.abs(this.x) - Math.abs(this.y))
                / (Math.abs(this.x) + Math.abs(this.y));
        }

        /**
         * @override
         */
        public add(other: B): Coord {
            return new Coord({
                x: this.x + other.x,
                y: this.y + other.y,
            });
        }

        /**
         * @override
         */
        public sub(other: B): Coord {
            return new Coord({
                x: this.x - other.x,
                y: this.y - other.y,
            });
        }

        /**
         * @override
         */
        public mul(scalar: number): Coord {
            return new Coord({
                dash: scalar * this.dash,
                bash: scalar * this.bash,
            });
        }
    }

    export namespace Coord {
        export type Bare = Readonly<{
            dash: number;
            bash: number;
        }>;
    }



    export class Grid {
        //
    }

}
