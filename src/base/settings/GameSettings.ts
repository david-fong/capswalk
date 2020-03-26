import { SoundSettings } from "./Sound";


export abstract class GameSetting {

    abstract get selectedValue(): any;

}



/**
 * Follows a singleton pattern since it is bound with parts of the UI
 * and sets up and maintains those elements.
 *
 * Non-Privileged (non-global) Settings:
 * - Volume / Mute
 * - Color theme
 */
export class LocalGameSettings {

    private static SINGLETON?: LocalGameSettings = undefined;

    public static getInstance(): LocalGameSettings {
        if (!LocalGameSettings.SINGLETON) {
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
 * Follows a singleton pattern since it is bound with parts of the UI
 * and sets up and maintains those elements.
 *
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

    private static SINGLETON?: GlobalGameSettings = undefined;

    public static getInstance(): GlobalGameSettings {
        if (!GlobalGameSettings.SINGLETON) {
            GlobalGameSettings.SINGLETON = new GlobalGameSettings();
        }
        return GlobalGameSettings.SINGLETON;
    }

    public langBalancingScheme: GameSetting; // TODO: create class and use its type here.

}
