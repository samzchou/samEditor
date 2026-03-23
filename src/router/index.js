import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";

Vue.use(VueRouter);

const routes = [{
        path: "/",
        name: "Home",
        component: Home,
    },
    {
        path: "/about",
        name: "About",
        component: () => import("../views/About.vue"),
    },
    {
        path: "/normal",
        name: "normal",
        component: () => import("../views/normal.vue"),
    },
    {
        path: "/test",
        name: "Test",
        component: () => import("../views/test.vue"),
    },
    {
        path: "/multiEditor",
        name: "multiEditor",
        component: () => import("../views/multiEditor.vue"),
    },
    {
        path: "/testNormal",
        name: "testNormal",
        component: () => import("../views/testNormal.vue"),
    },
    {
        path: "/testEditor",
        name: "testEditor",
        component: () => import("../views/testEditor.vue"),
    },
    {
        path: "/testDoc",
        name: "testDoc",
        component: () => import("../views/testDoc/index.vue"),
    },
    {
        path: "/aiDoc",
        name: "aiDoc",
        component: () => import("../views/aiDoc/index.vue"),
    },
    {
        path: "/stdReader",
        name: "stdReader",
        component: () => import("../views/stdReader.vue"),
    },

    {
        path: "/testPdf",
        name: "testPdf",
        component: () => import("../views/testPdf.vue"),
    },

    {
        path: "/tag",
        name: "Tag",
        component: () => import("../views/tag.vue"),
    },

    {
        path: "/templateEditor",
        name: "templateEditor",
        component: () => import("../views/templateEditor.vue"),
    },
    {
        path: "/pdfView",
        name: "pdfView",
        component: () => import("../views/pdfView.vue"),
    },
    {
        path: "/docComparison",
        name: "docComparison",
        component: () => import("../views/docComparison/index.vue"),
    },
    {
        path: "/testCompare",
        name: "testCompare",
        component: () => import("../views/docComparison/testCompare.vue"),
    },
    {
        path: "/pdfParser",
        name: "pdfParser",
        component: () => import("../views/pdfParser/index.vue"),
    },
    {
        path: "/struceView",
        name: "struceView",
        component: () => import("../views/testDoc/struceView.vue"),
    },
    {
        path: "/readDoc",
        name: "readDoc",
        component: () => import("../views/testDoc/readDoc.vue"),
    },
    {
        path: "/doubleEditor",
        name: "doubleEditor",
        component: () => import("../views/testDoc/doubleEditor.vue"),
    },
];

const router = new VueRouter({
    mode: "history",
    // base: process.env.BASE_URL,
    routes,
});

export default router;
