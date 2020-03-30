const {Activity} = require('./activity.js')
const {KnownActivities} = require('./known-activities.js')

// Timeline class
// Represent a collection of activities
var Timeline = function() {}
Timeline.prototype = {
  // attributes
  // List of activities
  activities: [],
  // Link to previous page
  prev: undefined,
  // Link to next page
  next: undefined,
  // Token used when loading -- for loading prev/next within the same context
  token: undefined,
  //
  load: function(url, token, callback) {
    this.token = token
    const request = new XMLHttpRequest()
    request.onreadystatechange = function() {
      if (request.readyState == 4 && request.status == 200) {
        var answer = JSON.parse(request.responseText)
        if (answer.type === 'OrderedCollection' && answer.first && typeof answer.first === 'string') {
          // First is a link => load again with the first
          this.load(answer.first, token, callback)
        } else if (answer.type === 'OrderedCollection' && answer.first && answer.first.type === 'OrderedCollectionPage') {
          this.activities = []
          this.prev = answer.first.prev
          this.next = answer.first.next
          this.parseActivities(answer.first.orderedItems, token, callback)
        } else if (answer.type === 'OrderedCollectionPage') {
          this.activities = []
          this.prev = answer.prev
          this.next = answer.next
          this.parseActivities(answer.orderedItems, token, callback)
        } else {
          callback(false, 'Timeline: unexpected answer from server')
          console.log(answer)
        }
      } else if (request.readyState == 4) {
        callback(false, 'Timeline: server error')
      }
    }.bind(this)
    request.open('GET', url, true)
    if (token) {
      request.setRequestHeader('Authorization', 'Bearer ' + token)
    }
    request.setRequestHeader('Content-Type', 'application/activity+json')
    request.setRequestHeader('Accept', 'application/activity+json')
    request.send()
  },
  parseActivities: function(raw_activities, token, callback) {
    // Get the next activity
    const raw_act = raw_activities.shift()
    if (raw_act && typeof raw_act === 'string') {
      // link, and not the object itself => fetch the activity
      KnownActivities.retrieve(raw_act, token, function(load_ok, activity, failure_message) {
        if (load_ok) {
          // Push to the list of activities
          this.activities.push(activity)
        }
        this.parseActivities(raw_activities, token, callback)
      }.bind(this))
    } else if (raw_act) {
      const act = new Activity(raw_act)
      act.loadActors(
        function(load_ok, failure_message) {
          if (load_ok) {
            // Push to the list of activities
            this.activities.push(act)
            // Add the activity to the known activities
            KnownActivities.set(act.id, act)
          }
          this.parseActivities(raw_activities, token, callback)
        }.bind(this))
    } else {
      callback(true, undefined)
    }
  }
}

// Exported structures
exports.Timeline = Timeline
