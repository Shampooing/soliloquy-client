import Vue from "vue";
import Vuex from "vuex";
import {this_client_id} from "../config";
import {getEntryId, getReferenceId, getSyncMethod} from "../util";

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        this_client: {},
        clients: [],
        users: [],
        entries: {},
        references: {},
        staged: {
            // modifications that we need to push to the back-end
            workspaces: [],
            entries_indices: [], // indices of the objects in the state.entries array
            references_indices: [], // indices of the objects in the state.references array
        },
    },
    getters: {
        this_user: function (state) {
            return state.users.find((user) => user.url == state.this_client.owner);
        },

        staged_workspaces_indices: function (state) {
            return state.staged.workspaces;
        },

        staged_entries_indices: function (state) {
            return state.staged.entries_indices;
        },

        staged_references: function (state) {
            return state.staged.references;
        },

        _staged: function (state) {
            return state.staged;
        },

        reference_list: function (state) {
            return Object.values(state.references);
        },

        entry_key_from_url: (state) => (url) => {
            // Get the state.entries as an array of [entry_key, entry], return the first entry_key for which entry.url
            // matches the given url.
            return Object.entries(state.entries).find((key_value) => key_value[1]["url"] == url)[0]
        },

        entry_key_from_specialized_url: (state) => (url) => {
            // Get the state.entries as an array of [entry_key, entry], return the first entry_key for which
            // entry.specialized_url matches the given url.
            return Object.entries(state.entries).find((key_value) => key_value[1]["specialized_url"] == url)[0]
        },

        notebook_keys: function (state) {
            return Object.entries(state.entries).filter((key_and_obj) => {
                return key_and_obj[1].resourcetype == 'Notebook'
            }).map((key_and_obj) => {
                return key_and_obj[0]
            })
        },

        projects: function (state) {
            return Object.entries(state.entries).filter((key_and_obj) => {
                return key_and_obj[1].resourcetype == 'Project'
            }).map((key_and_obj) => {
                return key_and_obj[1]
            })
        },
    },
    mutations: {
        // ---- init ----
        load_users: function (state, users) {
            state.users = users;
        },
        load_clients: function (state, clients) {
            state.clients = clients;
            console.log(clients)
            console.log()
            state.this_client = clients.find((c) => c.id == this_client_id)
        },
        load_entries: function (state, entries) {
            for (let entry of entries) {
                Vue.set(state.entries, getEntryId(entry), entry);
            }
        },
        load_references: function (state, references) {
            for (let reference of references) {
                Vue.set(state.references, getReferenceId(reference), reference);
            }
        },

        // ---- entries ----
        update_entry: function (state, entry) {
            let entry_key = getEntryId(entry);
            if (!state.entries.hasOwnProperty(entry_key)) {
                // if the entry does not exist yet, create it
                Vue.set(state.entries, entry_key, entry);
                return;
            }
            let combined_entry = Object.assign(state.entries[entry_key], entry);
            // call Vue.set manually so that we keep reactivity on the new attributes
            Vue.set(state.entries, entry_key, combined_entry);
        },

        update_reference: function (state, reference) {
            let reference_key = getReferenceId(reference);
            if (!state.references.hasOwnProperty(reference_key)) {
                // if the reference does not exist yet, create it
                Vue.set(state.references, reference_key, reference);
                return;
            }
            let combined_reference = Object.assign(state.references[reference_key], reference);
            // call Vue.set manually so that we keep reactivity on the new attributes
            Vue.set(state.references, reference_key, combined_reference);
        },

        set_entry_url: function (state, {entry_key, url}) {
            Vue.set(state.entries[entry_key], "url", url);
        },

        set_reference_url: function (state, {reference_key, url}) {
            Vue.set(state.references[reference_key], "url", url);
        },

        stage_entry: function (state, entry_index) {
            if (state.staged.entries_indices.includes(entry_index)) {
                console.warn("Entry " + entry_index + " is already staged.");
                return;
            }
            state.staged.entries_indices.push(entry_index);
        },

        stage_reference: function (state, reference_index) {
            if (state.staged.references_indices.includes(reference_index)) {
                console.warn("Reference " + reference_index + " is already staged.");
                return;
            }
            state.staged.references_indices.push(reference_index);
        },

        delete_entry: function (state, entry_index) {
            Vue.set(state.entries[entry_index], "active", false);
        },

        restore_entry: function (state, entry_index) {
            Vue.set(state.entries[entry_index], "active", true);
        },

        unstage: function (state, {stage_type, stage_object_index}) {
            state.staged[stage_type].splice(stage_object_index, 1);
        },
    },
    actions: {
        // ---- init ----
        load_users: function (context, users) {
            context.commit("load_users", users);
        },
        load_clients: function (context, clients) {
            context.commit("load_clients", clients);
        },
        load_entries: function (context, entries) {
            context.commit("load_entries", entries);
        },
        load_references: function (context, references) {
            context.commit("load_references", references);
        },

        update_entry: function (context, {entry, sync_with_backend = true}) {
            // console.log("action update_entry called");
            context.commit("update_entry", entry);
            if (!sync_with_backend) {
                return // We're done
            }
            let entry_index = getEntryId(entry);
            context.commit("stage_entry", entry_index);
            context.dispatch("commit_staged_entry", entry_index).then((url) => {
                if ("url" in context.state.entries[entry_index]) {
                    return; // nothing to do since we already have a url for the entry
                }
                // console.log("adding url " + url + " to entry " + entry_index);
                context.commit("set_entry_url", {entry_key: entry_index, url: url});
                // console.log("unstaging entry " + entry_index);
                context.commit("unstage", {
                    stage_type: "entries_indices",
                    stage_object_index: entry_index,
                });
            });
        },

        update_reference: function (context, {reference, sync_with_backend = true}) {
            // Update a reference, and stage it (if sync_with_backend is set to True).
            // Additionally, update the 'referenced_by' attribute of the target entry so that it contains the reference.
            // We don't update the 'references' attribute of the source entry, as it is assumed to be updated upfront
            // (by the caller of this action).
            // console.log("action update_reference called");
            context.commit("update_reference", reference);

            if (sync_with_backend) {
                let reference_index = getReferenceId(reference);
                context.commit("stage_reference", reference_index);
                context.dispatch("commit_staged_reference", reference_index).then((url) => {
                    if ("url" in context.state.references[reference_index]) {
                        return; // nothing to do since we already have a url for the entry
                    }
                    // console.log("adding url " + url + " to reference " + reference_index);
                    context.commit("set_reference_url", {reference_key: reference_index, url: url});
                    // console.log("unstaging reference " + reference_index);
                    context.commit("unstage", {
                        stage_type: "references_indices",
                        stage_object_index: reference_index,
                    });
                });
            }

            // The target entry is now referenced by the reference, so we update it accordingly if needed:
            let target = context.state.entries[reference.target.key];
            if (!target.referenced_by.map((ref) => ref.key).includes(reference.key)) {
                target.referenced_by.push({key: reference.key, url: context.state.references[reference.key].url})
            }
        },

        delete_entry: function (context, entry_index) {
            context.commit("delete_entry", entry_index);
            context.commit("stage_entry", entry_index);
            context.dispatch("commit_staged_entry", entry_index);
        },

        restore_entry: function (context, entry_index) {
            context.commit("restore_entry", entry_index);
            context.commit("stage_entry", entry_index);
            context.dispatch("commit_staged_entry", entry_index);
        },

        commit_staged_entry: function (context, entry_index) {
            // commit the entry at the given index to the backend, and returns a promise resolving to
            // the url of the object that was created/modified
            // console.log("action commit_staged_entry called");
            // console.log("entry key : " + entry_index);
            let entry = context.state.entries[entry_index];
            let sync_method = getSyncMethod(entry);
            return sync_method(entry).then((response) => {
                return response.data.url;
            });
        },

        commit_staged_reference: function (context, reference_index) {
            // commit the reference at the given index to the backend, and returns a promise resolving to
            // the url of the object that was created/modified
            // console.log("action commit_staged_reference called");
            // console.log("reference key : " + reference_index);
            let reference = context.state.references[reference_index];
            let sync_method = getSyncMethod(reference);
            let reference_payload = {
                source: context.state.entries[reference.source.key].url,  // TODO handle the tricky cases where these urls are not available yet...
                target: context.state.entries[reference.target.key].url,
                active: reference.active,
                reference_id: reference.reference_id,
            }
            // console.log(reference_payload)
            return sync_method(reference_payload).then((response) => {
                return response.data.url;
            });
        },
    },
});
