const {Activity} = require('./activity.js')

// A cache for activities, to be able to reference them by their id
const KnownActivities = {
  // Cache
  activities: {},
  // Methods
  get: function(id) {
    return KnownActivities.activities[id]
  },
  set: function(id, obj) {
    KnownActivities.activities[id] = obj
  },
  // Retrieve an object
  // The callback takes 3 arguments: load_ok, retrieved_activity, failure_message
  retrieve: function(id, token, callback) {
    if (KnownActivities.get(id)) {
      callback(true, KnownActivities.get(id), undefined)
    } else {
      // Use ActivityPub protocol to get the activity
      // The id is the link to the activity on the server
      const request = new XMLHttpRequest()
      request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
          const answer = JSON.parse(request.responseText)
          if (answer) {
            const activity = new Activity(answer)
            activity.loadActors(
              function(load_ok, failure_message) {
                if (load_ok) {
                  KnownActivities.set(id, activity)
                  callback(true, activity, undefined)
                } else {
                  callback(false, undefined, 'Unable to retrieve actors of activity.')
                  console.log(answer)
                }
              })
          } else {
            callback(false, undefined, 'Unable to retrieve activity.')
            console.log(answer)
          }
        } else if (request.readyState == 4) {
          callback(false, undefined, 'Error during retrieval of activity.')
        }
      }
      request.open('GET', id, true)
      if (token) {
        request.setRequestHeader('Authorization', 'Bearer ' + token)
      }
      request.setRequestHeader('Content-Type', 'application/activity+json')
      request.setRequestHeader('Accept', 'application/activity+json')
      request.send()
    }
  }
}

// Exported structures
exports.KnownActivities = KnownActivities
