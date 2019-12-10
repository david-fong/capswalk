import { English } from "src/lang/impl/English";
import { Japanese } from "src/lang/impl/Japanese";


export namespace Lang {

    const eng = English.getInstance();
    console.log(eng);

    const jpnH = Japanese.Hiragana.getInstance();
    console.log(jpnH);

    const jpnK = Japanese.Katakana.getInstance();
    console.log(jpnK);

}
