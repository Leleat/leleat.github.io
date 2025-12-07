import rss from "@astrojs/rss";
import sanitizeHtml from "sanitize-html";

import { getPostsWithNewestFirst } from "../global.js";

export async function GET(context) {
    const posts = getPostsWithNewestFirst();
    const items = await Promise.all(
        posts.map(async (post) => {
            const p = {
                title: post.frontmatter.title,
                link: post.url,
                content: sanitizeHtml(await post.compiledContent()),
                pubDate: new Date(post.frontmatter.pubDate),
            };

            if (post.frontmatter.description) {
                p.description = post.frontmatter.description;
            }

            if (post.frontmatter.category) {
                p.categories = [post.frontmatter.category];
            }

            return p;
        }),
    );

    return rss({
        title: `Lele's log, DEE Not-Enterprise, ${new Date().getFullYear()}`,
        description:
            "A place for my thoughts, my trials with lots of errors, and everything in between",

        site: context.site,
        items,
        customData: "<language>en-us</language>",
        stylesheet: "/rss/stylesheet.xsl",
    });
}
