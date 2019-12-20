import { Coord as AbstractCoord } from "../Coord";


export namespace Euclid2 {

    type B = Coord.Bare;

    export class Coord extends AbstractCoord<AbstractCoord.System.EUCLID2> implements B {

        public readonly x: number;
        public readonly y: number;

        public constructor(desc: B) {
            super(desc);
            this.x = desc.x;
            this.y = desc.y;
            Object.freeze(this);
        }

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
        public originTwoNorm(): number {
            return Math.sqrt((this.x ** 2) + (this.y ** 2));
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
                x: scalar * this.x,
                y: scalar * this.y,
            });
        }
    }

    export namespace Coord {
        // for local use:
        export type Bare = Readonly<{
            x: number;
            y: number;
        }>;
        // for Coord module:
        export namespace Bare {
            export const x: number = undefined!;
            export const y: number = undefined!;
        }
        // magical paranoid consistency:
        Bare as Bare;
    }



    export class Grid {
        //
    }

}
