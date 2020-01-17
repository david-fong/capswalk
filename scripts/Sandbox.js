
const log = console.log;

// does a getter return an instance field searching up the prototype tree?
class A {
    a = 1;
    get A() {
        return this.a;
    }
}
class B extends A {
    a = 2;
    b = 3;
    c() { return this.a + this.b; }
    get B() { return this.B }
}
b = new B();
log(b.A);
// it does!

// what is the return value of the `+=` operator?
c = 5;
d = c += 2;
log(d);
// the evaluation of the right hand operand.

// testing behaviours of javascript `null`
log("" == null)
log("" + null)

// what is the length of an array with leading holes?
a = []
a[5] = "hi this is five"
log(a[5], a.length)
// one plus the index of the last defined entry.

// what is in the `undefined` key of a plain object?
e = [1, 2, 3,]
e[undefined] = 1;
log(e[undefined])
// whatever you make it to be... *heavy scared breathing*
// *r/perfectlycutscreams*

// does zero strictly equal undefined?
log(0 === undefined)
// no.

// does a functor return an object as it was captured at the functor's
// last definition? or does it return an object by referece?
const f = () => {
    return { e, };
}
log(f());
e.push("4")
log(f());
// darn. it does it by value... good to know.
// well, I guess that's the whole basis of Javascript OOP :/

// What is the truthiness of an empty array?
if ([]) {
    log("hi from truthy, empty array")
}
if (![].length) {
    log("expected empty array test via length field")
}

// Syntax for testing boolean object fields:
a = {
    "a": undefined,
    "b": false,
    "c": "truthy",
}
if (!a.a) log("good")
if (!a.b) log("good")
if (!a.c) log("bad")
a = undefined

// how to get object with no proto or methods- only instance fields?
console.log(new B())
b = new B();
console.log(Object.assign(Object.create(null), b)) // this is what I want. no methods included
delete b.__proto__; // this doesn't do anything
console.log(b)

// how does the "in" keyword work?
_in = { prop: true }
console.log("prop" in _in) // true
_in.prop = false;
console.log("prop" in _in) // true
_in.prop = undefined;
console.log("prop" in _in) // true O_o
delete _in.prop;
console.log("prop" in _in) // false

// does Object.values() for an instance include its prototypical methods?
// what about getters?
console.log(Object.values(new B()))
// nope nope.

debugger

