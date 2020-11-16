<template>
  <v-container class="px-0">
    <v-row>
      <v-col class="py-2">
        <v-sheet flat class="d-flex align-center" height="40">
          <v-menu offset-y>
            <template v-slot:activator="{ on, attrs }">
              <v-sheet flat class="pr-1" width="120" height="40">
                <v-text-field hide-details class="pb-1" dense v-model="event.start_date" flat solo-inverted v-on="on"></v-text-field>
              </v-sheet>
            </template>
            <v-date-picker v-model="event.start_date" class="mt-0"></v-date-picker>
          </v-menu>

          <v-sheet flat class="px-1" width="78" height="40" v-if="!event.all_day">
            <v-combobox
                :items="time_choices_start"
                v-model="event.start_time"
                menu-props="auto"
                dense
                auto-select-first
                flat
                hide-details
                solo-inverted
                append-icon="">
            </v-combobox>
          </v-sheet>
          <v-sheet flat class="align-center mx-2">
            to
          </v-sheet>
          <v-sheet flat class="px-1" width="78" height="40" v-if="!event.all_day">
            <v-combobox
                :items="time_choices_end"
                v-model="combobox_end_time"
                item-text="end_desc"
                menu-props="auto"
                dense
                auto-select-first
                flat
                hide-details
                solo-inverted
                append-icon="">
              <template slot="selection" slot-scope="data">
                <!-- HTML that describe how select should render selected items -->
                {{ data.item.end_time }}
              </template>
            </v-combobox>
          </v-sheet>
          <v-menu offset-y>
            <template v-slot:activator="{ on, attrs }">
              <v-sheet flat class="pl-1" width="120" height="40">
                <v-text-field hide-details class="pb-1" dense v-model="event.end_date" flat solo-inverted v-on="on"></v-text-field>
              </v-sheet>
            </template>
            <v-date-picker v-model="event.end_date" :min="event.start_date"></v-date-picker>
          </v-menu>
        </v-sheet>
      </v-col>
    </v-row>
    <v-row class="align-center">
      <v-col class="py-2">
        <v-sheet flat class="d-flex align-center">
          <v-sheet width="90" class="pr-1">
            <v-checkbox class="mt-0 pt-0" label="All day" dense hide-details flat v-model="event.all_day"></v-checkbox>
          </v-sheet>
          <v-sheet width="160" class="pl-1">
            <v-select :items="repeat_choices" hide-details dense v-model="repeat" filled flat solo-inverted append-icon=""></v-select>
          </v-sheet>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>

import Vue from "vue"
import moment from "moment"

let times = [
  "00:00",
  "00:15",
  "00:30",
  "00:45",
  "01:00",
  "01:15",
  "01:30",
  "01:45",
  "02:00",
  "02:15",
  "02:30",
  "02:45",
  "03:00",
  "03:15",
  "03:30",
  "03:45",
  "04:00",
  "04:15",
  "04:30",
  "04:45",
  "05:00",
  "05:15",
  "05:30",
  "05:45",
  "06:00",
  "06:15",
  "06:30",
  "06:45",
  "07:00",
  "07:15",
  "07:30",
  "07:45",
  "08:00",
  "08:15",
  "08:30",
  "08:45",
  "09:00",
  "09:15",
  "09:30",
  "09:45",
  "10:00",
  "10:15",
  "10:30",
  "10:45",
  "11:00",
  "11:15",
  "11:30",
  "11:45",
  "12:00",
  "12:15",
  "12:30",
  "12:45",
  "13:00",
  "13:15",
  "13:30",
  "13:45",
  "14:00",
  "14:15",
  "14:30",
  "14:45",
  "15:00",
  "15:15",
  "15:30",
  "15:45",
  "16:00",
  "16:15",
  "16:30",
  "16:45",
  "17:00",
  "17:15",
  "17:30",
  "17:45",
  "18:00",
  "18:15",
  "18:30",
  "18:45",
  "19:00",
  "19:15",
  "19:30",
  "19:45",
  "20:00",
  "20:15",
  "20:30",
  "20:45",
  "21:00",
  "21:15",
  "21:30",
  "21:45",
  "22:00",
  "22:15",
  "22:30",
  "22:45",
  "23:00",
  "23:15",
  "23:30",
  "23:45",
]

let durations = [
  [0, "minute", "0 mins"],
  [15, "minute", "15 mins"],
  [30, "minute", "30 mins"],
  [45, "minute", "45 mins"],
  [1.0, "hour", "1 hr"],
  [1.5, "hour", "1.5 hrs"],
  [2.0, "hour", "2 hrs"],
  [2.5, "hour", "2.5 hrs"],
  [3.0, "hour", "3 hrs"],
  [3.5, "hour", "3.5 hrs"],
  [4.0, "hour", "4 hrs"],
  [4.5, "hour", "4.5 hrs"],
  [5.0, "hour", "5 hrs"],
  [5.5, "hour", "5.5 hrs"],
  [6.0, "hour", "6 hrs"],
  [6.5, "hour", "6.5 hrs"],
  [7.0, "hour", "7 hrs"],
  [7.5, "hour", "7.5 hrs"],
  [8.0, "hour", "8 hrs"],
  [8.5, "hour", "8.5 hrs"],
  [9.0, "hour", "9 hrs"],
  [9.5, "hour", "9.5 hrs"],
  [10.0, "hour", "10 hrs"],
  [10.5, "hour", "10.5 hrs"],
  [11.0, "hour", "11 hrs"],
  [11.5, "hour", "11.5 hrs"],
  [12.0, "hour", "12 hrs"],
  [12.5, "hour", "12.5 hrs"],
  [13.0, "hour", "13 hrs"],
  [13.5, "hour", "13.5 hrs"],
  [14.0, "hour", "14 hrs"],
  [14.5, "hour", "14.5 hrs"],
  [15.0, "hour", "15 hrs"],
  [15.5, "hour", "15.5 hrs"],
  [16.0, "hour", "16 hrs"],
  [16.5, "hour", "16.5 hrs"],
  [17.0, "hour", "17 hrs"],
  [17.5, "hour", "17.5 hrs"],
  [18.0, "hour", "18 hrs"],
  [18.5, "hour", "18.5 hrs"],
  [19.0, "hour", "19 hrs"],
  [19.5, "hour", "19.5 hrs"],
  [20.0, "hour", "20 hrs"],
  [20.5, "hour", "20.5 hrs"],
  [21.0, "hour", "21 hrs"],
  [21.5, "hour", "21.5 hrs"],
  [22.0, "hour", "22 hrs"],
  [22.5, "hour", "22.5 hrs"],
  [23.0, "hour", "23 hrs"],
  [23.5, "hour", "23.5 hrs"],
]

export default {
  components: {
  },
  props: {
    event: null,
    event_key: null,
  },
  computed: {
    time_choices_start () {
      return times
    },
    time_choices_end () {
      return durations.map(
          (duration) => {
            return [ this.start_datetime.clone().add(duration[0], duration[1]), duration[2] ]
          }
      ).map(
          ( [m, duration] ) => {
            let [end_date, end_time] = m.format("YYYY-MM-DD HH:mm").split(" ")
            return {
              "end_date": end_date,
              "end_time": end_time,
              "end_desc": (
                  end_time
                  + (end_date > this.event.start_date
                      ? " D+" + moment(end_date).diff(moment(this.event.start_date), "day")
                      : "")
                  + " (" + duration + ")"
              )
            }
          }
      )
    },
    start_datetime () {
      return moment(this.event.start_date + (this.event.all_day ? "" : " " + this.event.start_time))
    },
    end_datetime () {
      return moment(this.event.end_date + (this.event.all_day ? "" : " " + this.event.end_time))
    },
    combobox_end_time: {
      set (newVal) {
        console.log("combobox setter", newVal)
        Vue.set(this.event, "end_time", newVal.end_time)
        Vue.set(this.event, "end_date", newVal.end_date)
      },
      get () {
        return { "end_time": this.event.end_time, "end_date": this.event.end_date, "end_desc": "" }
      },
    },
  },
  watch: {
    event_key: function(newVal, oldVal) {
      // We just need to trim the seconds off the times we get from the new event.
      if (newVal == oldVal) {
        return
      }
      // console.log("event_key changed")
      if (this.event.start_time) {
        Vue.set(this.event, "start_time", this.event.start_time.substring(0, 5))
      }
      if (this.event.end_time) {
        Vue.set(this.event, "end_time", this.event.end_time.substring(0, 5))
      }
      this.should_watch_start_datetime = false
    },
    start_datetime (newVal, oldVal) {
      if (!this.should_watch_start_datetime) {
        // If we hit this point, it's because the value of start_datetime changed due to a change of the
        // event key itself. In this case we have nothing to do except set the should_watch_start_datetime
        // back to true.
        this.should_watch_start_datetime = true
        return
      }
      if (newVal.isSame(oldVal)) {
        return
      }
      console.log("event start changed")
      let diff = newVal.diff(oldVal)
      let shifted_end_datetime = this.end_datetime.clone().add(diff)
      Vue.set(this.event, "end_date", shifted_end_datetime.format("YYYY-MM-DD"))
      Vue.set(this.event, "end_time", shifted_end_datetime.format("H:mm"))
    },
  },
  created() {
    console.log("in created, event is ", this.event)
    if (this.event.start_time) {
      console.log(this.event.start_time)
      Vue.set(this.event, "start_time", this.event.start_time.substring(0, 5))
    }
    if (this.event.end_time) {
      Vue.set(this.event, "end_time", this.event.end_time.substring(0, 5))
      Vue.set(this, "combobox_end_time",
          { "end_time": this.event.end_time, "end_date": this.event.end_date, "end_desc": "" }
      )
    }
  },
  data: function () {
    return {
      repeat: "Does not repeat",
      repeat_choices: [ "Does not repeat", "Daily", "Weekly", "Custom..." ],
      should_watch_start_datetime: true,  // true most of the time except when a change-event is triggered
                                          // by a change of ``event.key``
    };
  },
};
</script>
