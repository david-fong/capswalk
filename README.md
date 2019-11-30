
# 🐍⌨ SnaKey

[click here to play](index.html)

At its core, SnaKey is a typing game where you move by typing keyboard sequences corresponding to characters from written languages. For example, playing with English, if there was a tile adjacent to your player character with the written character "a", to move on it, you would type the keyboard sequence "a". If you were playing with Japanese, you would type the keyboard sequence "no" to move onto an adjacent "の". It draws some inspiration from the well-known [Snake Game](https://wikipedia.org/wiki/Snake_(video_game_genre)), hence its name.

## Contents

- [My Goals and Why I do This](#my-goals-and-why-i-do-this)
- [Looking Back and Looking Forward](#🚋-looking-back-and-looking-forward)
  - [Version #1 - Born on a Python](#version-1---born-on-a-python)
  - [Version #2 - Slithering to the Web](#version-2---slithering-to-the-web)
  - [Version #3 - Snakes With Wings](#version-3---snakes-with-wings-you-are-here)
- [Design Challenges & Stepping up my Game](#design-challenges-&-stepping-up-my-game "pun intended")
- [Language Representation](#language-representation)
  - [Language Size Requirements](#language-size-requirements)
  - [Effective Shuffling With Trees](#effective-shuffling-with-trees)

## My Goals and Why I do This

For me, there are three purposes and goals for my continued work on this project (listed in order of precedence):

### 💡 1. I have an idea that matters to me and I want to champion it

I like the idea of this game. Although it didn't fall out of the sky and hit me in the head, [it kind of feels that way](https://www.ted.com/talks/ok_go_how_to_find_a_wonderful_idea). And while I don't know for a fact whether or not anything exactly like it has ever been made, it has the added thrill of at least being something that I have never seen anyone do or been asked to do, and that I am not simultaneously trying to solve separately with more than sixty other people that I see every day.

### 🍏 2. I want to learn and push myself

This is not a pure goal, but one that comes naturally from having one. That is- to achieve my goal of make my idea a reality, I need to learn. First I need to learn what I need to learn to achieve my goal, and read up enough on my choices to make a basic educated decision on what technologies to learn, and then I need to learn them. First it was Python, and then it was HTML, Javascript, and CSS. Now, it's NodeJS, expressJS, SocketIO, VSCode, eslint, and Typescript.

One of the plus sides of pushing myself in this way is that historically, it has always come in handy later in school assignments where I would otherwise be learning these things from scratch. The nicest thing about having a pure goal is that it takes a lot of the drag out of learning. One thing I feel a little tired of in my experience with school is how the technical material often seems to steal the spotlight from pure goals and applications. It's refreshing to start with a goal at the forefront of my mind.

### 💼 3. I want to build up my portfolio

By this, I mean that I aim to make something polished, and that communicates the journey of the design and the interesting parts of the design itself. This is because I expect that the things I make and learn will not only transfer to some benefit in school-related work, but also in wherever I go during COOP terms and after graduation. While this is the least of my goals, that isn't to say that it doesn't change my approach to my work. The intent I have to share my process and design in addition to the final product gives me the extra motivation to to do things like write good documentation. It's like keeping a house clean so it's always ready for guests.

## 🚋 Looking Back and Looking Forward

This is a non-technical section to reflect on my previous work on this project, and for me to share what my general goals are for this version.

### Version #1 - Born on a Python

<img src="assets/images/snakey_version1.PNG" align="left" width="300" />

I wrote the bulk of [the first version of this game](https://github.com/david-fong/SnaKey) in the February of 2018 using Python. At the time, I had pretty much just finished [learning Python over the Winter break](https://github.com/david-fong/Tetris), and I wanted to do something original with it. I came up with the start of an idea spinning off of the classic snake game, with a twist on the movement mechanic: to move by typing. In this version, there were color themes, basic language support (Japanese Hiragana and Katakana), and basic computer-opponents.

The idea of adding different languages came because I was taking a beginners class in Japanese, and needed to learn its two basic alphabets. I really enjoyed that class- not just because I was interested in the content, but also because the prof was a kind person and a good teacher. Helping people practice recognizing characters from other languages has become a big motivator for my continued work on this game.

A major theme for this version was baseline design. I came up with a representation for language mappings, maintaining necessary invariants, and designing movement algorithms for the artificially controlled opponents. I also spent a lot of effort designing the game objective to motivate the player to keep moving around: The player would accumulate score points by landing on tiles highlighted in green. A pink computer-player would chase the player, ending the game if it caught them, while a blue computer-player would compete with the player for score. The pink chaser would slowly get faster, so there was a yellow computer-player that would run away from the player, bumping the chaser's speed back down a notch if the player caught it.

### Version #2 - Slithering to the Web

<img src="assets/images/snakey_version2_hiragana.PNG" align="left" width="300" />

I finished that version, and excitedly showed my friends and my Japanese prof. Some were pretty enthusiastic about it. My prof was interested, but didn't have Python. I realized that accessibility was a big limiting factor with the first version. So, I started reading about how basic webpages are built up using HTML, JavaScript, and CSS, and I slowly worked on porting the game to be hosted on the web via GitHub-Pages as [the second version of this game](https://github.com/david-fong/SnaKey-JS).

In this version, which I wrote the bulk of in March of 2018, I wrote everything using NotePad++, and used pure HTML, Javascript, and CSS. Looking back, I think this really set me up with a good foundational understanding of how vanilla javascript works, as opposed to what might have been the case if I started looking at various frameworks and transpiling languages right away. It has also made me appreciate the value of strong typing, and choosing conventions for things such as naming. Javascript is really so slack when it comes to such basic things that it's easy to write things that don't read well or make much sense.

Learning was a major theme of my work in this version. Unlike the first version where I had already learned the basics of the language and how it runs, here I was learning from scratch all over again. The majority of my efforts went to learning how to port over the behaviour of the previous version by reading documentation on the interfaces to javascript's basic data structures, manipulating the browser DOM, and working with CSS. I found [w3c schools](https://www.w3schools.com/) and [MDN web docs](https://developer.mozilla.org/en-US/) to be great learning resources. In this version, there were very few changes to the game's underlying representation, objectives, and mechanics.

### Version #3 - Snakes With Wings (You are Here)

This brings us to where we are now- around November of 2019. The leading goal of this version is to push the game out to the world of internet-enabled multiplayer. Although I've recently gotten comfortable [working in the terminal environment](https://github.com/david-fong/Darcy), for this project, I decided to try using VSCode, since it looked like it would offer good intellisense for TypeScript, which I was looking to learn to use. I spent significant time learning how to set up linting for TypeScript with VSCode, and learning about ES6's native module system. I was really impressed with how good the integration is between VSCode and various plugins and typing constructs.

You might think that after making this game twice I'd be tired of it. But that's not at all the case. For one thing, I see so many opportunities to improve on my previous work. After all, learning has been a major motivation for this project from the start. In each version of this project, I try to make it more and more accessible to people. I for one, cannot wait for the day when I can sit down and play this game together with a group of friends or perhaps even with complete strangers.

## Design Challenges & Stepping up my Game

I envision this version to be the last remake- again, not at all because I'm tired of it, but because I finally have the tools and know-how to build up a maintainable code base. Both of the previous versions suffered from three main problems- largely due to me being new to the language. Before I can talk about those problems, solving them, and why solving them is necessary for this version, I need to talk about what makes this version so different.

One of the big challenges for this project is to give the user the choice between playing completely offline (after fetching all the game's HTTP objects), and playing online. I like this challenge because it really demands designing a good function API, and working with inheritence to share as much code as possible. This isn't a trivial task given an overview of what each piece of the picture needs to accomplish:

|                                            | Offline | Server | Client |
:-------------------------------------------:|:-------:|:------:|:------:|
| Maintain the master copy of the game state | :heavy_check_mark: | :heavy_check_mark: | :heavy_multiplication_x: |
| Display the game state via the browser DOM | :heavy_check_mark: | :heavy_multiplication_x: | :heavy_check_mark: |
| Use network operations to exchange events  | :heavy_multiplication_x: | :heavy_check_mark: | :heavy_check_mark: |

|     Topic     | The What and Why of the Problem | The Solution and its Necessity |
|:-------------:|---------------------------------|--------------------------------|
| Modularity    | | |
| Inheritance   | | |
| Documentation | Unlike the other problems, this wasn't due to not knowing about or understanding how to use a lingual feature- rather, it was a problem of values. Writing documentation didn't feel like it mattered. The code was _relatively_ small and simple. On top of that, I had no IDE to show documentation on mouseover, so the documentation I wrote wasn't even very accessible to me. | The solution here is to be intentional. And to be honest, I may not even need that. As the design becomes more complicated to address the new design requirements, I have a more critical need to clearly communicate a function's purpose. And as I design my function API's, I come across more situations where I need to make a judgement call on which functions in a call chain should handle certain functionalities. Writing good documentation allows me to stop wasting time reading my previous code to remember what it is being held responsible to do. |

## Language Representation

avoiding ambiguity

### Language Size Requirements

the number 24

### Effective Shuffling with Trees

searching by leaves
