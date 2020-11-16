<template>
    <v-app>
        <v-navigation-drawer
                :clipped="$vuetify.breakpoint.lgAndUp"
                width="220"
                app
        >
            <v-list nav dense class="pt-3 pr-1">
                <v-expansion-panels accordion focusable tile flat>
                    <v-expansion-panel
                            v-for="item in items"
                            :key="item.text"
                    >
                        <v-card :to="item.to" flat tile>
                            <v-expansion-panel-header :expand-icon="item.children ? '$expand' : ''" class="py-0 px-3 font-weight-medium">
                                <v-sheet>
                                    <v-icon v-text="item.icon" class="pr-3"></v-icon>
                                    {{ item.text }}
                                </v-sheet>
                            </v-expansion-panel-header>
                        </v-card>
                        <v-expansion-panel-content v-if="item.children">
                            <v-treeview
                                    :items="item.children"
                                    selectable
                                    v-model="item.selected_children"
                                    selected-color="blue-grey lighten-1"
                                    dense
                                    level="12"
                            >
                                <template slot="prepend"></template>
                            </v-treeview>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                </v-expansion-panels>
            </v-list>
        </v-navigation-drawer>

        <v-main>
            <v-container fluid class="pa-0 ma-0">
                <keep-alive>
                    <router-view :browse_selected_entry_types="browse_selected_entry_types"></router-view>
                </keep-alive>
            </v-container>
        </v-main>
    </v-app>
</template>

<script>
    import store from "./store/index";
    import {server_address} from "./config";
    import {addEntryKey, getReferenceId, setdefault} from "./util";

    const axios = require("axios");

    export default {
        props: {
            source: String,
        },
        store: store,
        data: () => ({
            dialog: false,
            items: [
                {
                    icon: "mdi-view-dashboard-outline",
                    text: "Dashboard",
                    to: "/"
                },
                // {icon: "mdi-graph-outline", text: "Graph", to: "/graph"},
                {
                    icon: "mdi-magnify",
                    text: "Browse",
                    to: "/browse",
                    children: [
                        { id: 1, name: "Notebooks", children: [], entry_type: "Notebook" },
                        { id: 11, name: "Notes", children: [], entry_type: "Note" },
                        { id: 2, name: "Sagas", children: [], entry_type: "Saga" },
                        { id: 21, name: "Events", children: [], entry_type: "Event" },
                        { id: 3, name: "Projects", children: [], entry_type: "Project" },
                        { id: 31, name: "Tasks", children: [], entry_type: "Task" },
                    ],
                    selected_children: [ 1, 11, 2, 21, 3, 31 ],
                },
                { icon: "mdi-calendar-today", text: "Calendar", to: "/calendar" },
                {
                    icon: "mdi-clipboard-check-outline",
                    text: "Projects",
                    to: "/projects",
                },
                // {icon: "mdi-book-outline", text: "Notebooks", to: "/notebooks"},
            ],
        }),
        computed: {
            browse_selected_entry_types: function () {
                let browse = this.items.find((i) => i.text == "Browse")
                console.log(browse)
                return browse.selected_children.map(
                    (s_index) => {
                        return { entry_type: browse.children.find((c) => c.id == s_index).entry_type }
                    })
            },
        },
        created: function () {
            let fetch = async function (obj_type) {
                let response = await axios.get(server_address + "/" + obj_type)
                return response.data;
            }
            let fetch_and_load = async function (obj_type, transform_function = (data) => data) {
                let data = await fetch(obj_type);
                return await store.dispatch("load_" + obj_type, transform_function(data))
            }
            fetch_and_load("clients");
            fetch_and_load("users");
            let load_entries = fetch_and_load("entries", (data) => {
                return data.map(addEntryKey).sort((e1, e2) => e1.creation_date > e2.creation_date)
            });
            let fetch_references = fetch("references");
            Promise.all([fetch_references, load_entries]).then(
                (values) => {
                    let references = values[0];
                    store.dispatch("load_references", references.map((reference) => {
                        let parsed_reference = {
                            ...reference,
                            source: {
                                "url": reference.source,
                                "key": store.getters.entry_key_from_url(reference.source)
                            },
                            target: {
                                "url": reference.target,
                                "key": store.getters.entry_key_from_url(reference.target)
                            }
                        }
                        parsed_reference["key"] = getReferenceId(parsed_reference);
                        return parsed_reference
                    })).then(() => {
                        let updates_by_entry = {};
                        for (let reference of store.getters.reference_list) {
                            let source_key = reference.source.key;
                            let target_key = reference.target.key;
                            setdefault(updates_by_entry, source_key, {
                                key: source_key,
                                references: [],
                                referenced_by: []
                            })
                            setdefault(updates_by_entry, target_key, {
                                key: target_key,
                                references: [],
                                referenced_by: []
                            })
                            updates_by_entry[source_key].references.push({url: reference.url, key: reference.key})
                            updates_by_entry[target_key].referenced_by.push({url: reference.url, key: reference.key})
                        }
                        for (let update of Object.values(updates_by_entry)) {
                            store.dispatch("update_entry", {entry: update})
                        }
                    })
                }
            )
        },
    };
</script>

