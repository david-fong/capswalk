
# ⌨🐍 SnaKey

There's nothing to show yet! But, you can try [**`an older, working version` 👈**](https://david-fong.github.io/SnaKey-JS/ "*boop*")

> Learning is hard, and that's what makes the process of doing it frustrating. Think back to the last time you tried to learn something new. Maybe it was a sport, or an instrument, or a kind of food, or a language. I can vouch for that by nearly every commit in this repository. But I can also say from other past experiences that the difficulty in tackling something new and unfamiliar is what makes its eventual fruit so sweet to enjoy.
>
> If I want to get across one message through this project, it is to _be kind to beginners_- whether that is to another person or to yourself. When I get frustrated learning something, I find myself needing to mentally recite that _"I'm not stupid- I'm just learning"_.
>
> People only get good at things by perseverance. I think it's good to remember that for ourselves. Just think how a simple spin on any professional's activity can throw them out of the benefit of their finely tuned habits: Flip a musician's instrument, or a driver's steering, or your own keyboard layout. The massive dexterity gap between our dominant and non-dominant hand is a daily testament of where learning can take us.
>
> Learning is difficult. It just is. But we overcome it.

TODO: insert a gif of the gameplay here.

At its core, SnaKey is a typing game where you move around by typing keyboard sequences corresponding to characters from written languages. For example, playing with English, if there was a tile adjacent to your player character marked by the written character "a", to move on it, you would type the keyboard sequence "a". If you were playing with Japanese Hiragana, you would type the keyboard sequence "no" to move onto an adjacent tile marked by the written character "の". It's easier done than said.

SnaKey drew some initial inspiration from the well-known [Snake Game](https://wikipedia.org/wiki/Snake_(video_game_genre)), hence its name, which is a pun on the words "snake" and "keyboard".

## Contents

- [Contents](#contents "Legends say they are still clicking to this very day.")
- [My Goals and Why I do This](#my-goals-and-why-i-do-this)
- [Looking Back and Looking Forward](#-looking-back-and-looking-forward)
  - [Version #1 - Born on a Python](#-version-1---born-on-a-python)
  - [Version #2 - Slithering to the Web](#-version-2---slithering-to-the-web)
  - [Version #3 - Snakes With Wings](#-version-3---snakes-with-wings-you-are-here)
- [Design Challenges & Stepping up my Game](#-design-challenges--stepping-up-my-game "pun intended")
- [My Joy in TypeScript](#---my-joy-in-typescript)
  - [Bundling Constructor Arguments as Objects](#-bundling-constructor-arguments-as-objects)
  - [Type Aliases and Declaration Merging](#-type-aliases-and-declaration-merging)
- [Language Representation](#language-representation)

---

## My Goals and Why I do This

### 💡 I Love my Idea

And I champion it with the pride of a person with eyes never having seen it been done before. It may not have fallen out of the sky and hit me in the head, but [it kind of feels that way](https://www.ted.com/talks/ok_go_how_to_find_a_wonderful_idea). I strive to develop and polish it into something that brings out the aspects of fun and challenge from the process of learning something new.

### 🍏 To Push Myself

To make my idea a reality, I need to learn new things: to search for _what I need to learn next_, to learn about existing choices of tools and how to choose one, and then to learn the tool. First it was Python, and then it was vanilla web-development, and now, it's NodeJS, expressJS, SocketIO, VSCode, Typescript, esLint, and WebPack. This is a refreshing change when compared to my experience with learning in school: here, I learn to fill an existing need- I start with a concrete goal in mind.

### 💼 For the Portfolio

I aim to make something polished. That includes coding style and design, documentation, modularity, and compilation. I set out and bind myself to write readmes that share the interesting things that I learn and create. For all I know, my eyes may be the only ones that see this effort, but to me it is like keeping a house clean so that it's always ready for guests. Whether or not guests ever come, a clean house makes for a good house to live in.

---

## 🚋 Looking Back and Looking Forward

This is a non-technical section to reflect on my previous work on this project, and for me to share what my general goals are for this version.

### 🐍 Version #1 - Born on a Python

<img src="assets/images/snakey_version1.PNG" align="left" width="300" />

I wrote the bulk of [the first version of this game](https://github.com/david-fong/SnaKey) in the February of 2019 using Python. At the time, I had pretty much just finished [learning Python over the Winter break](https://github.com/david-fong/Tetris), and I wanted to do something original with it. I came up with the start of an idea spinning off of the classic snake game, with a twist on the movement mechanic: to move by typing. In this version, there were color themes, basic language support (Japanese Hiragana and Katakana), and basic computer-opponents.

The idea of adding different languages came because I was taking a beginners' class in Japanese, and needed to learn its two basic alphabets. I really enjoyed that class- not just because I was interested in the content, but also because the professor was a kind person and a good teacher. Helping people practice recognizing characters from other languages has become a big motivator for my continued work on this game- for a significant part due to the positive experience I had learning Japanese at the beginners' level.

A major theme for this version was baseline design. I came up with a representation for language mappings, maintaining necessary invariants, and designing movement algorithms for the artificially controlled opponents. I also spent a lot of effort designing the game objective to motivate the player to keep moving around: The player would accumulate score points by landing on tiles highlighted in green. A pink computer-player would chase the player, ending the game if it caught them, while a blue computer-player would compete with the player for score. The pink chaser would slowly get faster, so there was a yellow computer-player that would run away from the player, bumping the chaser's speed back down a notch if the player at any time was able to catch it.

### 🕸 Version #2 - Slithering to the Web

<img src="assets/images/snakey_version2_hiragana.PNG" align="left" width="300" />

I finished that version, and excitedly showed my friends and my Japanese prof. Some were pretty enthusiastic about it. My prof was interested, but didn't have Python. I realized that accessibility was a big limiting factor with the first version. So out of a desire to change that, I started reading about how basic webpages are built up using HTML, JavaScript, and CSS, and I slowly worked on porting the game to be hosted on the web via GitHub-Pages as [the second version of this game](https://github.com/david-fong/SnaKey-JS).

In this version, which I wrote the bulk of in March of 2019, I wrote everything using NotePad++, and used pure HTML, Javascript, and CSS. Looking back, I think this really set me up with a good foundational understanding of how vanilla javascript works, as opposed to what might have been the case if I started looking at various frameworks and transpiling languages right away. It has also made me appreciate the value of strong typing, and choosing conventions for things such as naming. Javascript is really so slack when it comes to such basic things that it's easy to write things that don't read well or make much sense.

Learning was a major theme of my work in this version. Unlike the first version where I had already learned the basics of the language and how it runs, here I was learning from scratch all over again. The majority of my efforts went to learning how to port over the behaviour of the previous version by reading documentation on the interfaces to javascript's basic data structures, manipulating the browser DOM, and working with CSS. I found [w3c schools](https://www.w3schools.com/) and [MDN web docs](https://developer.mozilla.org/en-US/) to be great learning resources. In this version, there were very few changes to the game's underlying representation, objectives, and mechanics.

### 🌐 Version #3 - Snakes With Wings (You are Here)

This brings us to where we are now- around November of 2019. The leading goal of this version is to push the game out to the world of internet-enabled multiplayer. Although I've recently gotten comfortable [working in the terminal environment](https://github.com/david-fong/Darcy), for this project, I decided to try using VSCode, since it looked like it would offer good intellisense for TypeScript, which I was looking to learn to use. I spent significant time learning how to set up linting for TypeScript with VSCode, and learning about ES6's native module system. I was really impressed with how good the integration is between VSCode and various plugins and typing constructs.

You might think that after making this game twice I'd be tired of it. But that's not at all the case. For one thing, I see so many opportunities to improve on my previous work. After all, learning has been a major motivation for this project from the start. In each version of this project, I try to make it more and more accessible to people. I for one, cannot wait for the day when I can sit down and play this game together with a group of friends or perhaps even with complete strangers.

---

## 🛩 Design Challenges & Stepping up my Game

I envision this version to be the last remake- again, not at all because I'm tired of it, but because I finally have the tools and know-how to build up a maintainable code base. Both of the previous versions suffered from three main problems- largely due to me being new to the language. Before I can talk about those problems, solving them, and why solving them is necessary for this version, I need to talk about what makes this version so different.

One of the big challenges for this project is to give the user the choice between playing completely offline (after fetching all the game's HTTP objects), and playing online. I like this challenge because it really demands designing a good function API, and working with inheritence to share as much code as possible. This isn't a trivial task given an overview of what each piece of the picture needs to accomplish:

|                                            | Offline | Server | Client |
:-------------------------------------------:|:-------:|:------:|:------:|
| Maintain the master copy of the game state | :heavy_check_mark: | :heavy_check_mark: | :heavy_multiplication_x: |
| Display the game state via the browser DOM | :heavy_check_mark: | :heavy_multiplication_x: | :heavy_check_mark: |
| Use network operations to exchange events  | :heavy_multiplication_x: | :heavy_check_mark: | :heavy_check_mark: |

This means that the code that receives a request for something like player movement and performs validation must be in a separate function from that which enacts all changes to all parts of the game state that are affected by an acceptance of the request. In addition to that, SocketIO can only guarantee that application messages will arrive in order if the client is using websockets for its underlying transport, which, while common, is not an absolute given, and is indeed not the case before a temporary long-polling connection upgrades to use websockets. This means that these request processing and executing functions must use event-ID systems to handle out-of-order message arrivals.

### 🧗‍♀️ Stepping up my Game (pun intended)

Now that we understand the start of why the design requires so much more care in this version, we can talk about the solving the problems plaguing the two earlier versions.

|        Topic        | The What and Why of the Problem | The Solution and its Necessity |
|:-------------------:|---------------------------------|--------------------------------|
| 📁<br>Modularity    | | |
| 🦆<br>Inheritance   | | Here, ideally, there should only be one interface to every class, and concrete implementations should carry as little weight as possible- mainly in how events are handled and how changes are displayed. Typescript enhances the inheritance-grammar of Javascript to the level of Java, for which I am grateful and excited. |
| 📄<br>Documentation | Unlike the other problems, this wasn't due to not knowing about or understanding how to use a language feature. Rather, it was a problem of values: At the time, writing documentation didn't feel like it mattered. The code was _relatively_ small and simple, and on top of that, I had no IDE to show documentation on mouseover, so any documentation I wrote wasn't even very accessible to me. | The solution here is to be intentional. And to be honest, I may not even need that. As the design becomes more complicated to address the new design requirements, I have a more critical need to clearly communicate a function's purpose. And as I design my function API's, I come across more situations where I need to make a judgement call on which functions in a call chain should handle certain functionalities. Writing good documentation allows me to stop wasting time reading my previous code to remember what it is being held responsible to do. |

---

## 🤸‍♂️ My Joy in TypeScript

In all my experience working with Java (Ie. my first semester of second year uni, my first COOP terms of 4 months, and [in another of my main personal projects](https://github.com/david-fong/UbcCourseSchedulingTool)), The things I have loved most about it are its strong language spec, how strong typing is baked into the grammar, and the resulting ability for good a IDE to make the task of writing code a better experience. That's why as I started breaking into TypeScript and eslint in this project, my heart felt like it was flying.

Here, I want to share ways that I've been leveraging and combining Javascript and TypeScript features to make my code more flexible, organized, and better documented, and what I think those features have over Java. To be clear, I'm not trying to throw dirt at Java. As I said, the whole reason for my love-at-first-sight feeling with TypeScript was that it allowed me to write code like I can in Java. What I'm trying to do here is share things that excite me about TypeScript, and how it adds to my development experience in a way that Java cannot. I could just the same do the reverse, but that's not the point of this section.

### 🍱 Bundling Constructor Arguments as Objects

This is something that can be done in plain Javascript. It serves three purposes:

#### 👣 Footprint Reduction

This basically nullifies any problems with function signature bloat. Compared to Java, creating and defining the shapes of objects in JavaScript is much less verbose, so using this technique is convenient. This comes at the cost of writing more code (specifying field-names in addition to values) when calling constructors, but if a constructor is called seldomly, and the inheritence heirarchy is large with next-to-identical constructor signatures, then you come out on the winning side.

#### 🧘‍♂️ Flexibility

It makes constructor signatures incredibly malleable. If I need to add, remove, or change the type of an argument, I can simply modify the object bundle and the relevant handler code, and leave the rest of the uctors of extending classes untouched. I discovered this out of need: If you traverse [the entire `Player` class tree](src/base/player), there are at least eight constructors, and therefore at least the same number of sites where such constructors are called. Could you solve this particular issue by using a good IDE? Yes. But reduced reliance on an IDE for refactoring means less hassle; Not all IDE's are good at function signature refactoring, especially when it comes to [the duck-typing model](https://en.wikipedia.org/wiki/Duck_typing).

#### 📛 Explicit Argument Mapping

Unlike passing arguments in an argument list, this requires wrapping arguments in an object, where mapping the value from the argument / object-field name is mandatory. This makes it _very_ difficult to pass arguments in "the wrong order", because now order is meaningless. All the cognitive effort is migrated to using good object-field and variable names, which is much more intuitive and robust.

---

### 🧩 Type Aliases and Declaration Merging

Get this- you can type alias a primitive type to give it a name suited to a use-case, and then _document it_. A prime example of the difference this makes in this project is in the `Player.Id` type. It aliases to mean a number. Each player has a unique ID, and there are semantics to value ranges: Strictly negative values are for computer-controlled players, strictly positive values for human-controlled players, and the value zero to indicate that a Tile has no occupant.

#### 🔢 Documenting Primitives

Type Aliases in TypeScript are very much like the `typedef` keyword in C: They allow you to give a type annotation a meaningful name, and to centralize documentation on the semantics of fields and variables of that type. When documenting function arguments, sometimes it is even enough to just let the type annotation do the talking.

#### 📦 "Scoped" TypeDefs and Constants

Using TypeScript's declaration merging capabilities, type declarations can be put under a namespace. Instead of writing `export type PlayerId` outside of a namespace, which pollutes the global type-declaration group and adds to module-import clutter, I can write something like:

```typescript
// <docuentation>
export class Player {
    idNumber: Player.Id;
    <...>
}
export namespace Player {
    // <documentation>
    export type Id = number;
    export namespace Id {
        // <documentation>
        export const NULL = 0;
    }
}
```

The example shows how namespace merging allows you to scope type declarations, and make it look like they declare special constants. With fields like usernames, this can be used to scope regular expression checkers under the type alias. In Java, you can't alias primitive types, [and that's final (🥁)](https://stackoverflow.com/a/28238107/11107541). In C, you can alias anything, but you can't scope type definitions unless you are using C++. In TypeScript, you can do both, and I think that's super cool.

---

## Language Representation

[See dedicated readme](src/base/lang/readme.md)
