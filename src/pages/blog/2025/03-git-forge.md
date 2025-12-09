---
layout: "@/layouts/BlogPostLayout.astro"
title: "git-forge: Faster Issues and PRs From Your Terminal"
description: "git-forge is a minimal, forge-agnostic CLI that brings issue and PR utilities directly into git"
author: "Anh Tuan Le"
pubDate: "2025-12-09T18:45:00.000Z"
category: "projects"
tags: ["cli", "git"]
---

I often want to drop issue links into commit messages. Doing that normally means leaving your editor, opening a browser, navigating to the repo, finding the issue, and then copying the URL... a minor inconvenience, but one that happens often enough to be mildly annoying. I'm not the only one to feel this way. There are tools to address it. But they don't quite fit my needs: they either only work with one forge or don't offer the features I want. So I built git-forge.

git-forge is a small CLI that plugs into git via the git-\<subcommand> pattern[^1]. Drop it somewhere in your `$PATH` and you can run:

[^1]: https://git.github.io/htmldocs/howto/new-command.html

```sh
git forge [<subcommand>] [<options>]
```

It works with GitHub, GitLab, Gitea, and Forgejo. If you only use GitHub, [gh](https://cli.github.com/) will give you signifcantly more features; but if you hop between forges, git-forge aims to be _good enough_. Here's a quick overview of what it can do.

## Features

`git forge issue` fetches issues as TSV (Tab-separated values) so you can pipe them into whatever tools you already use. This makes it easy to search, filter, or copy links.

```sh
# In a repo for https://gitlab.gnome.org/GNOME/gnome-shell
$ git forge issue --per-page 5
8883 Brightness management is broken when there is more than one options in /sys/class/backlight	https://gitlab.gnome.org/GNOME/gnome-shell/-/issues/8883
8881 Error sometimes when switching desktops using keyboard	https://gitlab.gnome.org/GNOME/gnome-shell/-/issues/8881
8877 Occasional segfault at login, surrounded by object errors ("An object is already exported", "assertion 'G_IS_OBJECT (object)' failed")	https://gitlab.gnome.org/GNOME/gnome-shell/-/issues/8877
8873 Passwords and keys desktop file not in Utilities folder because of wrong desktop file name	https://gitlab.gnome.org/GNOME/gnome-shell/-/issues/8873
8870 Follow gtk-interface-reduced-motion	https://gitlab.gnome.org/GNOME/gnome-shell/-/issues/8870
```

`git forge pr` has three actions.

`git forge pr checkout <pr-number>` checks out a pull request locally. I prefer reviewing code in my own dev environment, but I always forget the exact ref syntax for PRs.Is it `pulls/<id>/head`, `pull/<id>/head`, `pull-requests/<id>/head`? And what about GitLab, Forgejo, or Gitea? Now, I don't need to look it up anymore. git-forge streamlines this.

`git forge pr list` prints a list of pull requests as TSV, just like the issue command.

```sh
# In a repo of https://gitlab.gnome.org/GNOME/gnome-shell
$ git forge pr --per-page 5
3993 screenShield: Fix user deselection after idle in greeter	https://gitlab.gnome.org/GNOME/gnome-shell/-/merge_requests/3993
3990 messageList: Preserve MPRIS art aspect ratio	https://gitlab.gnome.org/GNOME/gnome-shell/-/merge_requests/3990
3984 layout: Simplify startup path if animations are disabled	https://gitlab.gnome.org/GNOME/gnome-shell/-/merge_requests/3984
3980 unlockDialog: Tweak lock screen when limit reached	https://gitlab.gnome.org/GNOME/gnome-shell/-/merge_requests/3980
3979 shellDBus: Add new BrightnessChanged signal to brightness interface	https://gitlab.gnome.org/GNOME/gnome-shell/-/merge_requests/3979
```

`git forge pr open` opens a PR for the current branch. It's still somewhat experimental; I need to test it more (manually and automatically), especially on non-GitHub forges.

`git forge web` gives you quick access to URLs for the repo, issues page, or PR page.

```sh
# In a repo of https://gitlab.gnome.org/GNOME/gnome-shell
$ git forge web --type=repository
https://gitlab.gnome.org/GNOME/gnome-shell
```

Because git-forge is just a CLI, you can combine it with other commands. Some git aliases for inspiration:

```sh
# git aliases in .gitconfig
[alias]
    fcpissue = "!git forge issue | fzf | cut -f 2 | copy"
    fopenissue = "!git forge issue | fzf | cut -f 2 | xargs xdg-open &> /dev/null"
    freviewpr = "!git forge pr | fzf | cut -d' ' -f 1 | xargs git forge pr checkout"
```

For example, `git fcpissue` lets you fuzzy-search issues and then copies the URL to your clipboard so that you can add it to a commit message. `git freviewpr` lets you fuzzy-search PRs and checks the selected one out locally.

## Quirks and Notes

git-forge tries to provide a common feature set across forges. But the forge APIs differ. For instance, GitHub's "issues" API returns both issues and PRs, so git-forge has to filter them client-side. That means requesting 100 items might give you fewer actual issues compared to GitLab, which separates them server-side. In practice, I think these quirks are minor.

git-forge is currently written in TypeScript. It doesn't rely on external dependencies (other than dev dependencies), but it does require Node to run. Node may be a turn-off for some people, but it's what I'm most confident in and it let me focus on the functionality first. I plan to rewrite git-forge in Rust. It's partly to learn and practice Rust, partly to drop the node runtime dependency. The rewrite can focus entirely on the technical implementation without changing the feature set.

If git-forge sounds interesting to you, you can find the project on [GitHub](https://github.com/Leleat/git-forge).
