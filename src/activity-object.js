const {Actor} = require('./actor.js')
const {KnownActors} = require('./known-actors.js')

// ActivityObject class: wrapper around an Object of the ActivityStream spec
const ActivityObject = function(as_object) {
  this.data = as_object
  // Those should be available
  this.id = this.data.id
  this.type = this.data.type
  this.published = this.data.published ? new Date(this.data.published) : undefined
  this.name = this.data.name ? this.data.name : ''
  this.summary = this.data.summary ? this.data.summary : ''
  this.content = this.data.content ? this.data.content : ''
  // Other things filled later in loadAll
  this.actor = new Actor()
  this.to = []
  this.cc = []
  //
  this.loaded = false
}

ActivityObject.prototype = {
  loadAll: function (callback) {
    // Do not load if already loaded
    if (this.loaded) {
      callback(true, undefined)
      return
    }
    this.loaded = true
    // Fetch attributes
    this.data.fetchAttributeList(
      ['attributedTo', 'attachment'],
      function (load_ok, failure_message) {
        if (load_ok) {
          // Actor
          this.actor.loadFromASActor(this.data.attributedTo, function (ok, error) {
            if (ok) {
              // Store actors in KnownActors
              KnownActors.set(this.actor.data.id, this.actor)
            } else {
              console.log(error)
            }
          }.bind(this))
          // attachment
          this.attachments = (this.data.attachment && Array.isArray(this.data.attachment)) ? this.data.attachment : []
          // Audience
          // to
          this.loadAudience(this.data.to, this.to, function (load_ok, failure_message) {
            if (!load_ok) {
              console.log(failure_message)
            }
          })
          // cc
          this.loadAudience(this.data.cc, this.cc, function (load_ok, failure_message) {
            if (!load_ok) {
              console.log(failure_message)
            }
          })
          // OK
          callback(true, undefined)
        } else {
          callback(false, failure_message)
        }
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
exports.ActivityObject = ActivityObject
