import { Coord as AbstractCoord } from "../Coord";


export namespace Euclid2 {

    type B = Coord.Bare;

    export class Coord extends AbstractCoord<B> implements B {

        public declare readonly x: number;
        public declare readonly y: number;

        /**
         * @override
         */
        public equals(other: B): boolean {
            return (this.x === other.x) && (this.y === other.y);
        }

        /**
         * @override
         */
        public round(): Coord {
            return new Coord({
                x: Math.round(this.x),
                y: Math.round(this.y),
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
            x: number;
            y: number;
        }>;
    }



    export class Grid {
        //
    }

}
