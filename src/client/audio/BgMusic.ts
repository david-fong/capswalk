import { JsUtils } from "defs/JsUtils";


/**
 *
 */
export class BgMusic {

    public readonly desc: BgMusic.TrackDesc;

    private readonly context:           AudioContext;
    private readonly source:            AudioBufferSourceNode;
    private readonly sourceBuffer:      AudioBuffer;
    private readonly sourceDestination: AudioNode;
    private readonly layerFaders:       TU.RoArr<GainNode>;
    private readonly masterFader:       GainNode;

    public constructor(trackId: BgMusic.TrackDesc["id"]) {
        this.desc = BgMusic.TrackDescs.find((desc) => desc.id === trackId)!;
        if (!this.desc) {
            throw new Error(`track with id \`${trackId}\` does not exist.`);
        }
        const context = this.context = new AudioContext({
            // https://devdocs.io/dom/audiocontextoptions
            latencyHint: "playback",
            sampleRate: this.desc.sampleRate,
        });
        JsUtils.propNoWrite(this as BgMusic, ["desc", "context",]);

        Promise.all(this.desc.trackDescs.map(async (trackDesc) => {
            // Fetch each track's audio file:
            return fetch(`assets/audio/bg/${this.desc.id}/${trackDesc.filename}`)
            .then((res) => res.blob())
            .then((blob) => blob.arrayBuffer())
            .then((audioData) => context.decodeAudioData(
                // Each buffer created from decoding is later copied into a
                // master buffer with many channels, and then discarded.
                audioData,
                (buffer) => {},
                (err) => { console.error("Error decoding audio data: " + err); },
            ));
        })).then((abs) => {
            const bigBufferNumChannels = abs.reduce((sum, ab) => sum += ab.numberOfChannels, 0);
            const bigBuffer = context.createBuffer(
                bigBufferNumChannels,
                this.desc.bufferLength,
                this.desc.sampleRate,
            );
            // @ts-expect-error : RO=
            this.sourceBuffer = bigBuffer;

            const split = context.createChannelSplitter(bigBufferNumChannels);
            const merge = context.createChannelMerger(this.layerFaders.length);
            // @ts-expect-error : RO=
            this.sourceDestination = split;

            let bigBufferChannelIndex = 0;
            // @ts-expect-error : RO=
            this.layerFaders = abs.map((ab, trackIndex) => {
                if (ab.sampleRate !== this.desc.sampleRate) {
                    throw new Error("never");
                }
                const track = context.createChannelMerger(ab.numberOfChannels);
                const fader = context.createGain(); // https://devdocs.io/dom/gainnode
                fader.channelCount = ab.numberOfChannels;
                track.connect(fader);
                fader.connect(merge, 0, trackIndex);

                for (let i = 0; i < ab.numberOfChannels; i++) {
                    const channelData = ab.getChannelData(i); // TODO.test should we use slice() to ensure correct length?
                    bigBuffer.copyToChannel(channelData, bigBufferChannelIndex, i);
                    split.connect(track, bigBufferChannelIndex, i);
                    bigBufferChannelIndex++;
                }
                return fader;
            });
            // @ts-expect-error : RO=
            this.masterFader = context.createGain();
            merge.connect(this.masterFader);
            this.masterFader.connect(context.destination);

            JsUtils.propNoWrite(this as BgMusic, [
                "source",
                "sourceBuffer",
                "sourceDestination",
                "layerFaders",
                "masterFader",
            ]);
        });
    }

    private _reloadSource(): void {
        const source = this.context.createBufferSource();
        source.channelInterpretation = "discrete";
        source.loop = true;

        source.buffer = this.sourceBuffer;
        source.connect(this.sourceDestination);
        // @ts-expect-error : RO=
        this.source = source;
    }

    public play(): void {
        this._reloadSource();
        this.source.start();
    }

    public pause(): void {
        this.source.stop();
    }
}
export namespace BgMusic {
    export type TrackDesc = Readonly<{
        /**
         * Must be the same as the folder path.
         */
        id: string;
        displayName:    string;
        sampleRate:     number;
        bufferLength:   number;
        trackDescs: TU.RoArr<{
            filename: string;
        }>;
    }>;
    export const TrackDescs: TU.RoArr<TrackDesc> = JsUtils.deepFreeze([{
        id:             "default",
        displayName:    "Default",
        sampleRate:     undefined!,
        bufferLength:   undefined!,
        trackDescs: [],
    },]);
}
Object.freeze(BgMusic);
Object.freeze(BgMusic.prototype);