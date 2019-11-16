import { SoundSettings } from "./Sound";


export abstract class GameSetting {

    abstract get selectedValue(): any;

}



/**
 * Non-Privileged (non-global) Settings:
 * - Volume / Mute
 * - Color theme
 */
export class LocalGameSettings {

    private static SINGLETON: LocalGameSettings = undefined;

    public static getInstance(): LocalGameSettings {
        if (LocalGameSettings.SINGLETON === undefined) {
            LocalGameSettings.SINGLETON = new LocalGameSettings();
        }
        return LocalGameSettings.SINGLETON;
    }

    public readonly sound: SoundSettings;



    private constructor() {
        this.sound = new SoundSettings();
    }

}


/**
 * Privileged (global) Settings:
 * - Pause button
 * - Restart button
 * - Game dimensions (requires reset)
 * - Lang selection (requires reset)
 * - Balancing Scheme
 * - Spice button
 * - Difficulty
 */
export class GlobalGameSettings {

    public langBalancingScheme: GameSetting; // TODO: create class and use its type here.

}
