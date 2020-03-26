const {Actor} = require('./actor.js')

// A cache for actors, to avoid loading same actors several times when loading timelines
var KnownActors = {
  // Cache of real actors
  actors: {},
  // Cache of followers' collection of actors, as they can be recipients of messages
  followers: {},
  // Methods
  get: function(profile) {
    var act = KnownActors.actors[profile]
    if (!act) {
      act = KnownActors.followers[profile]
    }
    return act
  },
  set: function(profile, actor) {
    KnownActors.actors[profile] = actor
    // Make a false actor for followers
    if (actor.urls.followers) {
      var followers = new Actor()
      followers.valid = true
      followers.name = 'followers:' + actor.name
      followers.server = actor.server
      followers.info.display_name = "Followers of " + actor.displayName()
      followers.urls.profile = actor.urls.followers
      KnownActors.followers[actor.urls.followers] = followers;
    }
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
