---
layout: "@/layouts/BlogPostLayout.astro"
title: "TIL that pathnames in git configs can be optional"
description: "Git 2.52 includes a feature that makes working with ignore-revs-files mroe comfortable. Here is a brief explanation."
author: "Anh Tuan Le"
pubDate: "2026-02-23T00:00:00.000Z"
category: "TIL"
tags: ["git"]
---

git-blame shows what revision and author last modified each line of a file.

There are cases where you may want to ignore certain revisions, e.g. when a revision only contains changes that resulted from a code formatter changing the indentation of the entire codebase.

To ignore such commits, you can use:

```sh
git blame --ignore-rev <rev>
```

Or, you can ignore multiple revisions from a file:

```sh
git blame --ignore-revs-file <file>
```

By convention, the ignore-revs-file is called `.git-blame-ignore-revs` and placed at the repository root. Git forges like [GitHub](https://docs.github.com/en/repositories/working-with-files/using-files/viewing-and-understanding-files#ignore-commits-in-the-blame-view) and [GitLab](https://docs.gitlab.com/user/project/repository/files/git_blame/#ignore-specific-revisions) support this file directly in their blame views.

If you want to default to `.git-blame-ignore-revs` for the ignore-revs-file locally, you can set the config option `blame.ignorerevsfile`... and figure out that it's a bad idea. git-blame fails if the ignore-revs-file doesn't exist - and in most repositories it doesn't exist. So don't set `blame.ignorerevsfile`.

... or so I thought until I read a [comment by ilostmymangoman on hacker news](https://news.ycombinator.com/item?id=47111218#47114288). As of git 2.52 (Nov 2025), you can mark config file paths as optional using the `:(optional)` prefix.

That means you can safely configure an ignore-revs-file in your `~/.gitconfig` without breaking git-blame if the file doesn't exist:

```ini
[blame]
    ignoreRevsFile = :(optional).git-blame-ignore-revs
```
