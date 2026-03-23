module.exports = {
    root: true,
    env: {
        node: true,
    },
    extends: ["plugin:vue/essential"], //, "eslint:recommended", "@vue/prettier"
    parserOptions: {
        parser: "babel-eslint",
    },
    rules: {
        "no-console": "off",
        "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
        "prettier/prettier": "off",
        "no-unused-vars": "off",
    },
    globals: {
        "_": true,
        "tinymce": true,
        "tinyMCE": true,
    },
};
