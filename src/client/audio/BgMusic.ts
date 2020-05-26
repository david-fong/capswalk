

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
        const tracksDesc = this.desc;
        const context = this.context = new AudioContext({
            // https://devdocs.io/dom/audiocontextoptions
            latencyHint: "playback",
            sampleRate: tracksDesc.sampleRate,
        });
        Promise.all(tracksDesc.trackDescs.map(async (trackDesc) => {
            // Fetch each track's audio file:
            return fetch(`assets/audio/bg/${tracksDesc.id}/${trackDesc.filename}`)
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
                tracksDesc.bufferLength,
                tracksDesc.sampleRate,
            );
            (this.sourceBuffer as AudioBuffer) = bigBuffer;

            const split = context.createChannelSplitter(bigBufferNumChannels);
            const merge = context.createChannelMerger(this.layerFaders.length);
            (this.sourceDestination as AudioNode) = split;

            let bigBufferChannelIndex = 0;
            (this.layerFaders as BgMusic["layerFaders"]) = abs.map((ab, trackIndex) => {
                if (ab.sampleRate !== tracksDesc.sampleRate) {
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
            (this.masterFader as GainNode) = context.createGain();
            merge.connect(this.masterFader);
            this.masterFader.connect(context.destination);
        });
    }

    private reloadSource(): void {
        const source = this.context.createBufferSource();
        source.channelInterpretation = "discrete";
        source.loop = true;

        source.buffer = this.sourceBuffer;
        source.connect(this.sourceDestination);
        (this.source as AudioBufferSourceNode) = source;
    }

    public play(): void {
        this.reloadSource();
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
    export const TrackDescs: TU.RoArr<TrackDesc> = Object.freeze([{
        id:             "default",
        displayName:    "Default",
        sampleRate:     undefined!,
        bufferLength:   undefined!,
        trackDescs: [],
    },]);
}
Object.freeze(BgMusic);
Object.freeze(BgMusic.prototype);
