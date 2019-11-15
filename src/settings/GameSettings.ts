import { SoundSettings } from "./Sound";


/**
 * Non-Privileged (non-global) Settings:
 * - Volume / Mute
 * - Color theme
 */
export class NonPrivilegedSettings {

    public readonly sound: SoundSettings;

}



/**
 * Privileged (global) Settings:
 * - Pause button
 * - Restart button
 * - Lang selection
 * - Spice button
 * - Difficulty
 */
export class PrivilegedSettings {

    public langBalancingScheme: GameSetting; // TODO: create class and use its type here.

}

export abstract class GameSetting {

    abstract get selectedValue(): any;

}
