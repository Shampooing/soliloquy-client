<template>
  <v-container class="px-0">
    <v-row>
      <v-col cols="10" class="py-2">
        <v-row no-gutters>
          <v-col class="mr-2">
            <v-select class="pt-0 pb-2" hide-details label="Priority" append-icon="" v-model="task.priority" :items="PriorityLevels" clearable menu-props="offsetY"></v-select>
          </v-col>
          <v-col class="mx-2">
            <v-menu offset-y>
              <template v-slot:activator="{ on, attrs }">
                <v-text-field class="pt-0 pb-1" hide-details label="Due date" v-model="due_date" flat v-on="on" clearable></v-text-field>
              </template>
              <v-date-picker v-model="due_date" :max="expiration_date"></v-date-picker>
            </v-menu>
          </v-col>
          <v-col class="mx-2">
            <v-menu offset-y>
              <template v-slot:activator="{ on, attrs }">
                <v-text-field class="pt-0 pb-1" hide-details label="Expiration date" v-model="expiration_date" flat v-on="on" clearable></v-text-field>
              </template>
              <v-date-picker v-model="expiration_date" :min="due_date"></v-date-picker>
            </v-menu>
          </v-col>
          <v-col class="ml-2">
            <v-select class="pt-0 pb-2" hide-details label="Recurrence" append-icon="" clearable menu-props="offsetY"></v-select>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="2" class="py-2">
        <v-row no-gutters>
          <v-spacer></v-spacer>
          <v-btn elevation="0">
            <v-progress-circular size="22" value="60" color="orange" class="mr-3"></v-progress-circular>
            Progress
          </v-btn>
          <v-spacer></v-spacer>
        </v-row>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="10" class="py-2">
        <v-row no-gutters>
          <v-col class="mr-2 py-0">
            <v-select class="pt-0" hide-details label="Project" append-icon="" :items="projects" clearable menu-props="offsetY"
                      item-text="name"
                      item-value="specialized_url"
                      v-model="task.parent_project"></v-select>
          </v-col>
          <v-col class="mx-2 py-0">
            <v-select class="pt-0" hide-details label="Assigned to" append-icon="" :items="users" clearable menu-props="offsetY"
                      item-text="django_user.username"
                      item-value="url"
                      v-model="task.assignee"></v-select>
          </v-col>
          <v-col class="mx-2 py-0">
            <v-select class="pt-0" hide-details label="Unit of work -- deprecated" append-icon="" clearable menu-props="offsetY"></v-select>
          </v-col>
          <v-col class="ml-2 py-0">
            <v-combobox class="pt-0" hide-details label="Effort estimate (hours)" append-icon="" clearable menu-props="offsetY"
                        v-model="task.effort_estimate"
                        :items="EffortEstimateDefaultValues"
            ></v-combobox>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="2" class="py-2">
        <v-row no-gutters>
          <v-tooltip bottom open-delay="300">
            <span>Start progress now (not implemented yet -- sorry!)</span>
            <template v-slot:activator="{ on }">
              <v-btn elevation="0" small v-on="on" class="mr-1 py-4">
                <v-icon>mdi-timer-outline</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
          <v-spacer></v-spacer>
          <v-tooltip bottom open-delay="300">
            <span>Schedule work later (not implemented yet -- sorry!)</span>
            <template v-slot:activator="{ on }">
              <v-btn elevation="0" small v-on="on" class="mx-0 py-4">
                <v-icon>mdi-calendar-arrow-right</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
          <v-spacer></v-spacer>
          <v-tooltip bottom open-delay="300">
            <span>{{ task.done ? 'Reopen task' : 'Mark as done' }}</span>
            <template v-slot:activator="{ on }">
              <v-btn elevation="0" small v-on="on" class="ml-1 py-4" @click="task.done = !task.done">
                <v-icon>{{ task.done ? 'mdi-restore-alert' : 'mdi-check' }}</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import {mapGetters, mapState} from "vuex";
import Vue from "vue";
import {TheMask} from 'vue-the-mask'
import {colors_of_entry_types} from "../config";
import {EffortEstimateDefaultValues, PriorityLevels} from "@/enums";
import moment from "moment"


export default {
  components: {
    TheMask,
  },
  computed: {
    ...mapState(["users", "entries"]),
    ...mapGetters(["this_user", "projects"]),
    due_date: {
      set (newval) {
        this.task.due_date = newval ? moment(newval).format("YYYY-MM-DD HH:mm") : null
      },
      get () {
        return this.task.due_date ? moment(this.task.due_date).format("YYYY-MM-DD") : ''
      },
    },
    expiration_date: {
      set (newval) {
        if (newval) {
          this.task.expiration_date = moment(newval).format("YYYY-MM-DD HH:mm")
          if (!this.due_date) {
            this.due_date = this.task.expiration_date
          }
        }
        else {
          this.task.expiration_date = null
        }
      },
      get () {
        return this.task.expiration_date ? moment(this.task.expiration_date).format("YYYY-MM-DD") : ''
      },
    },
  },
  props: {
    task: {
      parent_project: null,
      assignee: null,
      effort_estimate: null,
      due_date: null,
      expiration_date: null,
    },
  },
  data: function () {
    return {
      textFieldProps: {dense: true},
      colors_of_entry_types,
      PriorityLevels,
      EffortEstimateDefaultValues
    };
  },
};
</script>
