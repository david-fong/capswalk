// This is a script to infer the frequency that a character
// has no final jamo, since the datasets I found didn't
// include such information.
// It uses a list of the top 1000 most common words/phrases.
const UNICODE_BASE = 0xAC00;
const NUM_FINALS = 28; // including when there is no final.
const FILENAME = "Korean1000";

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const fileStream = fs.createReadStream(path.resolve(__dirname, FILENAME + ".txt"));
const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
});
let withoutFinals = 0;
let total = 0;
(async () => {
    for await (const line of rl) {
        for (const char of line) {
            const offset = char.charCodeAt(0) - UNICODE_BASE;
            if (offset < 0) {
                console.log(char);
                continue;
            }
            if (offset % (NUM_FINALS) === 0) {
                withoutFinals++;
            }
            total++;
        }
    }
})().then(() => {
    console.log(withoutFinals / total);
});