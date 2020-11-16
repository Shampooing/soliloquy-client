import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";

// import drag from "v-drag"

import VuetifyMask from "vuetify-mask";

Vue.config.productionTip = false;

// Vue.use(drag);
Vue.use(VuetifyMask);

new Vue({
    router,
    store,
    vuetify,
    render: h => h(App)
}).$mount("#app");
