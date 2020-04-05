const {Actor} = require('./actor.js')
const {KnownActors} = require('./known-actors.js')
const {ActivityObject} = require('./activity-object.js')

// Activity class
const Activity = function (as_activity) {
  this.data = as_activity
  // Those should be available
  this.id = this.data.id
  this.type = this.data.type
  this.published = this.data.published ? new Date(this.data.published) : undefined
  // Actor
  this.actor = new Actor()
  this.object = undefined
  // Filled later, when displaying details with loadAll
  this.to = []
  this.cc = []
  //
  this.loaded = false
}
Activity.prototype = {
  // Load needed attributes
  loadNeeded: function (callback) {
    // Load the needed properties for limited display
    // actor, object
    this.data.fetchAttributeList(
      ['actor', 'object'],
      function (load_ok, failure_message) {
        if (load_ok) {
          // Object
          if (this.data.object) {
            this.object = new ActivityObject(this.data.object)
          } else {
            this.object = undefined
          }
          // Actor
          this.actor.loadFromASActor(this.data.actor, function (ok, error) {
            if (ok) {
              // Store actors in KnownActors
              KnownActors.set(this.actor.data.id, this.actor)
            }
            callback(ok, error)
          }.bind(this))
        } else {
          console.log(failure_message)
          callback(false, failure_message)
        }
      }.bind(this))
  },
  // Load for full display
  loadAll: function(callback) {
    // Do not load if already loaded
    if (this.loaded) {
      callback(true, undefined)
      return
    }
    this.loaded = true
    //
    var error_msg = ''
    // to
    this.loadAudience(this.data.to, this.to, function (load_ok, failure_message) {
      if (!load_ok) {
        error_msg = error_msg + failure_message + '<br/>'
      }
      // cc
      this.loadAudience(this.data.cc, this.cc, function (load_ok, failure_message) {
        if (!load_ok) {
          error_msg = error_msg + failure_message + '<br/>'
        }
        // object
        if (this.object) {
          this.object.loadAll(function (load_ok, failure_message) {
            if (!load_ok) {
              error_msg = error_msg + failure_message + '<br/>'
            }
            callback(true, error_msg === '' ? undefined : error_msg)
          }.bind(this))
        } else {
          callback(true, error_msg === '' ? undefined : error_msg)
        }
      }.bind(this))
    }.bind(this))
  },
  // Load an audience array
  loadAudience: function (from, to, callback) {
    if (from && Array.isArray(from)) {
      this.loadAudienceIter(from.values(), to, callback, '')
    } else if (from && typeof from === 'string') {
      // Only one element in array
      this.loadAudienceIter([from].values(), to, callback, '')
    } else {
      callback(true, undefined)
    }
  },
  loadAudienceIter: function (iter, to, callback, error_msg) {
    const next = iter.next()
    if (next.done) {
      callback(true, error_msg)
    } else {
      const act = next.value
      var err = error_msg
      if (typeof act === 'string') {
        // string => id of actor
        KnownActors.retrieve(act, function (load_ok, actor, failure_message) {
          if (load_ok) {
            to.push(actor)
          } else {
            err = err + failure_message + '<br/>'
          }
        })
      } else if (typeof act === 'object') {
        // Actor is present as object
        const actor = new Actor()
        actor.loadFromASActor(this.data.actor, function (load_ok, failure_message) {
          if (load_ok) {
            // Store actors in KnownActors
            KnownActors.set(this.actor.data.id, this.actor)
            to.push(actor)
          } else {
            err = err + failure_message + '<br/>'
          }
        }.bind(this))
      }
      this.loadAudienceIter(iter, to, callback, err)
    }
  }
}

// Exported structures
exports.Activity = Activity
