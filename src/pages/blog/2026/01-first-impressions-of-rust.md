---
layout: "@/layouts/BlogPostLayout.astro"
title: "First Impressions of Rust"
description: "I didn't come to Rust for speed or memory safety. As a web developer, I came out of curiosity and stayed for the language"
author: "Anh Tuan Le"
pubDate: "2026-02-01T00:00:00.000Z"
category: "diary"
tags: ["rust", "learning"]
---

Rust has been the "most admired" language in StackOverflow's surveys for 10 years straight[^rust-popularity]. This sounds impressive. But the surveys don't tell you _why_. You can find plenty of opinions online, but as the curious mind I wish I were, I wanted to see for myself what makes people love Rust so much. So I started hacking on a little side project: [git-forge](https://github.com/Leleat/git-forge), a CLI tool to interact with git forges using a unified interface. I wrote about it in my [previous blog post](https://leleat.github.io/blog/2025/03-git-forge/). It was a nice way to dip my toes into Rust without getting overwhelmed by a giant existing codebase - especially since Rust is my first "systems programming language". In my day job, I'm a web developer with JavaScript, TypeScript, and a bit of Java as my main languages.

After writing Rust for a bit, I have to say that I like it - but not for the reasons people usually go to Rust for.

Rust's claim to fame is performance, efficiency, and memory safety without garbage collection. Frankly, I don't care for any of that. Not everyone operates at a scale where you need to squeeze out every last drop of performance, and I don't hit any limits with my current tech stack.

I like Rust because it's simply a pleasant language to use. Maybe I'll dislike it when I need to write my own macros, when I fight the borrow checker and worry about lifetimes more often, or when I deep-dive into concurrent and parallel programming... but it is not this day! This day ~~we fight~~ I like Rust. There are plenty of reasons for this. But let's go with the classic approach, and start with the bad and end with the good.

## The Bad

The initial experience with Rust is nice. There are plenty of resources for beginners like the [Rust Book](https://doc.rust-lang.org/stable/book/) or the [Rustlings exercises](https://github.com/rust-lang/rustlings/). There is plenty of handholding and documentation. But eventually there's none of that. Eventually, you fight with the ownership system and the borrow checker... even though at first they sounded easy conceptually and looked manageable thanks to lifetime elision. Eventually, you look at other people's code and feel like you're studying an arcane magic book... even though you understand the syntax (in theory). Error messages are supposedly helpful... but only if someone (e.g. the Rust Book) points you to the exact sentence that matters. When you're on your own, you can feel lost in the noise.

I expect these struggles to ease with experience. What I'm less sure will improve is Rust's standard library. When I say "standard library", I don't mean `std` strictly; I mean what's officially supported by Rust. It feels tiny. I'd be completely fine with a small `std` if there were first-party opt-in crates maintained by the Rust team. Even for `git-forge`, which is relatively trivial, I needed to reach for a few libraries:

- `anyhow` for convenient error handling
- `clap` for argument parsing
- `reqwest` for making HTTP requests
- `serde` for (JSON) de/serialization

While I use other dependencies like `ratatui`, those four are the ones that hurt because they feel basic to me. My initial TypeScript implementation of `git-forge` had zero dependencies except for `Node` itself. It's obvious why Node includes tools for making HTTP requests and JSON de/serialization, but [Node even includes simple argument parsing](https://nodejs.org/api/util.html#utilparseargsconfig), which is great for things beyond basic shell scripts but short of full-blown "apps".

Reaching for dependencies always makes me a little uneasy. While I try to do _some_ due diligence - checking who maintains a project, how many maintainers and contributors it has, how actively it's maintained - there's always a chance for something to go wrong. Just look at npm, which has seen multiple notable supply chain attacks recently[^npm-attack]. It's hard not to worry about the Jenga tower of dependencies behind many projects.

![xkcd: dependency](https://imgs.xkcd.com/comics/dependency.png)

It may be only a matter of time until we read about attacks on crates.io. Time will tell...

Those are my only real gripes with Rust at the moment. The list of things I enjoy is much longer.

## The Good

I appreciate Rust's defaults, e.g. privacy and immutability. I like `notUsingCamelCaseForReadabilityButInstead` `using_snake_case_which_is_more_readable_even_when_using_absurdly_long_names`.

I like that Rust is expression-based. You don't need the ternary operator, just use if expressions (or other control flow). You don't need an IIFE (Immediately Invoked Function Expression) to create a new scope; just create a block that automatically evaluates to its last expression.

```ts
/* TypeScript */

// ternary operator
const status = isActive ? "active" : "inactive";

// IIFE for complex initialization
const config = (() => {
    const base = getBaseConfig();

    // ... more setup

    return {
        /* ... */
    };
})();
```

```rust
/* Rust */

// ternary -> normal if-else expression
let status = if is_active { "active" } else { "inactive" };

// IIFE -> just a block
let config = {
    let base = get_base_config();

    // ... more setup

    Config { /* ... */  } // block evaluates to this
};
```

Then there's pattern matching and exhaustive checks. They felt a bit foreign at first. They don't come as naturally in the languages I'm used to. But now I wouldn't want to go without them[^pattern-exhaustive-java-ts].

```rust
/* Rust */

enum Status { Active, Inactive, Pending }

fn describe(status: Status) -> String {
    match status {
        Status::Active => String::from("active"),
        Status::Inactive => String::from("inactive"),
        // Compiler error: non-exhaustive pattern, `Pending` not covered.
    }
}
```

Rust's module system was another pleasant surprise. I always found it awkward in JavaScript/TypeScript that `export` means "public to the entire codebase". Rust's approach feels better. It lets you cleanly separate modules within a project.

```ts
/* TypeScript */

// src/utils_module/internal_to_utils_module.ts
export function internal_util_function() {}

// This is allowed
// src/utils_module/another_util.ts
import { internal_util_function } from "./internal_to_utils_module.ts";

// But this is also allowed and can't be prevented :(
// src/some_module/index.ts
import { internal_util_function } from "../utils_module/internal_to_utils_module.ts";
```

You need to rely on conventions (e.g. create an `index.js` file to declare a public API), keep all module code in a giant file, or break the code out into a separate library.

Rust gives you more fine-grained control. Child modules automatically hide their implementation details from parents, while still being able to access parent code. So you can selectively (re)export things to create a public API. Here's the same example in Rust:

```rust
/* Rust */

// For simplicity, all modules are put into a single file, but you
// could split them out into separate files.

mod utils_module {
    mod internal_to_utils_module {
        pub fn internal_util_function() {}
    }

    mod another_util_module {
        fn some_func() {
            // internal_to_utils_module made internal_util_function pub
            // for the utils_module. So another_util_module can access it
            // as well since it can access everything in the parent module.
            super::internal_to_utils_module::internal_util_function();
        }
    }
}

mod some_module {
    // utils_module neither re-exported internal_util_function nor made
    // internal_to_utils_module public. That means, some_module can't
    // access internal_util_function :)
}
```

Rust's type system is another highlight. You can encode a lot of useful information to "make illegal states unrepresentable".

The `Result` type forces you to acknowledge possible failures instead of being surprised at runtime. I enjoy the idea so much that I tried to implement it in TypeScript (as have others). But it isn't as ergonomic as it is in Rust without pattern matching and the `?` operator to propagate errors concisely.

The `Option` type explicitly represents the absence of a value. You can rely on a `String` being a `String`. Compare that to Java, where `Optionals` themselves can be `null`, and where you need to rely on third-party tools like [NullAway](https://github.com/uber/NullAway) to improve null safety.

The trait system initially looked like interfaces to me because they share the same goal: sharing behavior. But traits [offer features that interfaces don't](https://stackoverflow.com/questions/69477460/is-rust-trait-the-same-as-java-interface). My favorite is that you can implement your own traits for foreign types extending their implementation.

```rust
// Define your own trait
trait Slugify {
    fn slugify(&self) -> String;
}

// Implement it for String (from std)
impl Slugify for String {
    fn slugify(&self) -> String {
        self.to_lowercase().replace(' ', "-")
    }
}

// Now you can call it like a method
let title = String::from("My Blog Post");
let slug = title.slugify(); // "my-blog-post"

// In other languages, you'd write a standalone function like
// slugify(title) or modify String.prototype (in JS/TS), which pollutes
// the prototype
```

Rust's tooling is another plus. You get **built-in** linting, code formatting, documentation, package management, and testing. Compared to JS/TS/Java, where you need third-party tools. Rust also has features like [documentation tests](https://doc.rust-lang.org/rustdoc/write-documentation/documentation-tests.html) or inline [(in-file) tests](https://doc.rust-lang.org/book/ch11-01-writing-tests.html) that I haven't commonly seen elsewhere. I especially like the inline tests. I can implement a function and verify it works without setting up a new test file or making the function public. Whether to keep those tests in the end is a different matter, but being able to test an implementation quickly and easily is great.

## The End

Of course, none of these features are unique to Rust. Functional languages, strongly typed languages, or _insert-language-x_ offer many of them. I just haven't used any of those languages before; they always felt too different, too niche, or too _something-else_. Rust as a whole feels approachable and familiar enough. It strikes a nice balance between what it offers and its tradeoffs. If my future experience with Rust is as enjoyable as it has been so far, it might become my go-to language for new projects. I would recommend Rust - not because of its performance or safety (after all, I am unfit to speak about that) - but because **Rust is simply a pleasant language to use**.

---

[^rust-popularity]: See [GitHub's Blog Post](https://github.blog/developer-skills/programming-languages-and-frameworks/why-rust-is-the-most-admired-language-among-developers/), which reviews the 2023 survey, [SO survey 2024](https://survey.stackoverflow.co/2024/technology#admired-and-desired), and [SO survey 2025](https://survey.stackoverflow.co/2025/technology#admired-and-desired)

[^pattern-exhaustive-java-ts]: Well, technically, Java has some pattern matching and exhaustive switch expressions. TypeScript can use a `never` function to create an exhaustive switch or use lint rules. But these features aren't as powerful or ubiquitous as they are in Rust.

[^npm-attack]: [July 18, 2025](https://www.stepsecurity.io/blog/supply-chain-security-alert-eslint-config-prettier-package-shows-signs-of-compromise), [Nx in August 2025](https://www.wiz.io/blog/s1ngularity-supply-chain-attack), [Shai-Hulud in September 2025](https://socket.dev/blog/tinycolor-supply-chain-attack-affects-40-packages), [Shai-Hulud 2.0 in November 2025](https://www.microsoft.com/en-us/security/blog/2025/12/09/shai-hulud-2-0-guidance-for-detecting-investigating-and-defending-against-the-supply-chain-attack/)
