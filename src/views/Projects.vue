<template>
  <v-card class="fill-height" flat>
    <v-card-title>
      <v-text-field
              v-model="search"
              prepend-icon="mdi-magnify"
              label="Search"
              class="pt-0 mr-6"
              single-line
              hide-details
      ></v-text-field>

      <v-btn-toggle v-model="open_or_closed_tasks" mandatory>
        <v-btn @click="calendar_type = 'open'" value="open" small>
          Open tasks
        </v-btn>
        <v-btn @click="calendar_type = 'closed'" value="closed" small>
          Closed tasks
        </v-btn>
      </v-btn-toggle>
    </v-card-title>

    <v-dialog v-model="show_edit_dialog" max-width="1200" overlay-opacity="0.1">
      <v-card class="pa-2">
        <generic-entry-editor
                :entry_index="edited_task_key"
                @entry-save="show_edit_dialog = false"
                @entry-delete-event="show_edit_dialog = false"
        >
        </generic-entry-editor>
      </v-card>
    </v-dialog>

    <v-data-table
            dense
            :search="search"
            :headers="headers"
            item-key="name"
            :items="open_or_closed_tasks === 'open' ? open_tasks() : closed_tasks()"
            :footer-props="{'items-per-page-options': [50, -1]}"

            @click:row="edit_task"
    >
      <template v-slot:item.assignee="{ item }">
        {{ username_from_url(item.assignee) }}
      </template>
      <template v-slot:item.due_date="{ item }">
        {{ datetime_format(item.due_date) }}
      </template>
      <template v-slot:item.expiration_date="{ item }">
        {{ datetime_format(item.expiration_date) }}
      </template>
      <template v-slot:item.parent_project="{ item }">
        {{ project_name_from_url(item.parent_project) }}
      </template>
    </v-data-table>
  </v-card>
</template>

<script>
  import { mapGetters, mapState } from "vuex";
  import GenericEntryEditor from "../components/GenericEntryEditor";
  import { getEntryId } from "@/util";
  import moment from "moment"

  export default {
    name: "Projects",
    components: { GenericEntryEditor },
    data: function() {
      return {
        debug: false,
        search: "",
        headers: [
          { text: "Task", value: "name" },
          { text: "Assignee", value: "assignee" },
          { text: "Project", value: "parent_project" },
          { text: "Due date", value: "due_date" },
          { text: "Expiration date", value: "expiration_date" },
          { text: "Priority", value: "priority" },
          { text: "Effort estimate", value: "effort_estimate" },
        ],
        show_edit_dialog: false,
        edited_task_key: null,
        open_or_closed_tasks: 'open',
      };
    },
    computed: {
      ...mapState(["entries", "users"]),
      ...mapGetters(["projects"]),
    },
    methods: {
      tasks: function() {
        return Object.values(this.entries).filter(
                (entry) => entry.active && entry.resourcetype === "Task"
        );
      },
      open_tasks: function() {
        return this.tasks().filter((task) => !task.done);
      },
      closed_tasks: function() {
        return this.tasks().filter((task) => task.done);
      },
      edit_task: function(task) {
        console.log(getEntryId(task));

        this.edited_task_key = getEntryId(task);
        this.show_edit_dialog = true;
      },
      // object_from_url: function (url) {
      //   // waterfall as i'm too lazy to extract the object type from the url
      //   if (!url) { return }
      //   let stuff_to_look_into = [ this.entries, this.users ]
      //   for (const collection in stuff_to_look_into) {
      //    let match = collection.find((x) => x.url === url)
      //    if (match) {}
      //   }
      //   let matching_entry = this.entries.find((e) => e.url === url)
      //   if (matching_entry) {
      //     return matching_entry
      //   }
      //   let matching_user = this.users.find((e) => e.url === url)
      //   if (matching_entry) {
      //     return matching_entry
      //   }
      // },
      username_from_url: function(url) {
        if (!url) { return "" }
        let match = this.users.find((user) => user.url === url)
        if (match) {
          return match.django_user.username
        }
      },
      project_name_from_url: function(url) {
        if (!url) { return "" }
        let match = this.projects.find((project) => project.specialized_url === url)
        if (match) {
          return match.name
        }
      },
      datetime_format: function(datetime) {
        if (datetime) {
          let m = new moment(datetime)
          let format = "YYYY-MM-DD"
          if (m.hour() || m.minute()) {
            format += " HH:mm"
          }
          return m.format(format)
        }
      },
    },
  };
</script>
