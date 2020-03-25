// Actor class
// ActorInfo structure
var ActorInfo = function() {}
ActorInfo.prototype = {
  display_name: undefined,
  summary: undefined,
  icon: undefined,
  type: undefined
}
// ActorUrls structure
var ActorUrls = function() {}
ActorUrls.prototype = {
  profile: undefined,
  outbox: undefined,
  inbox: undefined,
  followers: undefined,
  following: undefined,
  oauth_token: undefined,
  oauth_registration: undefined,
  oauth_authorization: undefined
}
// Actor structure
var Actor = function() {
  this.info = new ActorInfo()
  this.urls = new ActorUrls()
}
Actor.prototype = {
  // Attributes
  name: undefined,
  server: undefined,
  info: undefined,
  urls: undefined,
  valid: false,
  // Methods
  // Load from name@server.
  // Callback is a function accepting two arguments:
  // - a boolean indicating if the loading is complete or in failure,
  // - a string indicating the failure
  loadFromNameAndServer: function(name, server, callback) {
    this.name = name
    this.server = server
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
    request.open('GET', 'https://' + server + '/.well-known/webfinger' + '?resource=acct:' + name + '@' + server, true)
    request.send()
  },
  // Indicate if the type is compatible with an actor
  isExpectedActorType: function(actorType) {
    return (actorType === 'Application') || (actorType === 'Group') || (actorType === 'Organization') || (actorType === 'Person') || (actorType === 'Service')
  },
  // Load from the link identifying the account
  // Callback is a function accepting two arguments:
  // - a boolean indicating if the loading is complete or in failure,
  // - a string indicating the failure
  loadFromProfileUrl: function(profile_url, callback) {
    this.urls.profile = profile_url
    // Use ActivityPub protocol to get the user infos
    var request = new XMLHttpRequest()
    request.onreadystatechange = function() {
      if (request.readyState == 4 && request.status == 200) {
        var answer = JSON.parse(request.responseText)
        if (answer && this.isExpectedActorType(answer.type)) {
          // name and server are previously filled if called from loadFromNameAndServer
          if (!this.name) {
            this.name = answer.preferredUsername
          }
          if (!this.server) {
            this.server = profile_url.replace('http://', '').replace('https://', '').split(/[/?#]/)[0]
          }
          this.info.display_name = answer.name
          this.info.summary = answer.summary
          this.info.icon = answer.icon ? answer.icon.url : undefined
          this.info.type = answer.type
          this.urls.outbox = answer.outbox
          this.urls.inbox = answer.inbox
          this.urls.followers = answer.followers
          this.urls.following = answer.following
          if (answer.endpoints) {
            this.urls.oauth_token = answer.endpoints.oauthTokenEndpoint
            this.urls.oauth_registration = answer.endpoints.oauthRegistrationEndpoint
            this.urls.oauth_authorization = answer.endpoints.oauthAuthorizationEndpoint
          }
          this.valid = true
          callback(true, 'ok')
        } else {
          callback(false, 'user profile: incorrect response from server')
          console.log(answer)
        }
      } else if (request.readyState == 4) {
        callback(false, 'user profile: server error')
      }
    }.bind(this)
    request.open('GET', profile_url, true)
    request.setRequestHeader('Content-Type', 'application/activity+json')
    request.setRequestHeader('Accept', 'application/activity+json')
    request.send()
  }
}

// Exported structures
exports.Actor = Actor
