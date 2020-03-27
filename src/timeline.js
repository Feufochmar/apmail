const {Activity} = require('./activity.js')

// Timeline class
// Represent a collection of activities
var Timeline = function() {}
Timeline.prototype = {
  load: function(url, token, callback) {
    var request = new XMLHttpRequest()
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
          this.parseActivities(answer.first.orderedItems, callback)
        } else if (answer.type === 'OrderedCollectionPage') {
          this.activities = []
          this.prev = answer.prev
          this.next = answer.next
          this.parseActivities(answer.orderedItems, callback)
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
  parseActivities: function(raw_activities, callback) {
    // Get the next activity
    var raw_act = raw_activities.shift()
    if (raw_act) {
      var act = new Activity(raw_act)
      act.loadActors(
        function(load_ok, failure_message) {
          if (load_ok) {
            this.activities.push(act)
          }
          this.parseActivities(raw_activities, callback)
        }.bind(this))
    } else {
      callback(true, undefined)
    }
  }
}

// Exported structures
exports.Timeline = Timeline
