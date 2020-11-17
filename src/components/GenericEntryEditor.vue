<template>
  <v-container class="pa-6">
    <v-row align="center" no-gutters class="pb-4">
      <v-col cols="10">
        <v-text-field
            :placeholder="new_entry_state.resourcetype + ' name'"
            name="title"
            v-model="new_entry_state.name"
            class="title mr-2 py-0 my-0"
            height="40"
            dense
            hide-details
        >
          <template v-slot:append>
            <v-col>
              <v-row align="center">
                <v-chip
                    v-if="new_entry_state.resourcetype === 'Task'"
                    v-for="status in task_statuses(new_entry_state)"
                    :key="status.name"
                    class="ml-1 disable-events"
                    small
                    :dark="status.dark"
                    :color="status.color"
                >
                  {{ status.name }}
                </v-chip>
              </v-row>
            </v-col>
          </template>
        </v-text-field>
      </v-col>
      <v-col align-self="end">
        <v-row class="pa-0 ma-0">
          <v-spacer></v-spacer>
          <v-btn color="success" class="mr-1" @click.stop="save_entry" depressed small>
            Save
          </v-btn>
          <v-btn class="ml-1" depressed small v-if="!new_entry_state.active" @click.stop="restore_entry">
            Restore
          </v-btn>
          <v-dialog v-model="show_delete_dialog" max-width="600" overlay-opacity="0.1" v-if="new_entry_state.active">
            <template v-slot:activator="{ on }">
              <v-btn class="ml-1" v-on="on" depressed small>
                <v-icon>
                  mdi-trash-can-outline
                </v-icon>
              </v-btn>
            </template>
            <v-card class="pa-2">
              <v-card-title>
                Are you sure you want to delete {{ new_entry_state.name }}?
              </v-card-title>
              <v-card-actions class="justify-center">
                <v-btn
                    color="error"
                    @click="
                show_delete_dialog = false;
                delete_entry();
              "
                >Delete
                </v-btn
                >
                <v-btn text @click="show_delete_dialog = false">Cancel</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-row>
      </v-col>
    </v-row>
    <v-row no-gutters>
      <task-editor
          :task="new_entry_state"
          v-if="new_entry_state.resourcetype === 'Task'"
      ></task-editor>
    </v-row>
    <v-row no-gutters>
      <event-editor
          :event_key="entry_index"
          :event="new_entry_state"
          v-if="new_entry_state.resourcetype === 'Event'"
      ></event-editor>
    </v-row>
    <v-row no-gutters>
      <v-col>
        <editor-menu-bar :editor="rich_editor"
                         :keep-in-bounds="bubble_menu_keepInBounds"
                         v-slot="{ commands, isActive, menu }">
          <div class="pb-1">
            <v-btn small text @click="commands.bold" :input-value="isActive.bold()" class="mr-1">
              <v-icon>mdi-format-bold</v-icon>
            </v-btn>
            <v-btn small text @click="commands.italic" :input-value="isActive.italic()">
              <v-icon>mdi-format-italic</v-icon>
            </v-btn>
          </div>
        </editor-menu-bar>
      </v-col>
    </v-row>
    <v-row no-gutters>
      <v-col cols=12>
        <drop @drop="create_reference_from_drag_drop">
          <editor-content class="editor-box" :editor="rich_editor"/>
        </drop>
      </v-col>
    </v-row>
    <v-row>
      <reference-viewer :references="new_entry_state.references"
                        :referenced_by="new_entry_state.referenced_by"
                        v-on:follow-link="follow_link"></reference-viewer>
    </v-row>
    <v-row>
      <child-viewer :container_key="entry_index" v-on:follow-link="follow_link" v-if="is_container_entry">
      </child-viewer>
    </v-row>
    <v-row>
      <v-col md="auto">
        <v-btn @click.stop="debug = !debug">Debug</v-btn>
      </v-col>
      <v-col v-if="debug">
        <v-row>
          <v-textarea readonly v-model="entryAsJSON" outlined></v-textarea>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import Vue from "vue";
import {Editor, EditorContent, EditorMenuBar} from "tiptap";
import {  // import all the extensions for now, we'll figure out later which ones we actually need
  Blockquote,
  Bold,
  BulletList,
  Code,
  CodeBlock,
  CodeBlockHighlight,
  Collaboration,
  HardBreak,
  Heading,
  History,
  HorizontalRule,
  Image,
  Italic,
  Link,
  ListItem,
  Mention,
  OrderedList,
  Placeholder,
  Table,
  TableHeader,
  TableCell,
  TableRow,
  TodoItem,
  TodoList,
  Strike,
  Underline
} from "tiptap-extensions";
import TaskEditor from "./TaskEditor";
import EventEditor from "./EventEditor";
import ReferenceViewer from "./ReferenceViewer";
import {Drop} from "vue-easy-dnd";
import {getReferenceId, task_statuses} from "../util";
import ChildViewer from "@/components/ChildViewer";
import {ContainerEntries} from "@/enums";

export default {
  components: {
    ChildViewer,
    ReferenceViewer,
    TaskEditor,
    EventEditor,
    Drop,
    EditorContent,
    EditorMenuBar,
  },
  props: {
    entry_index: null,
  },
  watch: {
    entry_index: function (newVal, _) {
      let entry_in_store = this.$store.state.entries[newVal]
      // update new_entry_state to reflect the change in entry_index
      Vue.set(this, "new_entry_state", entry_in_store)
      // update tiptap's editor's content as well
      this.editor_set_content(entry_in_store.content);
    },
  },
  created() {
    this.editor_set_content(this.$store.state.entries[this.entry_index].content);
    Vue.set(this, 'new_entry_state', {
      ...this.$store.state.entries[this.entry_index],
      // for 'referenced_by', we don't make a copy, as we want the property to be reactive
      // (it's read-only in the entry editor).
      referenced_by: this.$store.state.entries[this.entry_index].referenced_by,
    })
  },
  computed: {
    entryAsJSON: function () {
      return JSON.stringify(this.new_entry_state);
    },
    is_container_entry () {
      return ContainerEntries.map( (x) => x.name ).includes( this.new_entry_state.resourcetype )
    },
  },
  methods: {
    editor_set_content: function (raw_content) {
      if (!raw_content) {
        return
      }
      let content;
      try {
        content = JSON.parse(raw_content);
      } catch (err) {
        console.info("This is an old-style entry ! Save it now to convert it to a new-style (rich) entry.");
        content = {
          "type": "doc",
          "content": [
            {
              "type": "paragraph",
              "content": [
                {
                  "type": "text",
                  "text": raw_content
                }
              ],
            }
          ]
        }
      }
      this.rich_editor.setContent(content);
    },
    create_reference_from_drag_drop: function (event) {
      // here we'll assume that the target is a different entry than the current entry
      // (the drag-and-drop will be disabled if the target is the source) -- TODO
      console.log(event)
      let target = this.$store.state.entries[event.data.key];
      let reference_id = this.new_entry_state.references.length;
      let reference = {
        active: true,
        source: {"key": this.entry_index},
        reference_id,
        target: {"key": target.key}
      };
      reference["key"] = getReferenceId(reference);
      //this.rich_editor.setContent()  // <- insert a link in the entry content
      console.log(reference)
      this.$store.dispatch("update_reference", {reference, sync_with_backend: true}).then(
          () => {
            this.new_entry_state.references.push(this.$store.state.references[reference.key])
          }
      );
    },
    follow_link: function (entry_key) {
      console.log("in entry editor, following a link to " + entry_key)
      this.$emit("follow-link", entry_key)  // kind of a hack to avoid using vuex -- we re-emit the event
    },
    save_entry: function () {
      // tiptap content is not reactive so we get it manually
      this.new_entry_state.content = JSON.stringify(this.rich_editor.getJSON());

      if (this.new_entry_state.name.length == 0) {
        Vue.set(this.new_entry_state, "name", "Untitled " + this.new_entry_state.resourcetype)
      }
      console.log(this.new_entry_state)
      this.$store.dispatch("update_entry", {entry: this.new_entry_state}).then(() => {
        this.$emit(
            "entry-save",
            this.new_entry_state.resourcetype,
            this.new_entry_state.name
        );
      });
      // this.references_updates.map(function(reference) {
      //   this.$store.dispatch("update_request"), reference;
      // });
    },
    delete_entry: function () {
      this.$emit("entry-delete-event", this.entry_index);
      this.$store.dispatch("delete_entry", this.entry_index);
    },
    restore_entry: function () {
      this.new_entry_state.active = true  // small hack to avoids reloading the entire entry
      this.$store.dispatch("restore_entry", this.entry_index);
    },
    task_statuses: task_statuses,
  },
  data: function () {
    return {
      debug: false,
      bubble_menu_keepInBounds: true,
      show_delete_dialog: false,
      new_entry_state: null,
      rich_editor: new Editor({
        extensions: [
          new Blockquote(),
          new BulletList(),
          new CodeBlock(),
          new HardBreak(),
          new Heading({levels: [1, 2, 3]}),
          new ListItem(),
          new OrderedList(),
          new TodoItem(),
          new TodoList(),
          new Link({openOnClick: true}),
          new Bold(),
          new Code(),
          new Italic(),
          new History(),
          new Image(),
        ],
      }),
    };
  },
  beforeDestroy() {
    this.rich_editor.destroy()
  },
};
</script>

<style>
.editor-box > * {
  border-color: lightgrey;
  border-style: solid;
  border-width: 1px;
  padding: 10px;
}

.is-active {
  border-color: grey;
  border-style: solid;
  border-width: 1px;
}

.disable-events {
  pointer-events: none
}

</style>