import "./styles.css";

function calculateReadTime(content) {
    const lines = content.split("\n");
    let inCodeBlock = false;
    let textLines = [];

    for (const line of lines) {
        if (line.trim().startsWith("```")) {
            inCodeBlock = !inCodeBlock;
            continue;
        }

        if (!inCodeBlock) {
            textLines.push(line);
        }
    }

    const text = textLines.join(" ");
    const words = text
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0);
    const minutes = Math.max(1, Math.floor(words.length / 300));

    return `${minutes} min`;
}

const getPosts = () =>
    Object.values(
        import.meta.glob("./pages/blog/**/*.md", { eager: true }),
    ).map((post) => ({
        ...post,
        readTime: calculateReadTime(post.rawContent()),
    }));

export function getPostsWithOldestFirst() {
    return getPosts().toSorted((a, b) => {
        const dateA = new Date(a.frontmatter.pubDate);
        const dateB = new Date(b.frontmatter.pubDate);

        return (
            dateA > dateB ? 1
            : dateA < dateB ? -1
            : 0
        );
    });
}

export function getPostsWithNewestFirst() {
    return getPostsWithOldestFirst().toReversed();
}

const sluggifyTag = (tag) => tag.toLowerCase().replace(/ |\//g, "-");
const tags = [
    {
        name: "brainstorming",
        description: "Ideas, concepts, and experiments",
    },
    { name: "cli", description: "" },
    { name: "git", description: "" },
    {
        name: "gnome-extension",
        description:
            "Stuff related to Extensions for the GNOME desktop environment",
    },
    { name: "learning", description: "" },
    { name: "meta", description: "" },
    { name: "npm", description: "" },
    { name: "rust", description: "" },
];

export function getTagData(tag) {
    const tagData = tags.find((t) => t.name === tag);

    if (tagData === undefined) {
        throw new Error(`Tag "${tag}" doesn't exist.`);
    }

    return {
        raw: tag,
        slug: sluggifyTag(tag),
        description: tagData.description,
    };
}

const categories = [
    {
        name: "diary",
        description: "Journal entries",
    },
    {
        name: "projects",
        description: "Posts about things I have worked on",
    },
    {
        name: "TIL",
        description: "Today I Learned",
    },
    {
        name: "uncategorized",
        description: "Posts without a specific category",
    },
];

export function getCategoryData(category) {
    const categoryData = categories.find((c) => c.name === category);

    if (categoryData === undefined) {
        return {
            raw: "Uncategorized",
            slug: "uncategorized",
            description: "Posts without a specific category",
        };
    }

    return {
        raw: category,
        slug: sluggifyTag(category),
        description: categoryData.description,
    };
}

export function groupPostsByCategory(posts, limitPerCategory) {
    const categoryOrder = ["projects", "diary", "TIL"];
    const grouped = [];

    categoryOrder.forEach((category) => {
        const categoryPosts = posts
            .filter((post) => post.frontmatter.category === category)
            .slice(0, limitPerCategory);

        if (categoryPosts.length > 0) {
            grouped.push({
                category,
                posts: categoryPosts,
                totalCount: posts.filter(
                    (post) => post.frontmatter.category === category,
                ).length,
            });
        }
    });

    return grouped;
}

export function groupPostsByYear(posts) {
    const grouped = new Map();

    posts.forEach((post) => {
        const year = new Date(post.frontmatter.pubDate).getFullYear();

        if (!grouped.has(year)) {
            grouped.set(year, []);
        }

        grouped.get(year).push(post);
    });

    return Array.from(grouped.entries())
        .map(([year, yearPosts]) => ({
            year,
            posts: yearPosts,
            totalCount: yearPosts.length,
        }))
        .toSorted((a, b) => b.year - a.year);
}
