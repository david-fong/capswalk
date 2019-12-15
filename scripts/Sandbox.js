

// does a getter return an instance field searching up the prototype tree?
class A {
    a = 1;
    get A() {
        return this.a;
    }
}
class B extends A {
    a = 2;
}
b = new B();
console.log(b.A);
// it does!

// what is the return value of the `+=` operator?
c = 5;
d = c += 2;
console.log(d);
// the evaluation of the right hand operand.

// testing behaviours of javascript `null`
console.log("" == null)
console.log("" + null)

// what is the length of an array with leading holes?
a = []
a[5] = "hi this is five"
console.log(a[5], a.length)
// one plus the index of the last defined entry.

// what is in the `undefined` key of a plain object?
e = [1, 2, 3,]
e[undefined] = 1;
console.log(e[undefined])
// whatever you make it to be... *heavy scared breathing*
// *r/perfectlycutscreams*

// does zero strictly equal undefined?
console.log(0 === undefined)
// no.

// does a functor return an object as it was captured at the functor's
// last definition? or does it return an object by referece?
const f = () => {
    return { e, };
}
console.log(f());
e.push("4")
console.log(f());
// darn. it does it by value... good to know.
// well, I guess that's the whole basis of Javascript OOP :/

