import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { router } from './router';
import { loadIcons } from './icon'
//import { useMouse } from './mouse';
import App from './App.vue';

//useMouse();
await loadIcons();

createApp(App)
  .use(createPinia())
  .use(router)
  .mount('body');
