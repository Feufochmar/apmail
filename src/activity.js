const {Actor} = require('./actor.js')
const {KnownActors} = require('./known-actors.js')
const {ASObject} = require('./activity-object.js')

// Activity class
const Activity = function(raw_activity) {
  this.raw = raw_activity
  this.id = raw_activity.id
  this.type = raw_activity.type
  this.published = raw_activity.published ? new Date(raw_activity.published) : undefined
  // filled in loadObject
  this.object = undefined
  // actor, to, cc are filled in loadActors
  this.actor = new Actor()
  this.to = []
  this.cc = []
}
Activity.prototype = {
  // Load the actors present in the actor, to and cc fields
  loadActors: function(token, callback) {
    // Load the actor
    const profile = this.raw.actor
    KnownActors.retrieve(
      profile,
      token,
      function(load_ok, actor, failure_message) {
        if (load_ok) {
          this.actor = actor
        }
        // Load the actors in the "to" array, skip to "cc" if there is no "to", and stop is there is no "cc" either
        if (this.raw.to && Array.isArray(this.raw.to)) {
          this.loadToActors(this.raw.to.values(), token, callback)
        } else if (this.raw.to && typeof this.raw.to === 'string') {
          // Only one element in the array
          this.loadToActors([this.raw.to].values(), token, callback)
        } else if (this.raw.cc && Array.isArray(this.raw.cc)) {
          this.loadCcActors(this.raw.cc.values(), token, callback)
        } else if (this.raw.cc && typeof this.raw.cc === 'string') {
          // Only one element in the array
          this.loadToActors([this.raw.cc].values(), token, callback)
        } else {
          callback(true, undefined)
        }
      }.bind(this))
  },
  // Load the "To" array
  loadToActors: function(iter, token, callback) {
    const next = iter.next()
    if (next.done) {
      // Finished: load the "cc" array (if possible)
      if (this.raw.cc && Array.isArray(this.raw.cc)) {
        this.loadCcActors(this.raw.cc.values(), token, callback)
      } else if (this.raw.cc && typeof this.raw.cc === 'string') {
        // Only one element in the array
        this.loadToActors([this.raw.cc].values(), token, callback)
      } else {
        callback(true, undefined)
      }
    } else {
      const profile = next.value
      KnownActors.retrieve(
        profile,
        token,
        function(load_ok, actor, failure_message) {
          if (load_ok) {
            this.to.push(actor)
          } else {
            // Collection ?
          }
          this.loadToActors(iter, token, callback)
        }.bind(this))
    }
  },
  // Load the "Cc" array
  loadCcActors: function(iter, token, callback) {
    const next = iter.next()
    if (next.done) {
      callback(true, undefined)
    } else {
      const profile = next.value
      KnownActors.retrieve(
        profile,
        token,
        function(load_ok, actor, failure_message) {
          if (load_ok) {
            this.cc.push(actor)
          } else {
            // Collection ?
          }
          this.loadCcActors(iter, token, callback)
        }.bind(this))
    }
  },
  // Load the object
  loadObject: function(token, callback) {
    // Fetch the object if there is one
    if (this.raw.object) {
      ASObject.fetch(this.raw.object, token, function(load_ok, activity_object, failure_message) {
        if (load_ok) {
          this.object = activity_object
        }
        callback(load_ok, failure_message)
      }.bind(this))
    }
  },
  // Load everything
  load: function(token, callback) {
    this.loadActors(token, function(load_ok, failure_message) {
      if (load_ok) {
        this.loadObject(token, callback)
      } else {
        callback(false, failure_message)
      }
    }.bind(this))
  }
}

// Exported structures
exports.Activity = Activity
