const {Actor} = require('./actor.js')

// A cache for actors, to avoid loading same actors several times when loading timelines
var KnownActors = {
  actors: {},
  get: function(profile) {
    return KnownActors.actors[profile]
  },
  set: function(profile, actor) {
    KnownActors.actors[profile] = actor
  },
  // Retrieve an actor
  retrieve: function(profile, callback) {
    if (KnownActors.get(profile)) {
      callback(true, 'ok')
    } else {
      var actor = new Actor()
      actor.loadFromProfileUrl(
        profile,
        function(load_ok, failure_message) {
          KnownActors.set(profile, actor) // in case of failure, actor is not valid
          callback(load_ok, failure_message)
        })
    }
  }
}

// Exported structures
exports.KnownActors = KnownActors
