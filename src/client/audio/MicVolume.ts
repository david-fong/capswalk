
/** Number of times to call the callbacks per second */
const SAMPLE_RATE = 5;

/** */
export async function MicVolume(callback: (vol: number) => void): Promise<void> {
	const context = new AudioContext({ latencyHint: "playback", sampleRate: 8_000.0 });
	const analyser = context.createAnalyser();
	analyser.fftSize = 2 ** 5; // gives the least freq-domain data and the most time-domain data.
	analyser.smoothingTimeConstant = 0.02;

	const freqData = new Uint8Array(analyser.frequencyBinCount);
	try {
		// Get mic and send to analyser
		const stream  = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
		const mic = context.createMediaStreamSource(
			stream,
		);
		mic.connect(analyser);
		setInterval(() => {
			analyser.getByteFrequencyData(freqData);
			callback(freqData.reduce((sum, x) => sum + x) / freqData.length / 255);
		}, 1000.0 / SAMPLE_RATE);
		context.resume();
	} catch (e) {
		void e; // yeet
	}
}