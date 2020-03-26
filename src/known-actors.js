const {Actor} = require('./actor.js')

// A cache for actors, to avoid loading same actors several times when loading timelines
const KnownActors = {
  // Cache of actors
  actors: {},
  // Methods
  get: function(profile) {
    return KnownActors.actors[profile]
  },
  set: function(profile, actor) {
    KnownActors.actors[profile] = actor
    // Make a false actor for followers
    if (actor.urls.followers) {
      const followers = new Actor()
      followers.fromDummyData(actor.address(), 'followers', 'Followers of ' + actor.displayName(), actor.urls.followers)
      KnownActors.actors[actor.urls.followers] = followers;
    }
  },
  // Retrieve an actor
  retrieve: function(profile, callback) {
    if (KnownActors.get(profile)) {
      callback(true, 'ok')
    } else {
      const actor = new Actor()
      actor.loadFromProfileUrl(
        profile,
        function(load_ok, failure_message) {
          KnownActors.set(profile, actor) // in case of failure, actor is not valid
          callback(load_ok, failure_message)
        })
    }
  }
}

// A representation of "everyone" in Actor class
const publicActor = new Actor()
publicActor.fromDummyData('', 'public', 'Everyone', 'https://www.w3.org/ns/activitystreams#Public')
KnownActors.set(publicActor.urls.profile, publicActor)

// Exported structures
exports.KnownActors = KnownActors
