import { English } from "base/lang/impl/English";
import { Japanese } from "base/lang/impl/Japanese";
import { Korean } from "base/lang/impl/Korean";


export namespace Lang {

    // const eng = English.getInstance();
    // console.log(eng);

    // const jpnH = Japanese.Hiragana.getInstance();
    // console.log(jpnH);

    // const jpnK = Japanese.Katakana.getInstance();
    // console.log(jpnK);

    const korD = Korean.Dubeolsik.getInstance();
    korD.reset();
    console.log(korD.simpleView());
    debugger;

}
