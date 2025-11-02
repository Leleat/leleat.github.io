import "./styles.css";

const getPosts = () =>
    Object.values(import.meta.glob("./pages/blog/**/*.md", { eager: true }));

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
        name: "concept",
        description:
            "Exploring new ideas that will never happen but are fun to think about",
    },
    {
        name: "gnome extension",
        description:
            "Stuff related to Extensions for the GNOME desktop environment",
    },
    {
        name: "journal",
        description:
            "Writing down my personal experience to review what I've done or what I've learned... in a very unprofessional manner 😂",
    },
    { name: "npm", description: "" },
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
