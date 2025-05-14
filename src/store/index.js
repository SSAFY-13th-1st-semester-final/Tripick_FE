import { createStore } from 'vuex';
import auth from '@/store/modules/auth';
import places from '@/store/modules/places';
import notification from '@/store/modules/notification';

export default createStore({
  modules: {
    auth,
    notification,
    places,
  },
});
