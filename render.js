const {Actor} = require('./src/actor.js')
const {Timeline} = require('./src/timeline.js')
const {Message} = require('./src/message.js')
const {ConnectedUser} = require('./src/connected-user.js')

// UI actions
var UI = {
  // Attributes
  composed_message: new Message(),
  // Methods
  // Get the value of an element
  getValue: function(id) {
    return window.document.getElementById(id).value
  },
  // Set the value of an element
  setValue: function(id, val) {
    window.document.getElementById(id).value = val
  },
  // Clear the value of an element
  clearValue: function(id) {
    UI.setValue(id, '')
  },
  // Actor display
  renderActorTag: function(actor) {
    var display = '<section class="actor-display">'
    if (actor.valid) {
      if (actor.info.icon) {
        display = display + '<img src="' + actor.info.icon + '" width="32" height="32" /> '
      }
      display = display
        + '<p style="display:inline-block;"><strong>' + actor.info.display_name + '</strong> <br/>'
        + '<a href="' + actor.urls.profile + '">'
        + actor.name + '@' + actor.server
        + '</a></p>'
    } else {
      display = display
        + '<p style="display:inline-block;">'
        + '<a href="' + actor.urls.profile + '">'
        + 'Other actor'
        + '</a></p>'
    }
    display = display + '</section>'
    return display
  },
  // Show the page tab
  showPageTab: function(is_shown) {
    window.document.getElementById('tab-bar').style.visibility = is_shown ? 'visible' : 'hidden'
  },
  // Action done when refreshing a page
  refreshPage: {
    'select-user': function() {
      UI.showPageTab(false)
      ConnectedUser.disconnect()
      UI.clearValue('connect-username')
    },
    'ask-password': function() {
      UI.showPageTab(false)
      UI.clearValue('connect-password')
      window.document.getElementById('ask-password-user-info').innerHTML = UI.renderActorTag(ConnectedUser.actor)
    },
    'profile': function() {
      UI.showPageTab(true)
      UI.updateProfilePage()
    },
    'send': function() {
      UI.showPageTab(true)
      UI.composed_message = new Message()
      UI.updateSendMessagePage()
    },
    'inbox': function() {
      UI.showPageTab(true)
      window.document.getElementById('inbox-messages-error').innerHTML = 'Loading inbox...'
      UI.showTimeline('inbox-messages', ConnectedUser.tokens.user.access_token, ConnectedUser.actor.urls.inbox)
    },
    'outbox': function() {
      UI.showPageTab(true)
      window.document.getElementById('outbox-messages-error').innerHTML = 'Loading outbox...'
      UI.showTimeline('outbox-messages', ConnectedUser.tokens.user.access_token, ConnectedUser.actor.urls.outbox)
    },
    'lookup': function() {
      UI.showPageTab(true)
      window.document.getElementById('lookup-user-error').innerHTML = ''
      window.document.getElementById('lookup-user-info').innerHTML = ''
      window.document.getElementById('lookup-user-timeline').innerHTML = ''
      window.document.getElementById('lookup-user-timeline-error').innerHTML = ''
    }
  },
  // Show a given page
  showPage: function(page) {
    ['select-user', 'ask-password', 'profile', 'send', 'inbox', 'outbox', 'lookup'].map(x => window.document.getElementById(x).style.display = 'none')
    window.document.getElementById(page).style.display = 'block'
    UI.refreshPage[page]()
  },
  // When the page loads, load the connected user if already connected
  checkConnection: function() {
    ConnectedUser.loadFromLocalStorage(
      function(load_ok, failure_message) {
        if (load_ok) {
          // TODO: Refresh the access token ?
          // No need to show the login pages, go directly to send message page
          UI.showPage('send')
        } else {
          // Show the select user page
          UI.showPage('select-user')
        }
      })
  },
  // Get the username + servername from an address "user@server"
  getUserAndServer: function(address) {
    var names = address.split('@')
    return {
      user: names[0],
      server: names[1]
    }
  },
  // When the user enter its address, load the actor representing the user
  selectUser: function() {
    // Get the user name and server name
    var names = UI.getUserAndServer(window.document.getElementById('connect-username').value)
    // Load the actor and go to the ask-password page
    ConnectedUser.actor.loadFromNameAndServer(
      names.user, names.server,
      function(load_ok, failure_message) {
        if (load_ok) {
          UI.showPage('ask-password')
        } else {
          window.document.getElementById('select-user-error').innerText = 'Error: ' + failure_message
        }
      })
  },
  // When the user enter its password, get the access tokens and then go to the send page
  connectUser: function() {
    // Connect the user and go to the send page
    ConnectedUser.connect(
      UI.getValue('connect-password'),
      function(load_ok, failure_message) {
        if (load_ok) {
          UI.showPage('send')
        } else {
          window.document.getElementById('ask-password-error').innerText = 'Error: ' + failure_message
        }
      })
  },
  updateProfilePage: function() {
    window.document.getElementById('profile-info').innerHTML = UI.renderActor(ConnectedUser.actor)
  },
  updateSendMessagePage: function() {
    UI.clearValue('send-message-to-recipient')
    UI.clearValue('send-message-cc-recipient')
    UI.setValue('send-message-public-visibility', UI.composed_message.public_visibility)
    UI.setValue('send-message-follower-visibility', UI.composed_message.follower_visibility)
    UI.setValue('send-message-subject', UI.composed_message.subject)
    UI.setValue('send-message-content', UI.composed_message.content)
    // TO/CC
    window.document.getElementById('send-message-to').innerHTML = UI.composed_message.to.map(
      function(element) {
        return '<li class="actor-display">' + UI.renderActorTag(element) + ' <button onclick="UI.removeToRecipient(\'' + element.urls.profile + '\')">×</button></li>'
      }).join('')
    window.document.getElementById('send-message-cc').innerHTML = UI.composed_message.cc.map(
      function(element) {
        return '<li class="actor-display">' + UI.renderActorTag(element) + ' <button onclick="UI.removeCcRecipient(\'' + element.urls.profile + '\')">×</button></li>'
      }).join('')
    // Errors
    window.document.getElementById('send-message-recipient-error').innerHTML = ''
    window.document.getElementById('send-error').innerHTML = ''
  },
  updateSendVisibility: function() {
    UI.composed_message.setVisibility(UI.getValue('send-message-public-visibility'), UI.getValue('send-message-follower-visibility'))
  },
  updateSendContent: function() {
    UI.composed_message.setContent(UI.getValue('send-message-subject'), UI.getValue('send-message-content'))
  },
  // Add to recipient lists
  addToRecipient: function() {
    var names = UI.getUserAndServer(window.document.getElementById('send-message-to-recipient').value)
    var actor = new Actor()
    actor.loadFromNameAndServer(
      names.user, names.server,
      function(load_ok, failure_message) {
        if (load_ok) {
          UI.composed_message.addToRecipient(actor)
          UI.updateSendMessagePage()
        } else {
          window.document.getElementById('send-message-recipient-error').innerHTML = 'Unable to find user (' + failure_message + ')'
        }
      })
  },
  addCcRecipient: function() {
    var names = UI.getUserAndServer(window.document.getElementById('send-message-cc-recipient').value)
    var actor = new Actor()
    actor.loadFromNameAndServer(
      names.user, names.server,
      function(load_ok, failure_message) {
        if (load_ok) {
          UI.composed_message.addCcRecipient(actor)
          UI.updateSendMessagePage()
        } else {
          window.document.getElementById('send-message-recipient-error').innerHTML = 'Unable to find user (' + failure_message + ')'
        }
      })
  },
  // Remove from recipient lists
  removeToRecipient: function(url_profile) {
    // Don't fetch the actor, only set the profile url used in removal
    var actor = new Actor()
    actor.urls.profile = url_profile
    //
    UI.composed_message.removeToRecipient(actor)
    UI.updateSendMessagePage()
  },
  removeCcRecipient: function(url_profile) {
    var actor = new Actor()
    actor.urls.profile = url_profile
    //
    UI.composed_message.removeCcRecipient(actor)
    UI.updateSendMessagePage()
  },
  // Send message
  sendMessage: function() {
    UI.composed_message.send(
      function(is_ok, failure_message) {
        if (is_ok) {
          UI.showPage('send')
        } else {
          window.document.getElementById('send-error').innerText = failure_message
        }
      })
  },
  renderRawActivity: function(activity) {
    var str_activity = JSON.stringify(activity.raw, null, 1)
    var replace_map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      '\'': '&#039;'
    }
    str_activity = str_activity.replace(/[&<>"']/g, x => replace_map[x])
    return '<section class="activity-raw"><details>'
      + '<summary>Raw activity</summary>'
      + '<textarea rows="30" cols="120" readonly>' + str_activity + '</textarea>'
      + '</details></section>'
  },
  renderObject: {
    'Note': function(activity) {
      return '<article class="activity create note">'
        + '<section class="activity-object-field">From ' + (activity.actor ? UI.renderActorTag(activity.actor) : '')
        + ' – ' + (activity.published ? activity.published.toLocaleString() : '') + '</section>'
        + '<section class="activity-object-field"> To ' + (activity.to ? activity.to.map(x => UI.renderActorTag(x)).join(' ') : '' ) + '</section>'
        + '<section class="activity-object-field"> Cc ' + (activity.cc ? activity.cc.map(x => UI.renderActorTag(x)).join(' ') : '' ) + '</section>'
        + '<section class="activity-object-field">Subject: ' + (activity.object.summary ? activity.object.summary : '' ) + '</section>'
        + '<section class="activity-object-field activity-object-content">' + (activity.object.content ? activity.object.content : '' ) + '</section>'
        + UI.renderRawActivity(activity)
        + '</article>'
    }
  },
  renderActivity: {
    'Create': function(activity) {
      if (UI.renderObject[activity.object.type]) {
        return UI.renderObject[activity.object.type](activity)
      } else {
        return '<article class="activity create">'
          + 'Object creation (' + activity.object.type + ').'
          + UI.renderRawActivity(activity)
          + '</article>'
      }
    },
    'Like': function(activity) {
      return '<article class="activity like">'
        + (activity.actor ? UI.renderActorTag(activity.actor) : '')
        + " liked "
        + (activity.object ? '<a href="' + activity.object + '">' + activity.object + '</a>' : '')
        + UI.renderRawActivity(activity)
        + '</article>'
    },
    'Announce': function(activity) {
      return '<article class="activity share">'
        + (activity.actor ? UI.renderActorTag(activity.actor) : '')
        + " shared "
        + (activity.object ? '<a href="' + activity.object + '">' + activity.object + '</a>' : '')
        + UI.renderRawActivity(activity)
        + '</article>'
    },
    'Delete': function(activity) {
      return '<article class="activity delete">'
        + (activity.actor ? UI.renderActorTag(activity.actor) : '')
        + " deleted an object."
        + UI.renderRawActivity(activity)
        + '</article>'
    }
  },
  showTimeline: function(id, token, url) {
    var timeline = new Timeline()
    timeline.load(url, token, function(load_ok, failure_message) {
      if (load_ok) {
        var content = timeline.activities.map(
          function(activity) {
            if (UI.renderActivity[activity.type]) {
              return UI.renderActivity[activity.type](activity)
            } else {
              return '<article class="activity">'
                + 'Other activity (' + activity.type + ').'
                + UI.renderRawActivity(activity)
                + '</article>'
            }
          }).join('')
        content = content + '<section class="prev-next">'
        if (timeline.prev) {
          content = content + '<button onclick="UI.showTimeline(\'' + id + '\',' + (token ? '\'' + token + '\'' : 'undefined') + ',\'' + timeline.prev + '\')">Prev</button>'
        }
        if (timeline.next) {
          content = content + '<button onclick="UI.showTimeline(\'' + id + '\',' + (token ? '\'' + token + '\'' : 'undefined') + ',\'' + timeline.next + '\')">Next</button>'
        }
        content = content + '</section>'
        window.document.getElementById(id).innerHTML = content
      } else {
        window.document.getElementById(id + '-error').innerText = failure_message
      }
    })
  },
  renderActor: function(actor) {
    var display = '<section>'
    if (actor.valid) {
      if (actor.info.icon) {
        display = display + '<img src="' + actor.info.icon + '" width="96" height="96" /> '
      }
      display = display
      + '<p style="display:inline-block;"><strong>' + actor.info.display_name + '</strong> <br/>'
      + '<a href="' + actor.urls.profile + '">'
      + actor.name + '@' + actor.server
      + '</a></p>'
      + '<p>' + actor.info.summary + '</p>'
    } else {
      display = display
      + '<p style="display:inline-block;">'
      + '<a href="' + actor.urls.profile + '">'
      + 'Other actor'
      + '</a></p>'
    }
    display = display + '</section>'
    return display
  },
  lookupUser: function() {
    window.document.getElementById('lookup-user-info').innerHTML = ''
    window.document.getElementById('lookup-user-timeline').innerHTML = ''
    window.document.getElementById('lookup-user-error').innerHTML = ''
    window.document.getElementById('lookup-user-timeline-error').innerHTML = ''
    var names = UI.getUserAndServer(window.document.getElementById('lookup-user').value)
    var actor = new Actor()
    actor.loadFromNameAndServer(
      names.user, names.server,
      function(load_ok, failure_message) {
        if (load_ok) {
          window.document.getElementById('lookup-user-info').innerHTML = UI.renderActor(actor)
          UI.showTimeline('lookup-user-timeline', undefined, actor.urls.outbox)
        } else {
          window.document.getElementById('lookup-user-error').innerHTML = 'Unable to find user (' + failure_message + ')'
        }
      })
  }
}
