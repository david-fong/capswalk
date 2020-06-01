import { English } from "base/lang/impl/English";
import { Japanese } from "base/lang/impl/Japanese";
import { Korean } from "base/lang/impl/Korean";


export namespace Lang {
    // PRINT ALL THE LANGS !!!
    [
        English.Lowercase,
        English.MixedCase,
        Japanese.Hiragana,
        Japanese.Katakana,
        Korean.Dubeolsik,
        Korean.Sebeolsik,
        Korean.Romanization,
    ]
    .forEach((langImpl) => {
        const inst = new (langImpl)(1.0);
        inst.reset();
        console.log(inst.simpleView());
        debugger;
    });
}
