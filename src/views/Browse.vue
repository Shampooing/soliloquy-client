<template>
    <v-container align-start fluid class="pa-0">
        <v-row align="start" justify="center">
            <v-col class="pt-0 pr-0">
                <v-sheet :flat="offset_top == 0" :elevation="offset_top > 0 ? 5 : 0" class="py-3 mb-2">
                    <v-text-field
                            flat
                            outlined
                            prepend-inner-icon="mdi-magnify"
                            label="Search"
                            v-model="search_query"
                            class="ml-3"
                            solo
                            clearable
                            hide-details="auto"
                            tile="false"
                    >
                        <template v-slot:append-outer>
                            <v-tooltip bottom open-delay="300">
                                <template v-slot:activator="{ on, attrs }">
                                    <v-btn @click.stop="show_deleted_entries = !show_deleted_entries" icon v-on="on">
                                        <v-icon>{{ show_deleted_entries ? 'mdi-eye-outline' : 'mdi-eye-off-outline' }}</v-icon>
                                    </v-btn>
                                </template>
                                <span>{{ show_deleted_entries ? 'Show' : 'Hide' }} deleted entries</span>
                            </v-tooltip>
                        </template>
                    </v-text-field>
                </v-sheet>
                <v-sheet
                        flat
                        style="max-height: 93vh"
                        class="pb-0 overflow-y-auto"
                        id="scroll-target"
                >
                    <v-container
                            class="fill-height overflow-y-auto py-0 my-0"
                            v-scroll:#scroll-target="on_scroll"
                    >
                        <v-sheet v-if="!ordered_entries">
                            There are no entries yet. Create one!
                        </v-sheet>
                        <v-row
                                v-for="(entry, entry_key) in ordered_entries"
                                :key="entry_key"
                        >
                            <v-col v-if="filter_entry(entry)">
                                <drag :data="{key: entry.key}">
                                    <v-hover>
                                        <template v-slot:default="{ hover }">
                                            <v-card
                                                    tile
                                                    outlined
                                                    :dark="entry.done"
                                                    :color="entry.done ? 'blue-grey lighten-3' : ''"
                                                    @click.stop="open_entry(entry_key)"
                                                    elevation="2"
                                                    :class="!entry.active ? 'text--disabled' : ''"
                                            >
                                                <v-card-title>
                                                    {{ entry.name }}
                                                    <v-spacer></v-spacer>
                                                    <div>
                                                        <v-btn
                                                                v-if="!entry.active"
                                                                x-small
                                                                icon
                                                                class="px-1 my-0 disable-events"
                                                        >
                                                            <v-icon>
                                                                mdi-trash-can-outline
                                                            </v-icon>
                                                        </v-btn>
                                                        <v-chip :color="entry_color(entry)" small class="disable-events">
                                                            {{ entry.resourcetype }}
                                                        </v-chip>
                                                    </div>
                                                </v-card-title>
                                                <v-card-subtitle>
                                                    {{ user_from_client( entry.client ) }}, on
                                                    {{ pretty_date( entry.creation_date ) }}
                                                </v-card-subtitle>
                                                <v-card-text v-if="entry.content.length > 0">
                                                    {{ preview(entry.content) }}
                                                </v-card-text>
                                                <v-fade-transition>
                                                    <v-overlay
                                                            v-if="hover"
                                                            absolute
                                                            color="grey"
                                                            opacity="0.1"
                                                    >
                                                    </v-overlay>
                                                </v-fade-transition>
                                            </v-card>
                                        </template>
                                    </v-hover>
                                </drag>
                            </v-col>
                        </v-row>
                    </v-container>
                </v-sheet>
            </v-col>

            <v-col class="mr-3 mb-0 overflow-y-auto">
                <v-card v-if="open_entries.length > 0">
                    <v-tabs v-model="active_tab" background-color="primary" center-active>
                        <v-tab
                                v-for="opened_entry_index in open_entries"
                                :key="opened_entry_index"
                                @click.ctrl.stop="close_entry(opened_entry_index)"
                                @click.middle.stop="close_entry(opened_entry_index)"
                                class="pr-1"
                        >
                            {{ entries[opened_entry_index].name.substring(0, 25) + ((entries[opened_entry_index].name.length > 25) ? "..." : "") }}
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
                            <generic-entry-editor
                                    :entry_index="opened_entry_index"
                                    v-on:entry-delete-event="close_entry"
                                    v-on:follow-link="open_entry"
                                    style="max-height: 85vh"
                                    class="overflow-y-auto"
                            ></generic-entry-editor>
                        </v-tab-item>
                    </v-tabs-items>
                </v-card>
            </v-col>
        </v-row>
        <v-speed-dial
                v-model="create_entry_fab"
                fixed
                bottom
                open-on-hover
                right
                direction="top"
                class="my-2 mx-10"
        >
            <template v-slot:activator>
                <v-btn v-model="create_entry_fab" color="primary" dark fab small>
                    <v-icon>mdi-plus</v-icon>
                </v-btn>
            </template>
            <v-btn width="135" text dark color="primary" @click.stop="create_entry('Note')">
                <v-icon class="px-1">mdi-note</v-icon>
                Note
            </v-btn>
            <v-btn width="135" text dark color="primary" @click.stop="create_entry('Notebook')">
                <v-icon class="px-1">mdi-book-open-page-variant</v-icon>
                Notebook
            </v-btn>
            <v-btn width="135" text dark color="primary" @click.stop="create_entry('Task')">
                <v-icon class="px-1">mdi-clipboard-check</v-icon>
                Task
            </v-btn>
            <v-btn width="135" text dark color="primary" @click.stop="create_entry('Project')">
                <v-icon class="px-1">mdi-clipboard-text-multiple</v-icon>
                Project
            </v-btn>
            <v-btn width="135" text dark color="primary" @click.stop="create_entry('Event')">
                <v-icon class="px-1">mdi-calendar</v-icon>
                Event
            </v-btn>
            <v-btn width="135" text dark color="primary" @click.stop="create_entry('Saga')">
                <v-icon class="px-1">mdi-chart-timeline-variant-shimmer</v-icon>
                Saga
            </v-btn>
        </v-speed-dial>
    </v-container>
</template>

<script>
    import GenericEntryEditor from "../components/GenericEntryEditor";
    import {mapGetters, mapState} from "vuex";
    import {getEntryId} from "../util";
    import {Drag} from "vue-easy-dnd";
    import moment from "moment"
    import {colors_of_entry_types} from "../config";

    export default {
        name: "Browse",
        components: {
            GenericEntryEditor,
            Drag,
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
            create_entry: function (entry_type, referenced_by) {
                let entry = {
                    client: this.this_client["id"],
                    creation_date: moment().format(),
                    id: 1, // TODO use a proper counter here
                    name: "Untitled " + entry_type,
                    content: "",
                    resourcetype: entry_type,
                    references: [],
                    referenced_by: referenced_by || [],
                    active: true,
                };
                if (entry_type === 'Note') {

                }
                else if (entry_type === 'Notebook') {

                }
                else if (entry_type === 'Event') {
                  let now = new moment()
                  let later = now.clone().add(1, 'hour')
                  entry['start_date'] = now.format("YYYY-MM-DD")
                  entry['start_time'] = now.format("HH:mm")
                  entry['end_date'] = later.format("YYYY-MM-DD")
                  entry['end_time'] = later.format("HH:mm")
                }
                else if (entry_type === 'Saga') {

                }
                else if (entry_type === 'Task') {
                  entry['assignee'] = this.this_user.url
                  entry['done'] = false
                  entry['due_date'] = null
                  entry['expiration_date'] = null
                }
                else if (entry_type === 'Project') {

                }

                let entry_key = getEntryId(entry);
                entry["key"] = entry_key;
                this.$store.dispatch("update_entry", {entry});
                this.open_entries.push(entry_key);
                this.active_tab = this.open_entries.length - 1;
            },
            filter_entry: function (entry) {
                if (!(this.entry_types_to_display.includes(entry.resourcetype)))  {
                    return false
                }
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
            preview: function (content, n = 120) {
                // Extract the first n characters of an entry's content
                let prev;
                try {
                    let parsed_content = JSON.parse(content).content;
                    prev = parsed_content.filter(
                        (c) => "content" in c
                    ).map(
                        (c) => c.content.filter(
                            (e) => "text" in e
                        ).map(
                            (e) => e.text
                        ).join(" ")
                    ).join(" ")
                }
                catch (e) {
                    prev = content
                }
                return prev.substring(0, n) + ((prev.length > n) ? "..." : "")
            },
            pretty_date: function (datestr) {
                return moment(datestr).format("YYYY-MM-DD HH:mm")
            },
            user_from_client: function (client_id) {
                let client = this.clients.find((c) => c.id == client_id)
                return this.users.find((u) => u.url == client.owner).django_user.username
            },
            entry_color: function (entry) {
                if (entry.done) {
                    return 'grey'
                }
                return colors_of_entry_types[ entry.resourcetype ]
            },
            on_scroll (e) {
                this.offset_top = e.target.scrollTop
            },
        },
        computed: {
            ordered_entries: function () {
                let all_entries = Object.entries(this.$store.state.entries)
                if (!this.show_deleted_entries) {
                    all_entries = all_entries.filter((key_value) => key_value[1].active)
                }
                return Object.fromEntries(
                    all_entries.sort(
                        // we simply use the lexicographical order on the (string) keys here
                        (key_value1, key_value2) =>
                            key_value1[0] < key_value2[0] ? 1 : -1
                    )
                );
            },
            entry_types_to_display: function () {
                return this.$attrs.browse_selected_entry_types.map( (e) => e.entry_type )
            },
            ...mapState(["entries", "clients", "users", "this_client"]),
            ...mapGetters(["this_user"]),
        },
        data: function () {
            return {
                active_tab: null,
                search_query: "",
                open_entries: [], // indices of the 'computed.entries' array
                new_entries: [],
                create_entry_fab: false,
                show_deleted_entries: false,
                offset_top: 0,  // hack to mimic a sticky app bar
            };
        },
    };
</script>

<style>

    .disable-events {
        pointer-events: none
    }

</style>