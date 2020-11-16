<template>

    <v-container>

        <v-row>
            <v-col cols="12" sm="6">
                <v-card>
                    <v-card-title>
                        References
                    </v-card-title>
                    <v-card-text v-if="references.length == 0">
                        This entry doesn't reference anything at the moment.
                    </v-card-text>
                    <v-list dense>
                        <v-list-item v-for="reference in references" :key="reference.key"
                                     @click.stop="follow_link(get_reference(reference.key).target.key)">
                            <v-list-item-content>
                                {{ get_entry(get_reference(reference.key).target.key).name }}
                            </v-list-item-content>
                        </v-list-item>
                    </v-list>
                </v-card>
            </v-col>

            <v-col cols="12" sm="6">
                <v-card>
                    <v-card-title>
                        Referenced by
                    </v-card-title>
                    <v-card-text v-if="referenced_by.length == 0">
                        This entry is not referenced by anything else at the moment.
                    </v-card-text>
                    <v-list dense>
                        <v-list-item v-for="reference in referenced_by" :key="reference.key"
                                     @click.stop="follow_link(get_reference(reference.key).source.key)">
                            <v-list-item-content>
                                {{ get_entry(get_reference(reference.key).source.key).name }}
                            </v-list-item-content>
                        </v-list-item>
                    </v-list>
                </v-card>
            </v-col>
        </v-row>

    </v-container>


</template>


<script>
    import {mapState} from 'vuex';

    export default {
        name: "ReferenceViewer",
        components: {},
        props: ["references", "referenced_by"],
        data: function () {
            return {};
        },
        computed: {
            ...mapState(["entries"])
        },
        methods: {
            follow_link: function (entry_key) {
                console.log("entry key is " + entry_key + " in reference viewer")
                this.$emit("follow-link", entry_key)
            },
            get_reference: function (reference_key) {
                return this.$store.state.references[reference_key]
            },
            get_entry: function (entry_key) {
                return this.$store.state.entries[entry_key]
            },
        },
    };
</script>