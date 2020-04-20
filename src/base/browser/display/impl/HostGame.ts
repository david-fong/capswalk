import { Display } from '../Display';


export class HostGameDisplay extends Display {

    public constructor() {
        super();
    }
}
export namespace HostGameDisplay {
    // TODO.doc
    // This will not work. They would need to run webpack, which would
    // require installing developer dependencies... Should we eventually
    // publish this npm package containing only the built output?
    export const INSTRUCTIONS_STEPS = Object.freeze(<const>[
        "$ git clone https://github.com/david-fong/SnaKey-NTS",
        "$ npm install --production",
        "$ npm run start",
        "send the url to your friends",
        "when finished, kill the shell process with \"<ctrl-c>\"",
    ]);
}