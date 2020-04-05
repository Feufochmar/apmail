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
    if (actor && actor.data && actor.data.followers) {
      const followers = new Actor()
      followers.fromDummyData(actor.address(), 'followers', 'Followers of ' + actor.displayName(), actor.data.followers)
      KnownActors.actors[actor.data.followers] = followers;
    }
  },
  // Retrieve an actor
  // Callback takes three arguments: load_ok, retrieved_actor, failure_message
  retrieve: function(profile, token, callback) {
    if (KnownActors.get(profile)) {
      callback(true, KnownActors.get(profile), undefined)
    } else {
      const actor = new Actor()
      actor.loadFromProfileUrl(
        profile,
        function(load_ok, failure_message) {
          KnownActors.set(profile, actor) // in case of failure, actor is not valid
          callback(load_ok, actor, failure_message)
        })
    }
  }
}

// A representation of "everyone" in Actor class
const publicActor = new Actor()
publicActor.fromDummyData('', 'public', 'Anyone', 'https://www.w3.org/ns/activitystreams#Public')
KnownActors.set(publicActor.data.id, publicActor)

// Exported structures
exports.KnownActors = KnownActors
