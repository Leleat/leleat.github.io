import { visit } from "unist-util-visit";

export default function rehypeCodeCopyButton() {
    /**
     * @param {import('hast').Root} root
     */
    return function (root) {
        visit(root, "element", function (node) {
            if (
                node.tagName === "pre" &&
                node.properties.class.includes("astro-code")
            ) {
                node.children.unshift({
                    type: "element",
                    tagName: "button",
                    properties: {
                        type: "button",
                        class: "code-copy-button",
                        disabled: true,
                        "aria-label": "Copy code to clipboard",
                    },
                });
            }
        });
    };
}
