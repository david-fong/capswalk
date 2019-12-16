import { English } from "src/lang/impl/English";
import { Japanese } from "src/lang/impl/Japanese";
import { Korean } from "src/lang/impl/Korean";

export { Korean } from "src/lang/impl/Korean";


export namespace Lang {

    // const eng = English.getInstance();
    // console.log(eng);

    // const jpnH = Japanese.Hiragana.getInstance();
    // console.log(jpnH);

    // const jpnK = Japanese.Katakana.getInstance();
    // console.log(jpnK);

    const korD = Korean.Dubeolsik.getInstance();
    console.log(korD);
    console.log(korD["treeMap"].children);
    console.log(korD.simpleView());
    debugger;

}
