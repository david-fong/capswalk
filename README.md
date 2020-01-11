
# ⌨🐍 SnaKey

There's nothing to show yet! But, you can try [**`an older, working version` 👈**](https://david-fong.github.io/SnaKey-JS/ "*boop*")

> Learning is hard, and that's what makes the process of doing it frustrating. Think back to the last time you tried to learn something new: maybe it was a sport, an instrument, how to make a kind of food, or a language. I for one, think of this project. But I can also say from other past experiences that the difficulty in tackling something new and unfamiliar is what makes its eventual fruit so sweet to enjoy.
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
- [My Joys in JavaScript and TypeScript](#my-joys-in-javascript-and-typescript)
  - [Bundling Constructor Arguments as Objects](#-bundling-constructor-arguments-as-objects)
  - [Type Aliases and Declaration Merging](#-type-aliases-and-declaration-merging)
- [Language Representation](#language-representation)

---

## My Goals and Why I do This

|      |                      |
|:----:|----------------------|
| 💡<br>I Love my Idea | And I champion it with the pride of a person whose eyes have never seen it done before. It may not have fallen out of the sky and hit me in the head, [but it kind of feels that way](https://www.ted.com/talks/ok_go_how_to_find_a_wonderful_idea). I strive to develop it and polish it into something that brings out the aspects of challenge and hidden fun from the process of learning something new. |
| 🍏<br>To Push Myself | To make my idea a reality, I need to learn new things: to search for _what_ I need to learn next, to learn about existing choices of tools and how to choose one, and then to learn the tool. First it was Python, and then vanilla web-development, and now, NodeJS, expressJS, SocketIO, VSCode, Typescript, esLint, and WebPack. It's a refreshing change compared to my experience learning in school: here, I start with a concrete goal in mind, and the goal is completely my own. |
| 💼<br>For the Portfolio | I aim to make something polished. That includes coding style and design, documentation, modularity, and compilation. I set out and bind myself to write readmes that share the interesting things that I learn and create. For all I know, my eyes may be the only ones that see this effort, but to me it is like keeping a house clean so that it's always ready for guests. Whether or not guests ever come, a clean house makes for a good house to live in. |

---

## 🚋 Looking Back and Looking Forward

This is a non-technical section to reflect on my previous work on this project, and for me to share what my general goals are for this version.

### 🐍 Version #1 - Born on a Python

<img src="assets/images/snakey_version1.PNG" align="left" width="300" />

I wrote [**version one**](https://github.com/david-fong/SnaKey) of this game in one week of the February of 2019 using Python. I had just finished [learning Python over the Winter break](https://github.com/david-fong/Tetris), and I wanted to do something original with it. I came up with the start of an idea spinning off of the classic snake game, with a twist on the movement mechanic: to move by typing.

I was inspired to add different languages came because I was taking a beginners' class in Japanese, and needed to learn its two basic alphabets. I really enjoyed that class- not just because I was interested in the content, but also because the professor was a kind person and a good teacher. Because of that experience, helping people practice language learning became a significant motivator for my continued work on this game.

I really enjoyed designing the game's rules and objectives. I drove the game design by the question _"How do I make it fun for a single player to keep moving around?"_. For the main objective, I decided on randomly spawned apples that could be collected for score points. To add a sense of ramping pressure, an enemy chaser, for a sense of competition, an enemy apple collector, and for extra challenge / reward, an enemy that would run away and push back the difficulty ramp whenever caught.

### 🕸 Version #2 - Slithering to the Web

<img src="assets/images/snakey_version2_hiragana.PNG" align="left" width="300" />

After finishing the first version, I excitedly showed my friends and Japanese prof, and quickly realized that the need to install Python was a severe accessibility hurdle. For that reason, during the following month of March, I learned how basic webpages are built up using HTML, JavaScript, and CSS, and I slowly worked on porting the game to be hosted on GitHub-Pages as [**version two **](https://github.com/david-fong/SnaKey-JS).

I wrote everything in pure vanilla HTML, Javascript, and CSS (on NotePad++). This helped me build a strong foundational understanding of how the basic technologies work, as opposed to what might have been the case if I started looking at various frameworks and transpiled languages right away. It has also made me appreciate the value of strong typing, and code-style conventions. Javascript is so slack when it comes to such basic things that it's easy to write things that don't read well or make much sense.

In this version, the game's underlying objectives, mechanics, and representation went largely unchanged, since unlike with the previous version where I had already learned the basics of the language and its engine, here I was back at square one. Most of my efforts went to searching through and exploring documentation on javascript's basic data structures, the browser DOM, and CSS. I found [w3c schools](https://www.w3schools.com/) and [MDN web docs](https://developer.mozilla.org/en-US/) to be great learning resources.

### 🌐 Version #3 - Snakes With Wings (You are Here)

This brings us to where we are now: November of 2019 and onward. The goal for this version is to push the game out to the world of internet-enabled multiplayer. Although I've recently gotten comfortable [working in the terminal environment](https://github.com/david-fong/Darcy), I decided to try using VSCode, and so far, I have been incredibly pleased with the results of that decision.

You might think that after making this game twice I'd be tired of it, but that couldn't be further from the truth. For one thing, I see so many opportunities to improve on my previous work. After all, learning has been a major motivation for this project from the start. In each version of this project, I try to make it more and more accessible to people. I for one, cannot wait for the day when I can sit down and play this game together with a group of friends, or perhaps even with complete strangers.

---

## 🛩 Design Challenges & Stepping up my Game

I envision this version to be the last remake- again, not at all because I'm tired of it, but because I finally have the tools and know-how to build up a maintainable code base. Both of the previous versions suffered from three main problems- largely due to me being new to the language. Before I can talk about those problems, solving them, and why solving them is necessary for this version, I need to talk about what makes this version so different.

One of the big design challenges for this project is to give the user the choice between playing on or off-line. I like this challenge because it really demands designing a good function API, and working with inheritence to share as much code as possible. This isn't a trivial task given an overview of what each piece of the picture needs to accomplish:

|                                            | Offline | Server | Client |
:-------------------------------------------:|:-------:|:------:|:------:|
| Maintain the master copy of the game state | :heavy_check_mark: | :heavy_check_mark: | :heavy_multiplication_x: |
| Display the game state via the browser DOM | :heavy_check_mark: | :heavy_multiplication_x: | :heavy_check_mark: |
| Use network operations to exchange events  | :heavy_multiplication_x: | :heavy_check_mark: | :heavy_check_mark: |

This means that the code that receives a request for something like player movement and performs validation must be in a separate function from that which enacts all changes to all parts of the game state that are affected by an acceptance of the request. In addition to that, SocketIO can only guarantee that application messages will arrive in order if the client is using websockets for its underlying transport, which, while common, is not an absolute given, and is indeed not the case before a temporary long-polling connection upgrades to use websockets. This means that these request processing and executing functions must use event-ID systems to handle out-of-order message arrivals.

### 🧗‍♀️ Stepping up my Game (pun intended)

Now that we understand why the design requires so much more care in this version, we can talk about the solving the problems plaguing the two earlier versions.

|        Topic        | The What and Why of the Problem | The Solution and its Necessity |
|:-------------------:|---------------------------------|--------------------------------|
| 📁<br>Modularity    | | |
| 🦆<br>Inheritance   | | Here, ideally, there should only be one interface to every class, and concrete implementations should carry as little weight as possible- mainly in how events are handled and how changes are displayed. Typescript enhances the inheritance-grammar of Javascript to the level of Java, for which I am grateful and excited. |
| 📄<br>Documentation | Unlike the other problems, this wasn't due to not knowing about or understanding how to use a language feature. Rather, it was a problem of values: At the time, writing documentation didn't feel like it mattered. The code was _relatively_ small and simple, and on top of that, I had no IDE to show documentation on mouseover, so any documentation I wrote wasn't even very accessible to me. | The solution here is to be intentional. And to be honest, I may not even need that. As the design becomes more complicated to address the new design requirements, I have a more critical need to clearly communicate a function's purpose. And as I design my function API's, I come across more situations where I need to make a judgement call on which functions in a call chain should handle certain functionalities. Writing good documentation allows me to stop wasting time reading my previous code to remember what it is being held responsible to do. |

---

## My Joys in JavaScript and TypeScript

In my experience with Java from school, Co-op, and [my own projects](https://github.com/david-fong/UbcCourseSchedulingTool), the things I have loved most about it are its strong specifications, how strong typing is baked into the grammar, and the resulting ability for good a IDE to make the task of writing code a better experience. That's why as I started breaking into TypeScript and eslint in this project, my heart felt like it was flying. Here, I want to share ways that I've been leveraging and combining Javascript and TypeScript features to make my code more flexible, organized, and better documented.

### 🍱 Bundling Constructor Arguments as Objects

This is something that can be done in plain Javascript. It serves three purposes:

|       |               |
|:-----:|---------------|
| Footprint Reduction | This nullifies problems with function signature bloat. Defining the shapes of objects and instantiating them is much less verbose in JavaScript than in Java, which makes it conventient and highly practical. |
| Flexibility | It makes constructor signatures incredibly malleable. If I need to add, remove, or change the type of an argument, I can modify the type definition and the relevant handler code and leave all other function-overrides and call sites untouched. |
| Explicit Argument Mapping | This makes it _very_ difficult to pass arguments in "the wrong order", because order is meaningless. All the cognitive effort is migrated to using good object-field and variable names, which is more intuitive and robust. |

### 🧩 Type Aliases and Declaration Merging

I have found aliasing primitives to be incredibly useful. A prime example is this project's Player.Id type: For one thing, it allows me to document a use-case-specific primitive type so I can get mouseover documentation anywhere it is used, and around January, it made what might have been an incredibly laborious refactoring task almost _easy_ when I changed that definition to be of object-type during an intermediate partial redesign.

Using TypeScript's declaration merging feature, type declarations can be namespaced: Instead of writing `export type PlayerId` in the global namespace, which pollutes the global type-declaration group and adds to visual clutter with module imports, I can write something like this (an older example):

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

In Java, you can't alias primitive types, [and that's final 🥁](https://stackoverflow.com/a/28238107/11107541). In C, you can alias anything, but you can only namespace them in C++. The ability to do all this in TypeScript sparks me a lot of joy.

---

## Language Representation

[See dedicated readme](src/base/lang/readme.md)
