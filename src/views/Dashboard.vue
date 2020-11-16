<template>
  <v-container class="ma-0" fluid>
    <v-row>
      <v-col>
        <v-card flat>
          <v-card-title>
            <v-select
                :items="next_days_choice_values"
                item-text="label"
                item-value="value"
                v-model="next_days_choice"
                label="Time frame:"
                style="max-width: 30vh"
            ></v-select>
          </v-card-title>
        </v-card>
      </v-col>
    </v-row>
    <v-dialog v-model="show_edit_dialog" max-width="1200" overlay-opacity="0.1">
      <v-card class="pa-2">
        <generic-entry-editor
            :entry_index="edited_entry_key"
            @entry-save="show_edit_dialog = false"
            @entry-delete-event="show_edit_dialog = false"
        >
        </generic-entry-editor>
      </v-card>
    </v-dialog>
    <v-row>
      <v-col cols="6">
        <v-card max-height="85vh" class="overflow-y-auto">
          <v-card-title>
            Upcoming tasks
          </v-card-title>
          <v-card-text>
            <v-data-table
                dense
                :headers="task_headers"
                item-key="name"
                :items="tasks_to_show"
                :footer-props="{'items-per-page-options': [-1]}"

                @click:row="edit_entry"
            >
              <template v-slot:item.name="{ item }">
                <v-container>
                  <v-row>
                    {{ item.name }}
                    <v-spacer></v-spacer>
                    <v-chip
                        v-for="status in task_statuses(item)"
                        :key="status.name"
                        class="ml-1 disable-events"
                        x-small
                        :dark="status.dark"
                        :color="status.color"
                    >
                      {{ status.name }}
                    </v-chip>
                  </v-row>
                </v-container>
              </template>
              <template v-slot:item.assignee="{ item }">
                {{ username_from_url(item.assignee) }}
              </template>
              <template v-slot:item.due_date="{ item }">
                {{ time_until(item.due_date) }}
              </template>
              <template v-slot:item.expiration_date="{ item }">
                {{ time_until(item.expiration_date) }}
              </template>
              <template v-slot:item.parent_project="{ item }">
                {{ project_name_from_url(item.parent_project) }}
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6">
        <v-card max-height="85vh" class="overflow-y-auto">
          <v-card-title>
            Upcoming events
          </v-card-title>
          <v-card-text>
            <v-data-table
                dense
                :headers="event_headers"
                item-key="name"
                :items="events_to_show"
                :footer-props="{'items-per-page-options': [-1]}"
                @click:row="edit_entry"
            >
              <template v-slot:item.start="{ item }">
                {{ pretty_start_time(item) }}
              </template>
              <template v-slot:item.end="{ item }">
                {{ pretty_end_time(item) }}
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import {colors_of_entry_types} from "../config";
import {mapGetters, mapState} from "vuex";
import GenericEntryEditor from "@/components/GenericEntryEditor";
import {getEntryId, task_statuses} from "@/util";
import moment from "moment";

export default {
  name: "Dashboard",
  components: {
    GenericEntryEditor,
  },
  data () {
    return {
      edited_entry_key: null,
      show_edit_dialog: false,
      task_headers: [
        { text: "Task", value: "name" },
        { text: "Project", value: "parent_project" },
        { text: "Due", value: "due_date" },
        { text: "Expires", value: "expiration_date" },
        { text: "Priority", value: "priority" },
      ],
      event_headers: [
        { text: "Event", value: "name" },
        { text: "Start", value: "start" },
        { text: "End", value: "end" },
      ],
      colors_of_entry_types,
      next_days_choice_values: [
        { label: "Today", value: 1 },
        { label: "Next 2 days", value: 2 },
        { label: "Next 7 days", value: 7 },
        { label: "All time", value: -1 },
      ],
      next_days_choice: 2,
    }
  },
  computed: {
    ...mapState(["entries", "users"]),
    ...mapGetters(["projects"]),
    tasks_to_show () {
      return Object.values(this.entries).filter(
          (entry) => (
              entry.active
              && entry.resourcetype === "Task"
              && !entry.done
              && (this.next_days_choice > 0 ? (entry.due_date && moment(entry.due_date) < moment().add(this.next_days_choice, 'days')) : true)
              && (!entry.expiration_date || (moment(entry.expiration_date) > moment()))
          )
      );
    },
    events_to_show () {
      return Object.values(this.entries).filter(
          (entry) => (
              entry.active
              && entry.resourcetype === "Event"
              && moment(entry.start_date + " " + (entry.start_time || "")).isAfter(moment())
              && (this.next_days_choice > 0 ? (moment(entry.start_date + " " + (entry.start_time || "")).isBefore(moment().add(this.next_days_choice, 'day'))) : true)
          )
      );
    },
  },
  methods: {
    edit_entry: function(entry) {
      this.edited_entry_key = getEntryId(entry);
      this.show_edit_dialog = true;
    },
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
    time_until (datetime_str) {
      if (!datetime_str) {
        return ''
      }
      return moment().to(moment(datetime_str))
    },
    task_statuses: task_statuses,
    pretty_start_time (event) {
      return moment(event.start_date + (event.all_day ? '' : ' ' + event.start_time)).calendar()
    },
    pretty_end_time (event) {
      return moment(event.end_date + (event.all_day ? '' : ' ' + event.end_time)).calendar()
    },
  },
}
</script>

<style scoped>

</style>
