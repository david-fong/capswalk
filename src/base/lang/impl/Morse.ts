import { Lang } from "../Lang";


/**
 * # Morse
 *
 * `beep beep boop`
 */
export namespace Morse {

    /**
     *
     * You see letters and numbers and you type sequences of dots and dashes.
     */
    export class Encode extends Lang {
    }
    Object.freeze(Encode);
    Object.freeze(Encode.prototype);


    /**
     *
     * You see dots and dashes and you type alphanumeric characters.
     */
    export class Decode extends Lang {
    }
    Object.freeze(Decode);
    Object.freeze(Decode.prototype);
}
Object.freeze(Morse);
