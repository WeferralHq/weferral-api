/**
 * Index file
 * This is the main file, where all starts.
 * It runs an http server with the configurations loaded in the env.yaml file
 * @module Index
 */

import { createServer } from './api/application'
import { logger } from './infra/logger'
import { env } from './infra/env'


let { EVENT, SET_OPTIONS,SET_EVENT_SAGAS, INIT_STORE, setOptions ,setEventSagas, initializeStore, triggerEvent}  =  require("./config/redux/actions");
const defaultAppState = {
    "eventReducer" : null,
    "eventSagas" : {},
    "options" : {}
};

function appReducer(state = defaultAppState , action) {
    //change the store state based on action.type
    switch(action.type) {
        case EVENT:
            return state;
        case INIT_STORE:
            return action.initialStore;
        case SET_OPTIONS :
            let options = Object.assign({}, state.options, action.options);
            return Object.assign({}, state, {
                "options" : options
            })
        default:
            return state;
    }
}

createServer().then(
  app =>
    app.listen(env.PORT, () => {
      const mode = env.NODE_ENV
      logger.debug(`Weferral server listening on ${env.PORT} in ${mode} mode`)
    }),
  err => {
    logger.error('Error while starting up server', err)
    process.exit(1)
  }
)
