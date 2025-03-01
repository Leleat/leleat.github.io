// @ts-check
import { defineConfig } from "astro/config";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";

import rehypeCodeCopyButton from "./src/plugins/rehypeCodeCopyButton.js";

export default defineConfig({
    markdown: {
        shikiConfig: {
            theme: "slack-dark",
        },
        smartypants: false,
        rehypePlugins: [
            rehypeSlug,
            [rehypeAutolinkHeadings, { behavior: "wrap" }],
            rehypeCodeCopyButton,
        ],
    },
    redirects: {
        "/about": "/",
        "/contact": "/#contact",
    },
    site: "https://astronaut.github.io",
});
