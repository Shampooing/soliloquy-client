<template>
  <v-container class="fill-height" fluid>
    <v-row class="fill-height" no-gutters>
      <v-col>
        <v-sheet height="64">
          <v-toolbar flat>
            <v-btn
                    outlined
                    small
                    text
                    class="mr-4"
                    color="grey darken-2"
                    @click="setToday"
            >
              Today
            </v-btn>
            <v-btn
                    text
                    icon
                    small
                    color="grey darken-2"
                    @click="prev"
            >
              <v-icon small>
                mdi-chevron-left
              </v-icon>
            </v-btn>
            <v-btn
                    text
                    icon
                    small
                    color="grey darken-2"
                    @click="next"

            >
              <v-icon small>
                mdi-chevron-right
              </v-icon>
            </v-btn>
            <v-toolbar-title v-if="$refs.calendar" class="mx-4">
              <v-menu offset-y>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn text small color="grey darken-2" v-on="on">
                    {{ $refs.calendar.title }}
                    <v-icon small class="ml-2">
                      mdi-pencil
                    </v-icon>
                  </v-btn>
                </template>
                <v-date-picker v-model="focus">
                </v-date-picker>
              </v-menu>
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn-toggle v-model="calendar_type" mandatory>
              <v-btn @click="calendar_type = 'day'" value="day" small>
                Day
              </v-btn>
              <v-btn @click="calendar_type = '4day'" value="4day" small>
                4 Day
              </v-btn>
              <v-btn @click="calendar_type = 'week'" value="week" small>
                Week
              </v-btn>
              <v-btn @click="calendar_type = 'month'" value="month" small>
                Month
              </v-btn>
            </v-btn-toggle>
          </v-toolbar>
        </v-sheet>
        <v-dialog
                v-model="show_edit_dialog"
                max-width="1000"
                open-delay="200"
                overlay-opacity="0.1"
                transition="fade-transition"
                @keydown.esc="show_edit_dialog = false"
        >
          <v-sheet class="pa-2">
            <generic-entry-editor
                    :entry_index="edited_event_key"
                    @entry-save="show_edit_dialog = false"
                    @entry-delete-event="show_edit_dialog = false"
            >
            </generic-entry-editor>
          </v-sheet>
        </v-dialog>
        <v-sheet height="93vh">
          <v-calendar
                  ref="calendar"
                  :type="calendar_type"
                  color="primary"
                  event-start="start_datetime"
                  event-end="end_datetime"
                  event-name="name"
                  :event-color="getEventColor"
                  event-overlap-mode="column"
                  v-model="focus"
                  :events="events"
                  @click:date="viewDay"
                  @click:more="viewDay"
                  :weekdays="weekdays"
                  @mousedown:event="mousedown_event"
                  @mousedown:time="mousedown_time"
                  @mousedown:day="mousedown_day"
                  @mousemove:time="mousemove"
                  @mousemove:day="mousemove"
                  @mouseup:time="mouseup_time"
                  @mouseup:day="mouseup_day"
          >
            <!--                              @click:event="on_edit_event"-->
            <!--                  @click:time="create_event"-->
            <!--                  @mousedown:event="start_drag_event"-->
            <!--                  @mouseup:time="finish_drag"-->

            <template #day-body="{ date, week }">
              <div
                      :class="{ currentday: isToday(date), first: isToday(date) }"
                      :style="{ top: nowY }"
              ></div>
            </template>
          </v-calendar>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
  import {mapState} from "vuex";
  import {getEntryId} from "../util";
  import GenericEntryEditor from "../components/GenericEntryEditor";
  import moment from "moment"

  import Vue from "vue"

  let default_event_length = 30;  // in minutes - TODO move to some constants.js file
  let calendar_grid_size = 15;

  function time_to_grid({ time, grid_size = calendar_grid_size, round_up = true}) {
    // align a given time "HH:MM" to a grid of grid_size-minute intervals. (grid_size should be a divisor of 60)
    let [hour, minute] = time.split(":")
    let grid_minute = grid_size * (round_up ? Math.ceil : Math.floor)(minute / grid_size)
    return (grid_minute == 60) ? ((parseInt(hour) + 1) + ":00") : (hour + ":" + ((grid_minute < 10) ? "0" : "") + grid_minute)
  }

  export default {
    name: "Calendar",
    components: { GenericEntryEditor },
    computed: {
      ...mapState(["entries", "clients", "this_client"]),
      events: function () {
        let stored_events = Object.values(this.$store.state.entries).filter(
                (e) => e.resourcetype == "Event" && e.active
        ).map(
                (e) => {
                  e.start_datetime = e.start_date + ((e.all_day) ? "" : (" " + e.start_time))
                  e.end_datetime = e.end_date + ((e.all_day) ? "" : (" " + e.end_time))
                  e.is_placeholder = false
                  return e
                }
        )
        if (this.placeholder_event) {
          stored_events.push({ ...this.placeholder_event, is_placeholder: true })
        }
        return stored_events
      },
      cal () {
        return this.ready ? this.$refs.calendar : null
      },
      nowY () {
        return this.cal ? this.cal.timeToY(this.cal.times.now) + 'px' : '-10px'
      },
    },
    methods: {
      prev () {
        this.$refs.calendar.prev()
      },
      next () {
        this.$refs.calendar.next()
      },
      viewDay({ date }) {
        this.calendar_type = 'day'
        this.focus = date
      },
      setToday() {
        this.focus = ''
      },
      getCurrentTime () {
        return this.cal ? this.cal.times.now.hour * 60 + this.cal.times.now.minute : 0
      },
      scrollToTime () {
        const time = this.getCurrentTime()
        const first = Math.max(0, time - (time % 30) - 30)
        this.cal.scrollToTime(first)
      },
      updateTime () {
        setInterval(() => this.cal.updateTimes(), 60 * 1000)
      },
      getEventColor (event) {
        // events are shown using primary color unless they are being dragged (moved/resized)
        return (this.dragged_event_key && event.key == this.dragged_event_key && !event.is_placeholder) ? "blue lighten-3" : "blue"
      },
      new_event({ start_date, start_time, all_day, duration, end_date, end_time }) {
        let time_info = {
          start_date,
          all_day,
        }
        if (!all_day) {
          time_info["start_time"] = start_time
          time_info["start_datetime"] = start_date + " " + start_time
          if (duration) {
            let end_datetime = new moment(start_date + " " + start_time).add(duration, "minute")
            time_info["end_date"] = end_datetime.format("YYYY-MM-DD")
            time_info["end_time"] = end_datetime.format("H:mm")
          }
          else {
            time_info["end_date"] = end_date
            time_info["end_time"] = end_time
          }
          time_info["end_datetime"] = time_info["end_date"] + " " + time_info["end_time"]
        }
        else {
          time_info["start_datetime"] = start_date
          time_info["end_date"] = end_date
          time_info["end_datetime"] = end_date
        }
        // TODO fix some duplication with Browse component (see create_entry)
        let event = {
          ...time_info,
          client: this.this_client["id"],
          creation_date: new Date().toISOString(),
          id: 1, // TODO use a proper counter here
          name: "Untitled Event",
          content: "",
          resourcetype: "Event",
          references: [],
          referenced_by: [],
          active: true,
        };
        event["key"] = getEntryId(event);
        return event
      },
      edit_event: function(event_key) {
        console.log("editing event with key:", event_key)
        Vue.set(this, "edited_event_key", event_key);
        this.show_edit_dialog = true;
      },
      isToday: function (date) {
        return moment().format("YYYY-MM-DD") == date
      },
      mousedown_event (mouseevent) {
        console.log("mousedown_event", mouseevent)
        let shift_or_resize = "shift"  // TODO capture click position on event to determine if we're shifting or resizing
        this.mousedown = { "on": "event", "data": mouseevent, "move": (shift_or_resize == "shift") ? "start-end" : "end" }
        this.dragged_event_key = mouseevent.event.key
        mouseevent.nativeEvent.stopPropagation()  // we don't want to trigger a mousedown:time event
        mouseevent.nativeEvent.preventDefault()  // this prevents the event text getting selected somehow AND allows us to move the event to a different day <-- TODO figure this out
      },
      mousedown_time (mouseevent) {
        console.log("mousedown_time", mouseevent)
        this.mousedown = { "on": "time", "data": mouseevent, "move": "end" }
        this.placeholder_event = this.new_event({
          all_day: false,
          start_date: mouseevent.date,
          start_time: time_to_grid({ time: mouseevent.time, round_up: false }),
          duration: default_event_length,
        })
        console.log("placeholder event:", this.placeholder_event)
      },
      mousedown_day (mouseevent) {
        console.log("mousedown_day", mouseevent)
        this.mousedown = { "on": "day", "data": mouseevent, "move": "end" }
        this.placeholder_event = this.new_event({
          all_day: true,
          start_date: mouseevent.date,
          end_date: mouseevent.date
        })
        console.log("placeholder event:", this.placeholder_event)
      },
      mousemove (mouseevent) {
        if (!this.mousedown) {
          return
        }
        this.mousehasmoved = true
        console.log("mousemove", mouseevent)
        if (this.mousedown["on"] == "event" && this.mousedown["move"] == "start-end") {
          if (!this.placeholder_event) {
            this.placeholder_event = { ...this.mousedown.data.event  }
          }
          // move the placeholder event
          this.move_placeholder_event({
            start_datetime: mouseevent.date + (
                    mouseevent.hasTime ? (" " + time_to_grid({ time: mouseevent.time, round_up: false })) : ""
            )
          })
          return
        }
        // resize the placeholder event
        let event_boundary
        let old_start_datetime = (this.placeholder_event.start_date + (this.placeholder_event.all_day ? "" : (" " + this.placeholder_event.start_time)))
        let old_end_datetime = (this.placeholder_event.end_date + (this.placeholder_event.all_day ? "" : (" " + this.placeholder_event.end_time)))
        let mouse_datetime_on_grid = mouseevent.date + (this.placeholder_event.all_day ? "" : (" " + time_to_grid({ time: mouseevent.time, round_up: this.mousedown.move == "end" })))
        if (this.mousedown.move == "start") {
          if (mouse_datetime_on_grid > old_end_datetime) {
            this.mousedown.move = "end"
          }
          event_boundary = [mouse_datetime_on_grid, old_end_datetime]
        }
        else if (this.mousedown.move == "end") {
          if (mouse_datetime_on_grid < old_start_datetime) {
            this.mousedown.move = "start"
          }
          event_boundary = [old_start_datetime, mouse_datetime_on_grid]
        }
        let [start_datetime, end_datetime] = event_boundary.sort()
        this.resize_placeholder_event({ start_datetime, end_datetime })
      },
      keyDownHandler (keydownevent) {
        console.log(keydownevent)
        if (keydownevent.code == "Escape") {
          if (this.mousedown) {
            this.cancel_drag()
          }
          this.placeholder_event = null
          this.dragged_event_key = null
        }
      },
      cancel_drag () {
        console.log("cancelling potential drag")
        this.mousedown = null
        this.mousehasmoved = false
      },
      mouseup_time (mouseevent) {
        console.log("mouseup_time", mouseevent)
        if (!this.mousedown) {
          // nothing to do if the drag was cancelled
          return
        }
        if (this.mousedown["on"] == "event") {
          if (this.mousehasmoved) {
            this.$store.dispatch("update_entry", { entry: this.placeholder_event })
          }
          else {
            this.edit_event( this.mousedown["data"].event.key )
          }
        }
        else {
          // we created a new event
          let new_event_key = getEntryId(this.placeholder_event)
          console.log(new_event_key)
          this.$store.dispatch("update_entry", { entry: this.placeholder_event })
          this.edit_event(new_event_key)
        }
        // clear temporary objects
        this.mousedown = null
        this.mousehasmoved = false
        this.placeholder_event = null
        this.dragged_event_key = null
      },
      mouseup_day (mouseevent) {
        console.log("mouseup_day", mouseevent)
        if (!this.mousedown) {
          // nothing to do if the drag was cancelled
          return
        }
        if (this.mousedown["on"] == "event") {
          if (this.mousehasmoved) {
            this.$store.dispatch("update_entry", { entry: this.placeholder_event })
          }
          else {
            this.edit_event( this.mousedown["data"].event.key )
          }
        }
        else if (this.mousedown["on"] == "day") {
          // we created a new event
          let new_event_key = getEntryId(this.placeholder_event)
          console.log(new_event_key)
          this.$store.dispatch("update_entry", { entry: this.placeholder_event })
          this.edit_event(new_event_key)
        }
        // finalize event creation / modification
        this.mousedown = null
        this.mousehasmoved = false
        this.placeholder_event = null
        this.dragged_event_key = null
      },
      move_placeholder_event({ start_datetime }) {
        // move placeholder event to given start while preserving its duration (if placeholder is not timed then the time part of the
        // provided datetime is ignored)
        let duration = new moment(this.placeholder_event.end_datetime).diff(this.placeholder_event.start_datetime)
        let start_moment = new moment(start_datetime)
        let end_moment = start_moment.add(duration)
        let end_datetime = end_moment.format("YYYY-MM-DD H:mm")
        let [start_date, start_time] = start_datetime.split(" ")
        let [end_date, end_time] = end_datetime.split(" ")
        let new_event = {
          ...this.placeholder_event,
          start_date, start_datetime,
          end_date, end_datetime
        }
        if (!this.placeholder_event.all_day) {
          new_event = {
            ...new_event,
            start_time,
            end_time,
          }
        }
        this.placeholder_event = new_event
      },
      resize_placeholder_event({ start_datetime, end_datetime }) {
        // resize placeholder event to given start/end (if placeholder is not timed then the time parts of the
        // provided datetimes are ignored)
        if (start_datetime == end_datetime) {
          return
        }
        let [start_date, start_time] = start_datetime.split(" ")
        let [end_date, end_time] = end_datetime.split(" ")
        let new_event = {
          ...this.placeholder_event,
          start_date, start_datetime,
          end_date, end_datetime
        }
        if (!this.placeholder_event.all_day) {
          new_event = {
            ...new_event,
            start_time,
            end_time,
          }
        }
        this.placeholder_event = new_event
      },
    },
    mounted () {
      this.$refs.calendar.checkChange()
      this.ready = true
      this.scrollToTime()
      this.updateTime()
      window.addEventListener('keydown', this.keyDownHandler)
    },
    destroyed() {
      window.removeEventListener('keydown', this.keyDownHandler)
    },
    data: function () {
      return {
        ready: false,
        focus: '',
        calendar_type: 'week',
        weekdays: [1, 2, 3, 4, 5, 6, 0],  // weeks start on Monday
        show_edit_dialog: false,
        edited_event_key: null,
        mousedown: null,
        dragged_event_key: null,
        mousehasmoved: false,
        placeholder_event: null,
      }
    },
  };
</script>

<style lang="scss">

  .currentday {
    height: 1.5px;
    background-color: #ea4335;
    position: absolute;
    left: -1px;
    right: 0;
    pointer-events: none;

    &.first::before {
      content: '';
      position: absolute;
      background-color: #ea4335;
      width: 12px;
      height: 12px;
      border-radius: 100%;
      margin-top: -5.25px;
      margin-left: -6px;
    }
  }

</style>