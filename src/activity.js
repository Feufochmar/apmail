const {Actor} = require('./actor.js')
const {KnownActors} = require('./known-actors.js')

// Activity class
var Activity = function(raw_activity) {
  this.raw = raw_activity
  this.type = raw_activity.type
  this.published = raw_activity.published ? new Date(raw_activity.published) : undefined
  this.object = raw_activity.object
  this.public_visibility = 'non'
  // actor, to, cc are filled in loadActors
  this.actor = undefined
  this.to = []
  this.cc = []
}
Activity.prototype = {
  // Load the actors present in the actor, to and cc fields
  loadActors: function(callback) {
    // Load the actor
    var profile = this.raw.actor
    KnownActors.retrieve(
      profile,
      function(load_ok, failure_message) {
        if (load_ok) {
          this.actor = KnownActors.get(profile)
        }
        // Load the actors in the "to" array, skip to "cc" if there is no "to", and stop is there is no "cc" either
        if (this.raw.to) {
          this.loadToActors(this.raw.to.values(), callback)
        } else if (this.raw.cc) {
          this.loadCcActors(this.raw.cc.values(), callback)
        } else {
          callback(true, 'ok')
        }
      }.bind(this))
  },
  // Load the "To" array
  loadToActors: function(iter, callback) {
    var next = iter.next()
    if (next.done) {
      // Finished: load the "cc" array (if possible)
      if (this.raw.cc) {
        this.loadCcActors(this.raw.cc.values(), callback)
      } else {
        callback(true, 'ok')
      }
    } else {
      var profile = next.value
      if (profile === 'https://www.w3.org/ns/activitystreams#Public') {
        this.public_visibility = 'to'
        this.loadToActors(iter, callback)
      } else {
        KnownActors.retrieve(
          profile,
          function(load_ok, failure_message) {
            if (load_ok) {
              this.to.push(KnownActors.get(profile))
            } else {
              // Collection ?
            }
            this.loadToActors(iter, callback)
          }.bind(this))
      }
    }
  },
  // Load the "Cc" array
  loadCcActors: function(iter, callback) {
    var next = iter.next()
    if (next.done) {
      callback(true, 'ok')
    } else {
      var profile = next.value
      if (profile === 'https://www.w3.org/ns/activitystreams#Public') {
        this.public_visibility = 'cc'
        this.loadCcActors(iter, callback)
      } else {
        KnownActors.retrieve(
          profile,
          function(load_ok, failure_message) {
            if (load_ok) {
              this.cc.push(KnownActors.get(profile))
            } else {
              // Collection ?
            }
            this.loadCcActors(iter, callback)
          }.bind(this))
      }
    }
  }
}

// Exported structures
exports.Activity = Activity
