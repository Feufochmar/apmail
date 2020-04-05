const {Fetcher, ASActor} = require('./activity-vocabulary.js')

// Actor class
// Add additional services around an ASActor
const Actor = function() {}
// Prototype
Actor.prototype = {
  // Attributes
  data: undefined, // ASActor
  name: undefined, // Name of actor, should correspond to data.preferredUsername if data is present
  server: undefined, // Server of the actor, for use of name@server style
  valid: false,
  // Methods
  // Get the name used for display
  displayName: function() {
    if (this.data && this.data.name) {
      return this.data.name
    } else if (this.data && this.data.preferredUsername) {
      return this.data.preferredUsername
    } else {
      return this.name
    }
  },
  // Get the address
  address: function() {
    return this.name + '@' + this.server
  },
  // Get the icon, or a default icon
  iconUrl: function(default_icon) {
    if (this.data && this.data.icon && this.data.icon.url) {
      return this.data.icon.url
    } else {
      return default_icon
    }
  },
  // Load from a "name@server" address.
  // Callback is a function accepting two arguments:
  // - a boolean indicating if the loading is complete or in failure,
  // - a string indicating the failure
  loadFromNameServerAddress: function(address, callback) {
    var names = address.split('@')
    if (names.length < 2) {
      // Invalid data, return
      callback(false, 'Invalid address format.')
      return
    }
    this.server = names.splice(names.length - 1, 1)
    this.name = names.splice(0, 1)
    for (const elem of names) {
      this.name = this.name + '@' + elem
    }
    // Use Webfinger to find the profile URL
    var request = new XMLHttpRequest()
    request.onreadystatechange = function() {
      if (request.readyState == 4 && request.status == 200) {
        var answer = JSON.parse(request.responseText)
        if (answer && answer.links) {
          var link = answer.links.find(e => e.type === 'application/activity+json');
          var profile = undefined
          if (link) {
            profile = link.href
          }
          if (profile) {
            this.loadFromProfileUrl(profile, callback)
          } else {
            callback(false, 'webfinger: account exists on server, but no ActivityPub account found.')
          }
        } else {
          callback(false, 'webfinger: incorrect response from server.')
          console.log(answer)
        }
      } else if (request.readyState == 4) {
        callback(false, 'webfinger: server error')
      }
    }.bind(this)
    request.open('GET', 'https://' + this.server + '/.well-known/webfinger' + '?resource=acct:' + address, true)
    request.send()
  },
  // Load from the link identifying the account
  // Callback is a function accepting two arguments:
  // - a boolean indicating if the loading is complete or in failure,
  // - a string indicating the failure
  loadFromProfileUrl: function(profile_url, callback) {
    // Fetch the activity actor
    Fetcher.get(profile_url, undefined, function(load_ok, fetched_actor, failure_message) {
      if (load_ok) {
        this.loadFromASActor(fetched_actor, callback)
      } else {
        callback(false, failure_message)
      }
    }.bind(this))
  },
  // Load from an ASActor
  loadFromASActor: function(as_actor, callback) {
    // Store the actor
    this.data = as_actor
    // Fetch a few properties
    this.data.fetchAttributeList(
      ['preferredUsername', 'name', 'summary', 'icon', 'endpoints'],
      undefined,
      function (ok, error) {
        if (ok) {
          if (!this.name) {
            this.name = this.data.preferredUsername
          }
          if (!this.server) {
            this.server = this.data.id.replace('http://', '').replace('https://', '').split(/[/?#]/)[0]
          }
          this.valid = true
          callback(true, undefined)
        } else {
          callback(false, error)
        }
      }.bind(this))
  },
  // Fill the values of actor from fixed data
  // Usefull for displaying non-actors appearing in audience fields
  fromDummyData: function(name, server, display_name, url) {
    this.valid = true
    this.name = name
    this.server = server
    this.data = new ASActor()
    this.data.id = url
    this.data.name = display_name
  }
}

// Exported structures
exports.Actor = Actor
