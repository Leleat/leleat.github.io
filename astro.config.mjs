// @ts-check
import { defineConfig } from "astro/config";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";

import rehypeCodeCopyButton from "./src/plugins/rehypeCodeCopyButton.js";
import rehypeFigureCaption from "./src/plugins/rehypeFigureCaption.js";

export default defineConfig({
    markdown: {
        shikiConfig: {
            theme: "slack-dark",
        },
        smartypants: false,
        rehypePlugins: [
            rehypeFigureCaption,
            rehypeSlug,
            [rehypeAutolinkHeadings, { behavior: "wrap" }],
            rehypeCodeCopyButton,
        ],
    },
    redirects: {
        "/about": "/",
        "/contact": "/#contact",
    },
    site: "https://neverready.app",
});
