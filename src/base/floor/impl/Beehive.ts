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

    export class Coord extends AbstractCoord<B> implements B {

        public declare readonly dash:  number;
        public declare readonly slash: number;

        public constructor(desc: B) {
            super(desc);
        }

        /**
         * @override
         */
        public equals(other: B): boolean {
            return (this.dash === other.dash) && (this.slash === other.slash);
        }

        /**
         * @override
         */
        public round(): Coord {
            // TODO: is this correct? I don't think so...
            return new Coord({
                dash:  Math.round(this.dash),
                slash: Math.round(this.slash),
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
        public originalTwoNorm(): number {
            return Math.sqrt((this.x ** 2) + (this.y ** 2));
        }

        /**
         * @override
         */
        public originalInfNorm(): number {
            return Math.max(Math.abs(this.x), Math.abs(this.y));
        }

        /**
         * @override
         */
        public originalAxialAlignment(): number {
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
                x: scalar * this.x,
                y: scalar * this.y,
            });
        }
    }

    export namespace Coord {
        export type Bare = Readonly<{
            dash:  number;
            slash: number;
        }>;
    }



    export class Grid {
        //
    }

}
