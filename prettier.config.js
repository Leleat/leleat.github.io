/** @type {import("prettier").Config} */
export default {
    tabWidth: 4,
    experimentalTernaries: true,
    plugins: ["prettier-plugin-astro"],
    overrides: [
        {
            files: ["*.json", "*.yml", "*.yaml"],
            options: {
                tabWidth: 2,
            },
        },
        {
            files: "*.astro",
            options: {
                parser: "astro",
            },
        },
    ],
};
