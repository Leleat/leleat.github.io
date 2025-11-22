---
layout: "@/layouts/BlogPostLayout.astro"
title: "Creating my first npm Package"
description: "I created my first npm package: create-gnome-extension, a scaffolding tool for GNOME extensions inspired by the web dev ecosystem. The development was fun—testing and publishing, less so."
author: "Anh Tuan Le"
pubDate: "2024-07-22 22:00:00 +0200"
tags: ["gnome extension", "npm", "journal"]
---

Recently at work, I've started doing a bit of web development. What surprised me the most, in a pleasant way, was how nice the developer experience was. Everything is fairly straightforward to use, well-documented, and there are a lot of tools available. For instance, Vue and React provide scaffolding tools ([create-vue](https://www.npmjs.com/package/create-vue) and [create-react-app](https://www.npmjs.com/package/create-react-app), respectively) that set up your project quickly so you can hit the ground running. I thought to myself _Oh, that's nice, let's ~~steal~~ be inspired by the idea_ and created something similar for my own use case. Enter [create-gnome-extension](https://github.com/Leleat/create-gnome-extension), my first npm package.

## What is create-gnome-extension?

Let's first define what GNOME extensions are. GNOME extensions are community written code that modify GNOME Shell, the graphical interface for the [GNOME](https://www.gnome.org/) desktop.

Currently, getting started with developing GNOME extensions can be a bit cumbersome. You either manually create the project structure from scratch or use GNOME Shell's built-in

```sh
gnome-extensions create
```

command. However, this command doesn't offer much convenience as it places the files in `~/.local/share/gnome-shell/extensions/`, which is the install directory for user extensions, and only creates the mandatory files. Developer tools or other conveniences are not included.

`create-gnome-extension` - similar to other create-X packages - follows a _batteries included_ philosophy. Here's a short rundown in case you don't know how packages like this work. If you run:

```sh
npm create gnome-extension@latest # Note the space after `create`
```

npm will look up the latest `create-gnome-extension` package, temporarily install it, and execute the main _bin_ defined in the `package.json`[^1]. So, `create-gnome-extension` is basically just a glorified Node script. When you use it, it will prompt some questions like _Do you want to use TypeScript?_ and create the project structure for you. Check out the [README](https://github.com/Leleat/create-gnome-extension#readme) for more information.

## Developing create-gnome-extension

Now, I'd like to talk about how it was developing the npm package because there are some things to say. Developing `create-gnome-extension` itself was pretty straightforward. It's just a simple script that copies and writes some files.

However, I did have a bit of trouble with testing and publishing the package. It was not a great experience.

The only ways I found to actually test a package are to either publish it on npm or use `npm link`. Both aren't particularly great options. The first option is obviously not ideal, and the second option is just kind of slow. If you know of a better way to test a package, please let me know.

Another issue I encountered is about how files are included in an npm package. Some files, like the `README` or `LICENSE`, are always included, while most files need to be manually included. Other files are always excluded with no way to force-include them (like `.gitignore`)[^2]. You need to work around it by renaming those files. There is `npm pack --dry-run` that will tell you which files will be included in the package but manually checking that dozens or hundreds of files are actually part of the packge doesn't seem like a good developer experience. In the end, you have to read the documentation on the file patterns carefully to see how each file may be handled to avoid surprises.

## New Project, new Ideas

Since `create-gnome-extension` was a new project, it gave me a chance to try out some new things.

I switched from ESLint and Prettier to Biome. Biome combines a formatter and linter, so there is one less dependency and fewer config files. It is also faster since it is written in Rust rather than JavaScript. However, the speed advantage is less significant since you likely use linters and formatters integrated into your code editor. That's where I had issues with Biome. The VSCode extension seems less reliable (as in it stops working sometimes). So, I will probably switch back to ESLint and Prettier once I start working on _create-gnome-extension_ again.

I also started using _conventional-changelog_ and _conventional-recommended-bump_, which are based on the [Angular commit convention](https://github.com/angular/angular/blob/22b96b9/CONTRIBUTING.md#-commit-message-guidelines), to automatically bump the version number and generate the `CHANGELOG`. This works quite well so far. Although, I am unsure about what happens if one type of work needs to be split into multiple commits, e.g., one feature implemented via multiple commits. I believe, if you prefix all commits of a merge request with _feat_, each commit would appear in the changelog, which is undesirable.

Related to the usage of _conventional-X_: I experimented with git hooks to ensure that commit messages follow the Angular convention or at least warn if the convention is obviously not adhered to. The idea was to avoid the need to push to a merge request and wait for feedback from the CI. The problem with git hooks is that they are only local to repos and won't be included when pushed to remotes. So, I put the hooks in a `.githooks` directory and added a `postinstall` npm script that runs

```sh
git config --local core.hooksPath .githooks
```

so that the hooks are automatically set up when you work on the project. However, this led to an error when running `npm create gnome-extension@latest` since the package wouldn't be initialized as a git repo. So, I turned the `postinstall` script into an optional `hookup` script for now. Maybe using _husky_ would solve this issue but I didn't want to add a dependency just for that.

Finally, I also created some GitHub actions. The [most interesting action](https://github.com/Leleat/create-gnome-extension/blob/main/.github/workflows/link-and-merge-pr.yml) appends the URL of the merge request (MR) to all commits before initiating a merge. This allows you to easily open the MR from a terminal on your local machine to look at the discussion that surrounded an MR. This is inspired by the [Part-of trailer of marge-bot](https://gitlab.com/marge-org/marge-bot#adding-reviewed-by-tested-and-part-of-to-commit-messages) for GitLab.

## Final Thoughts

While there are still some features to implement in `create-gnome-extension`, working on it so far was a fun little project. It allowed me to explore new tools and experiment with some other things.

[^1]: `npm create` is an alias for `npm init`. So checkout the documentation for it here: [https://docs.npmjs.com/cli/v6/commands/npm-init?v=true#description](https://docs.npmjs.com/cli/v6/commands/npm-init?v=true#description)

[^2]: [https://docs.npmjs.com/cli/v10/configuring-npm/package-json?v=true#files](https://docs.npmjs.com/cli/v10/configuring-npm/package-json?v=true#files)
