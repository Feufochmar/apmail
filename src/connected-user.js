const {Actor} = require('./actor.js')

// Connected user structure
var ConnectedUser = {
  // Data
  actor: new Actor(),
  tokens: {
    server: {
      client_id: undefined,
      client_secret: undefined
    },
    user: {
      refresh_token: undefined,
      access_token: undefined
    }
  },
  // Methods
  // Load data from local storage if possible
  // Callback is used to get the status of the loading
  loadFromLocalStorage: function (callback) {
    var server_name = window.localStorage.getItem('last:server.name')
    var user_name = window.localStorage.getItem('last:user.name')
    if (server_name && user_name) {
      ConnectedUser.tokens.server.client_id = window.localStorage.getItem('client_id:' + server_name)
      ConnectedUser.tokens.server.client_secret = window.localStorage.getItem('client_secret:' + server_name)
      ConnectedUser.tokens.user.refresh_token = window.localStorage.getItem('refresh_token:' + user_name + '@' + server_name)
      ConnectedUser.tokens.user.access_token = window.localStorage.getItem('access_token:' + user_name + '@' + server_name)
      // Load the rest with webfinger / activity pub requests
      ConnectedUser.actor.loadFromNameAndServer(user_name, server_name, callback)
    } else {
      callback(false, 'local storage: no data')
    }
  },
  saveToLocalStorage: function () {
    window.localStorage.setItem('last:server.name', ConnectedUser.actor.server)
    window.localStorage.setItem('last:user.name', ConnectedUser.actor.name)
    window.localStorage.setItem('client_id:' + ConnectedUser.actor.server, ConnectedUser.tokens.server.client_id)
    window.localStorage.setItem('client_secret:' + ConnectedUser.actor.server, ConnectedUser.tokens.server.client_secret)
    window.localStorage.setItem('refresh_token:' + ConnectedUser.actor.name + '@' + ConnectedUser.actor.server, ConnectedUser.tokens.user.refresh_token)
    window.localStorage.setItem('access_token:' + ConnectedUser.actor.name + '@' + ConnectedUser.actor.server, ConnectedUser.tokens.user.access_token)
  },
  // Disconnect user
  disconnect: function() {
    if (ConnectedUser.actor.name && ConnectedUser.actor.server) {
      window.localStorage.removeItem('refresh_token:' + ConnectedUser.actor.name + '@' + ConnectedUser.actor.server)
      window.localStorage.removeItem('access_token:' + ConnectedUser.actor.name + '@' + ConnectedUser.actor.server)
    }
    window.localStorage.removeItem('last:server.name')
    window.localStorage.removeItem('last:user.name')
    ConnectedUser.actor = new Actor()
    ConnectedUser.tokens.server.client_id = undefined
    ConnectedUser.tokens.server.client_secret = undefined
    ConnectedUser.tokens.user.refresh_token = undefined
    ConnectedUser.tokens.user.access_token = undefined
  },
  // Connection : get tokens from password
  connect: function(password, callback) {
    // Retrieve server tokens, or generate them
    // Then ask for user tokens
    ConnectedUser.getServerTokens(
      function(load_ok, failure) {
        if (load_ok) {
          ConnectedUser.getUserTokens(password, callback)
        } else {
          callback(false, 'OAuth: unable to get client tokens for AP.Mail (' + failure + ')')
        }
      })
  },
  // Retrieve server tokens
  getServerTokens: function(callback) {
    var server = ConnectedUser.actor.server
    if (server) {
      // try to load the keys from the localStorage
      var client_id = window.localStorage.getItem('client_id:' + server)
      var client_secret = window.localStorage.getItem('client_secret:' + server)
      if (client_id && client_secret) {
        ConnectedUser.tokens.server.client_id = client_id
        ConnectedUser.tokens.server.client_secret = client_secret
        callback(true, 'ok')
      } else {
        // generate keys and store them
        var request = new XMLHttpRequest()
        request.onreadystatechange = function() {
          if (request.readyState == 4 && request.status == 200) {
            var answer = JSON.parse(request.responseText)
            // Retrieve the tokens
            var client_id = answer.client_id
            var client_secret = answer.client_secret
            if (client_id && client_secret) {
              ConnectedUser.tokens.server.client_id = client_id
              ConnectedUser.tokens.server.client_secret  = client_secret
              // Save tokens in localStorage
              window.localStorage.setItem('client_id:' + ConnectedUser.actor.server, ConnectedUser.tokens.server.client_id)
              window.localStorage.setItem('client_secret:' + ConnectedUser.actor.server, ConnectedUser.tokens.server.client_secret)
              // Continue
              callback(true, 'ok')
            } else {
              callback(false, 'OAuth: server did not register client.')
            }
          } else if (request.readyState == 4) {
            callback(false, 'OAuth: server error when registering client.')
          }
        }
        request.open('POST', ConnectedUser.actor.urls.oauth_registration, true)
        var data = new URLSearchParams()
        data.append('client_name', 'AP.Mail client')
        data.append('redirect_uris', 'urn:ietf:wg:oauth:2.0:oob')
        data.append('scopes', 'read write follow')
        data.append('website', 'http://feuforeve.fr')
        request.send(data)
      }
    } else {
      callback(false, 'OAuth: unable to retrieve client tokens from an unknown server')
    }
  },
  getUserTokens: function(password, callback) {
    var request = new XMLHttpRequest()
    request.onreadystatechange = function() {
      if (request.readyState == 4 && request.status == 200) {
        var answer = JSON.parse(request.responseText)
        // Retrieve the tokens
        ConnectedUser.tokens.user.refresh_token = answer.refresh_token
        ConnectedUser.tokens.user.access_token = answer.access_token
        // Save the tokens
        ConnectedUser.saveToLocalStorage()
        // OK, return to callback
        callback(true, 'ok')
      } else if (request.readyState == 4) {
        callback(false, 'OAuth: cannot get user tokens')
      }
    }
    request.open('POST', ConnectedUser.actor.urls.oauth_token, true)
    var data = new URLSearchParams()
    data.append('client_id', ConnectedUser.tokens.server.client_id)
    data.append('client_secret', ConnectedUser.tokens.server.client_secret)
    data.append('grant_type', 'password')
    data.append('username', ConnectedUser.actor.name)
    data.append('password', password)
    data.append('scope', 'read write follow')
    request.send(data)
  }
}

// Exported structures
exports.ConnectedUser = ConnectedUser
