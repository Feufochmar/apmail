const {Fetcher} = require('./activity-vocabulary.js')
const {Activity} = require('./activity.js')

// Already fetched activities, as a map, in order to be able to fetch them by their id
const KnownActivities = {
  // Cache
  activities: {},
  // Methods
  get: function(id) {
    return KnownActivities.activities[id]
  },
  set: function(id, obj) {
    KnownActivities.activities[id] = obj
  }
}

// Timeline class
// Represent a paginated collection of activities
var Timeline = function() {}
Timeline.prototype = {
  // attributes
  // List of activities
  activities: [],
  // Link to previous page
  prev: undefined,
  // Link to next page
  next: undefined,
  // Load a timeline from a url
  load: function(url, callback) {
    // A timeline must be reloaded each time
    Fetcher.refresh(url, function(load_ok, fetched_timeline, failure_message) {
      if (load_ok) {
        if (fetched_timeline.type === 'OrderedCollection' && fetched_timeline.first) {
          // Collection is paginated
          // Fetch the attribute
          fetched_timeline.refreshAttribute('first', function (ok, error) {
            if (load_ok) {
              this.activities = []
              this.prev = fetched_timeline.prev
              this.next = fetched_timeline.next
              this.parsePage(fetched_timeline.first, callback)
            } else {
              callback(false, error)
            }
          }.bind(this))
        } else if (fetched_timeline.type === 'OrderedCollection' && fetched_timeline.orderedItems) {
          // Collection is not paginated
          this.activities = []
          this.prev = fetched_timeline.prev
          this.next = fetched_timeline.next
          this.parsePage(fetched_timeline, callback)
        } else if (fetched_timeline.type === 'OrderedCollectionPage') {
          this.activities = []
          this.prev = fetched_timeline.prev
          this.next = fetched_timeline.next
          this.parsePage(fetched_timeline, callback)
        } else {
          callback(false, 'Unexpected answer from server when fetching activity collection.')
          console.log(answer)
        }
      } else {
        // Propagate error
        callback(false, failure_message)
      }
    }.bind(this))
  },
  parsePage: function (collectionPage, callback) {
    // Fetch attributes of collectionPage
    collectionPage.refreshAttribute('orderedItems', function (load_ok, failure_message) {
      if (load_ok) {
        // Elements of the page have been fetched
        // For each, convert them to Activity and put them in this.activities
        this.addActivity(collectionPage.orderedItems.values(), callback, '')
      } else {
        callback(false, failure_message)
      }
    }.bind(this))
  },
  addActivity: function (iter, callback, error_msg) {
    const next = iter.next()
    if (next.done) {
      callback(true, error_msg === '' ? undefined : error_msg)
    } else {
      var err = error_msg
      const act = new Activity(next.value)
      act.loadNeeded(function (load_ok, failure_message) {
        if (!load_ok) {
          err = err + failure_message + '<br/>'
        }
        // Whether it's ok or not, push
        this.activities.push(act)
        // Store in known activities
        KnownActivities.set(act.id, act)
        // next
        this.addActivity(iter, callback, err)
      }.bind(this))
    }
  }
}

// Exported structures
exports.Timeline = Timeline
exports.KnownActivities = KnownActivities
