#!/usr/bin/env node

// curl this from https://norvig.com/ngrams/count_2l.txt
const FILENAME = "ngram3";
const NUM_ENTRIES = 400;

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const fileStream = fs.createReadStream(path.resolve(__dirname, FILENAME + ".txt"));
const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
});
let sum = 0;
let num = 0;
const dict = {};
(async () => {
    for await (const line of rl) {
        let [gram,count] = line.split(/\s/);
        count = Number.parseFloat(count);
        sum += count;
        dict[gram] = count;
        if (++num === NUM_ENTRIES) break;
    }
})().then(() => {
    for (const gram in dict) {
        dict[gram] = +(dict[gram] * 1000 / sum).toFixed(3);
    }
    fs.writeFileSync(path.resolve(__dirname, FILENAME + ".ts"),
        "import { JsUtils } from \"../../../defs/JsUtils\";"
        + "\nexport default JsUtils.deepFreeze("
        + JSON.stringify(dict, null, "  ")
        + ");",
    );
});