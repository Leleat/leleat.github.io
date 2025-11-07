import { visit } from "unist-util-visit";

export default function rehypeFigureCaption() {
    /**
     * @param {import('hast').Root} root
     */
    return function (root) {
        visit(root, "element", function (node, index, parent) {
            if (node.tagName === "img" && parent && typeof index === "number") {
                const altText = node.properties.alt;

                if (altText && typeof altText === "string" && altText.trim()) {
                    parent.children[index] = {
                        type: "element",
                        tagName: "figure",
                        properties: {},
                        children: [
                            node,
                            {
                                type: "element",
                                tagName: "figcaption",
                                properties: {},
                                children: [
                                    {
                                        type: "text",
                                        value: altText,
                                    },
                                ],
                            },
                        ],
                    };
                }
            }
        });
    };
}
