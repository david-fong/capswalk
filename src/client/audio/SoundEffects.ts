

/**
 *
 */
// TODO.impl Keep the AudioBuffers because they can be reused
// (The BufferSourceNodes that contain them cannot).
export class SoundEffects {

    private readonly context: AudioContext;

    public constructor(sfxId: string) {
        const sfxDesc = SoundEffects.Descs.find((desc) => desc.id === sfxId)!;
        if (!sfxDesc) {
            throw new Error(`sfxDesc with id \`${sfxId}\` does not exist`);
        }
        const context = (this.context) = new AudioContext({
            latencyHint: "interactive",
            sampleRate: sfxDesc.sampleRate,
        });
    }
}
export namespace SoundEffects {
    export type Desc = Readonly<{
        id: string;
        sampleRate: number;
    }>;
    export const Descs: TU.RoArr<Desc> = Object.freeze([{
        id: "default",
        sampleRate: undefined!,
    },]);
}
Object.freeze(SoundEffects);
Object.freeze(SoundEffects.prototype);
