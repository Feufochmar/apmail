const {Actor} = require('./actor.js')
const {KnownActors} = require('./known-actors.js')

// ASObject class: represent of Object of the ActivityStream spec
const ASObject = function(raw_object) {
  this.raw = raw_object
  this.id = raw_object.id
  this.type = raw_object.type
  this.published = raw_object.published ? new Date(raw_object.published) : undefined
  this.title = raw_object.title ? raw_object.title : ''
  this.summary = raw_object.summary ? raw_object.summary : ''
  this.content = raw_object.content ? raw_object.content : ''
  // actor, to, cc are filled in loadActors
  this.actor = new Actor()
  this.to = []
  this.cc = []
}
// Fetch function
// Callback takes 3 parameters: load_ok, fetched_object, failure_message
ASObject.fetch = function(url, token, callback) {
  if (typeof url === 'object') {
    // No need to fetch: already an object
    const obj = new ASObject(url)
    obj.load(token, function(load_ok, failure_message) {
      if (load_ok) {
        callback(true, obj, undefined)
      } else {
        callback(false, undefined, failure_message)
      }
    })
  } else {
    // Use ActivityPub protocol to get the object
    // The id is the link to the object on the server
    const request = new XMLHttpRequest()
    request.onreadystatechange = function() {
      if (request.readyState == 4 && request.status == 200) {
        const answer = JSON.parse(request.responseText)
        if (answer) {
          const obj = new ASObject(answer)
          obj.load(token, function(load_ok, failure_message) {
            if (load_ok) {
              callback(true, obj, undefined)
            } else {
              callback(false, undefined, 'Unable to retrieve actors of objects.')
              console.log(answer)
            }
          })
        } else {
          callback(false, undefined, 'Unable to retrieve object.')
          console.log(answer)
        }
      } else if (request.readyState == 4) {
        callback(false, undefined, 'Error during retrieval of object.')
      }
    }
    request.open('GET', url, true)
    if (token) {
      request.setRequestHeader('Authorization', 'Bearer ' + token)
    }
    request.setRequestHeader('Content-Type', 'application/activity+json')
    request.setRequestHeader('Accept', 'application/activity+json')
    request.send()
  }
}

ASObject.prototype = {
  // Load the actors present in the actor, to and cc fields
  loadActors: function(token, callback) {
    // Load the author
    // Try: actor, then attributedTo
    var profile = this.raw.actor
    if (!profile) {
      profile = this.raw.attributedTo
    }
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
  // Load everything
  load: function(token, callback) {
    this.loadActors(token, callback)
  }
}

// Exported structures
exports.ASObject = ASObject
