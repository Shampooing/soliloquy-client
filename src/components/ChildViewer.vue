<template>
  <v-container>
    <v-row>
      <v-col>
        <v-card>
          <v-card-title>
            {{ children_type }}s
          </v-card-title>
          <v-card-text v-if="children.length == 0">
            This {{ container_type.name }} doesn't hold any {{ children_type }}s at the moment.
          </v-card-text>
          <v-list dense max-height="400" class="overflow-y-auto">
            <v-list-item v-for="child in children" :key="child.url"
                         @click.stop="follow_link(child.key)">
              <v-list-item-content>
                {{ child.name }}
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import {mapGetters, mapState} from 'vuex';
import {ContainerEntries} from "@/enums";

export default {
  name: "ChildViewer",
  props: {
    container_key: String,
  },
  computed: {
    ...mapState([ "entries" ]),
    ...mapGetters([ "entry_key_from_specialized_url" ]),
    container () {
      return this.entries[ this.container_key ]
    },
    container_type () {
      console.log(this.container)
      return ContainerEntries.find( (x) => x.name == this.container.resourcetype )
    },
    children_type () {
      return this.container_type.children_type
    },
    children () {
      console.log(this.container)
      console.log("container type", this.container_type)
      let children_keys = (this.container[ this.container_type.child_attr ] || []).map((url) => this.entry_key_from_specialized_url(url))
      return Object.entries(this.entries).filter( (key_and_entry) => children_keys.includes(key_and_entry[0]) ).map( (key_and_entry) => key_and_entry[1] )
    },
  },
  methods: {
    follow_link: function (entry_key) {
      this.$emit("follow-link", entry_key)
    },
  },
}
</script>

<style scoped>

</style>