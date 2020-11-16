<template>
    <v-container align-start fluid fill-height>
        <v-row align="start" justify="center">
            <v-col>
                <v-card flat>
                    <v-toolbar flat>
                        <v-text-field
                                flat
                                outlined
                                prepend-inner-icon="mdi-magnify"
                                label="Search"
                                v-model="search_query"
                                solo
                                clearable
                        ></v-text-field>
                    </v-toolbar>


                    <v-container align-start fluid fill-height style="max-height: 88vh"
                                 class="overflow-y-auto">
                        <d3-network :net-nodes="nodes" :net-links="links" :options="options"></d3-network>
                    </v-container>
                </v-card>
            </v-col>

            <v-col>
                <v-card fill-height v-if="open_entries.length > 0">
                    <v-tabs v-model="active_tab" background-color="primary" center-active>
                        <v-tab
                                v-for="opened_entry_index in open_entries"
                                :key="opened_entry_index"
                                @click.ctrl.stop="close_entry(opened_entry_index)"
                                @click.middle.stop="close_entry(opened_entry_index)"
                                class="pr-1"
                        >
                            {{ entries[opened_entry_index].name }}
                            <v-btn
                                    icon
                                    x-small
                                    class="ml-2"
                                    @click.stop="close_entry(opened_entry_index)"
                            >
                                <v-icon>
                                    mdi-close
                                </v-icon>
                            </v-btn>
                        </v-tab>
                    </v-tabs>

                    <v-tabs-items v-model="active_tab">
                        <v-tab-item
                                v-for="opened_entry_index in open_entries"
                                :key="opened_entry_index"
                                transition="none"
                                reverse-transition="none"
                        >
                            <v-container>
                                <generic-entry-editor
                                        :entry_index="opened_entry_index"
                                        v-on:entry-delete-event="close_entry"
                                        v-on:follow-link="open_entry"
                                        style="max-height: 85vh"
                                        class="overflow-y-auto"
                                ></generic-entry-editor>
                            </v-container>
                        </v-tab-item>
                    </v-tabs-items>
                </v-card>
            </v-col>
        </v-row>

        <svg id="hidden-svg" hidden="true"></svg>
    </v-container>
</template>

<script>
    import {mapGetters, mapState} from "vuex";

    import D3Network from 'vue-d3-network'
    import {getEntryId, text_as_SVG} from "../util";

    export default {
        name: "Graph",
        components: {D3Network},
        mounted() {
        },
        methods: {
            open_entry: function (entry_index) {
                if (this.open_entries.includes(entry_index)) {
                    // this entry is already open
                    this.active_tab = this.open_entries.indexOf(entry_index);
                } else {
                    this.open_entries.push(entry_index);
                    this.active_tab = this.open_entries.length - 1;
                }
            },
            close_entry: function (entry_index, confirmed = true) {
                // if (!confirmed) {
                //   TODO - implement user confirmation dialog if unsaved changes on this entry
                // }
                let current_tab_index = this.active_tab;
                let open_entry_index = this.open_entries.indexOf(entry_index);
                this.open_entries.splice(open_entry_index, 1);
                if (current_tab_index >= open_entry_index) {
                    this.active_tab -= 1;
                }
            },
            filter_entry: function (entry) {
                // TODO move to proper regexes at some point to support dynamic case-sensitiveness
                if (!this.search_query) {
                    return true;
                }
                let words = this.search_query.split(/\s+/).filter((word) => word != "");
                return words.every(
                    (w) =>
                        entry.name.toLowerCase().includes(w.toLowerCase()) ||
                        entry.content.toLowerCase().includes(w.toLowerCase())
                );
            },
        },
        computed: {
            nodes: function () {
                let hidden_svg_canvas = document.querySelector("#hidden-svg")
                return Object.values(this.ordered_active_entries).filter((e) => {
                    return e.active && this.filter_entry(e)
                }).map((e) => {
                    let svgtext = text_as_SVG(e.name, hidden_svg_canvas)
                    console.log(svgtext)
                    return {
                        "id": e.key,
                        "name": e.name,
                        "svgSym": svgtext.text,
                        "_width": svgtext.width,
                        "_height": svgtext.height
                    }
                })
            },
            links: function () {
                console.log("links: ", Object.values(this.$store.state.references).filter((r) => {
                    return this.nodes.map((n) => n.id).includes(r.source.key) &&
                        this.nodes.map((n) => n.id).includes(r.target.key)
                }).map((r) => {
                    return {
                        "id": r.key, "tid": r.target.key, "sid": r.source.key
                    }
                }))
                return Object.values(this.$store.state.references).filter((r) => {
                    return this.nodes.map((n) => n.id).includes(r.source.key) &&
                        this.nodes.map((n) => n.id).includes(r.target.key)
                }).map((r) => {
                    return {
                        "id": r.key, "tid": r.target.key, "sid": r.source.key
                    }
                })
            },
            options: function () {
                return {
                    nodeLabels: false,
                    canvas: false,
                    fontSize: 20,
                    size: {w: 1800, h: 800},
                    force: 4000
                }
            },
            ordered_active_entries: function () {
                return Object.fromEntries(
                    Object.entries(this.$store.state.entries)
                        .filter((key_value) => key_value[1].active)
                        .sort(
                            // we simply use the lexicographical order on the (string) keys here
                            (key_value1, key_value2) =>
                                key_value1[0] < key_value2[0] ? 1 : -1
                        )
                );
            },
            ...mapState(["entries", "clients", "this_client"]),
            ...mapGetters(["this_user"]),
        },
        data: function () {
            return {
                selection: null,
                active_tab: null,
                search_query: "",
                open_entries: [], // indices of the 'computed.entries' array
                new_entries: [],
                create_entry_fab: false,
            };
        },
    }
    ;
</script>

<!--<style src="vue-d3-network/dist/vue-d3-network.css"></style>-->