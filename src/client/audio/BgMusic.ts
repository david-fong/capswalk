import { JsUtils } from ":defs/JsUtils";

/** */
export interface BgMusic {
	readonly desc: BgMusic.TrackDesc;
	play(): void;
	pause(): void;
	setLevel(level: number): void;
}

/** */
export async function MkBgMusic(trackId: BgMusic.TrackDesc["id"]): Promise<BgMusic> {
	let source: AudioBufferSourceNode;
	const desc = BgMusic.TrackDescs.find((desc) => desc.id === trackId)!;
	if (!desc) {
		throw new Error(`track with id \`${trackId}\` does not exist.`);
	}
	const context = new AudioContext({
		// https://devdocs.io/dom/audiocontextoptions
		latencyHint: "playback",
		sampleRate: desc.sampleRate,
	});

	/** audio buffers */
	const _abs = (await Promise.all(desc.trackDescs.map(async (trackDesc) => {
		// Fetch each track's audio file:
		const audioData = await fetch(`assets/audio/bg/${desc.id}/${trackDesc.filename}`)
			.then((res) => res.blob())
			.then((blob) => blob.arrayBuffer());
		return context.decodeAudioData(
			// Each buffer created from decoding is later copied into a
			// master buffer with many channels, and then discarded.
			audioData,
			undefined,
			(err) => { console.error("Error decoding audio data: " + err); },
		);
	}).freeze())).freeze();
	const _bigBufferNumChannels = _abs.reduce((sum, ab) => sum += ab.numberOfChannels, 0);
	const _bigBuffer = context.createBuffer(
		_bigBufferNumChannels,
		desc.bufferLength,
		desc.sampleRate,
	);

	const split = context.createChannelSplitter(_bigBufferNumChannels);
	const merge = context.createChannelMerger(_abs.length);

	let _bigBufferChannelIndex = 0;
	const layerFaders = _abs.map((ab, trackIndex) => {
		if (ab.sampleRate !== desc.sampleRate) {
			throw new Error("never");
		}
		const track = context.createChannelMerger(ab.numberOfChannels);
		const fader = context.createGain(); // https://devdocs.io/dom/gainnode
		fader.channelCount = ab.numberOfChannels;
		track.connect(fader);
		fader.connect(merge, 0, trackIndex);

		for (let i = 0; i < ab.numberOfChannels; i++) {
			const channelData = ab.getChannelData(i); // TODO.test should we use slice() to ensure correct length?
			_bigBuffer.copyToChannel(channelData, _bigBufferChannelIndex, i);
			split.connect(track, _bigBufferChannelIndex, i);
			_bigBufferChannelIndex++;
		}
		return fader;
	});
	const masterFader = context.createGain();
	merge.connect(masterFader);
	masterFader.connect(context.destination);

	function _reloadSource(): void {
		const _src = context.createBufferSource();
		_src.channelInterpretation = "discrete";
		_src.loop = true;

		_src.buffer = _bigBuffer;
		_src.connect(split);
		source = _src;
	}
	context.suspend();
	_reloadSource();
	return Object.freeze({
		desc: desc,
		play: function play(): void {
			// _reloadSource();
			// source.start();
			context.resume();
		},
		pause: function pause(): void {
			// source.stop();
			context.suspend();
		},
		setLevel: function setLevel(level: number): void {
			layerFaders; // TODO.impl
		},
	});
}
export namespace BgMusic {
	export type TrackDesc = Readonly<{
		/** Must be the same as the folder path. */
		id: string;
		displayName:    string;
		sampleRate:     number;
		bufferLength:   number;
		trackDescs: readonly {
			filename: string;
		}[];
	}>;
	export const TrackDescs: readonly TrackDesc[] = JsUtils.deepFreeze([{
		id:             "default",
		displayName:    "Default",
		sampleRate:     undefined!,
		bufferLength:   undefined!,
		trackDescs:     [],
	}]);
}
Object.freeze(BgMusic);