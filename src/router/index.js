import Vue from "vue";
import VueRouter from "vue-router";
import Browse from "../views/Browse.vue";
import Calendar from "../views/Calendar.vue";
import Projects from "../views/Projects.vue";
import Graph from "../views/Graph.vue";
import Dashboard from "../views/Dashboard";

Vue.use(VueRouter);

const routes = [
    {
        path: "/",
        name: "Dashboard",
        component: Dashboard,
    },
    {
        path: "/graph",
        name: "Graph",
        component: Graph,
    },
    {
        path: "/browse",
        name: "Browse",
        component: Browse,
        props: true,
    },
    {
        path: "/calendar",
        name: "Calendar",
        component: Calendar,
    },
    {
        path: "/projects",
        name: "Projects",
        component: Projects,
    },
    {
        path: '*',
        redirect: '/browse'
    },
];

const router = new VueRouter({
    mode: "history",
    base: process.env.BASE_URL,
    routes,
});

export default router;
