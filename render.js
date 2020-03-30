const {Actor} = require('./src/actor.js')
const {Timeline} = require('./src/timeline.js')
const {Message} = require('./src/message.js')
const {ConnectedUser} = require('./src/connected-user.js')
const {KnownActivities} = require('./src/known-activities.js')

// For access of elements
const Elem = function(id) {
  return window.document.getElementById(id)
}

// Icon list
const Icons = {
  'unknown-user': "img/unknown-user.svg"
}

// To render elements that cannot be present in index.html from a model element
const Render = {
  // Render an actor in audience fields context
  audienceActor: function(actor) {
    var display = '<section class="actor-display">'
    if (actor.valid) {
      const icon = actor.info.icon ? actor.info.icon : Icons['unknown-user']
      display = display + '<img src="' + icon + '" width="32" height="32" /> '
      + '<p style="display:inline-block;"><strong>' + actor.displayName() + '</strong> <br/>'
      + '<a href="' + actor.urls.profile + '">'
      + actor.address()
      + '</a></p>'
    } else {
      display = display + '<img src="' + Icons['unknown-user'] + '" width="32" height="32" /> '
      + '<p style="display:inline-block;">'
      + '<a href="' + actor.urls.profile + '">'
      + 'Other actor'
      + '</a></p>'
    }
    display = display + '</section>'
    return display
  },
  // Raw data conversion
  rawData: function(rawData) {
    var str_data = JSON.stringify(rawData, null, 1)
    var replace_map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      '\'': '&#039;'
    }
    str_data = str_data.replace(/[&<>"']/g, x => replace_map[x])
    return str_data
  }
}

// UI actions
const UI = {
  // Attributes
  composed_message: new Message(), // Message used in composition page
  current_context: 'my-inbox', // By default, show the inbox
  is_connected: false, // Indicate if the user is connected
  other_actor: new Actor(), // Other actor to display
  timeline: new Timeline(), // Collection of activities to display in the central column
  // Contextual methods
  refresh_context: {
    'send-message': function() {
      UI.updateNav('send-selector')
      UI.showTimeline(undefined, undefined)
      if (UI.is_connected) {
        UI.showPage('send-message', undefined)
      } else {
        UI.showPage('select-user', undefined)
      }
    },
    'my-inbox': function() {
      UI.updateNav('inbox-selector')
      if (UI.is_connected) {
        UI.showTimeline(ConnectedUser.actor.urls.inbox, ConnectedUser.tokens.user.access_token)
        UI.showPage('show-profile', ConnectedUser.actor)
      } else {
        UI.showTimeline(undefined, undefined)
        UI.showPage('select-user', undefined)
      }
    },
    'my-outbox': function() {
      UI.updateNav('outbox-selector')
      if (UI.is_connected) {
        UI.showTimeline(ConnectedUser.actor.urls.outbox, ConnectedUser.tokens.user.access_token)
        UI.showPage('show-profile', ConnectedUser.actor)
      } else {
        UI.showTimeline(undefined, undefined)
        UI.showPage('select-user', undefined)
      }
    },
    'my-profile': function() {
      UI.updateNav('profile-selector')
      UI.showTimeline(undefined, undefined)
      if (UI.is_connected) {
        UI.showPage('show-profile', ConnectedUser.actor)
      } else {
        UI.showPage('select-user', undefined)
      }
    },
    'other-profile': function() {
      UI.updateNav(undefined)
      UI.showPage('show-profile', UI.other_actor)
      if (UI.other_actor.urls.outbox) {
        UI.showTimeline(UI.other_actor.urls.outbox, undefined)
      } else {
        UI.displayContentError('Actor does not have a public outbox.')
        UI.showTimeline(undefined, undefined)
      }
    }
  },
  // Page refresh methods
  refresh_page: {
    'select-user': function(_) {
      Elem('connect-username').value = ''
    },
    'ask-password': function(_) {
      Elem('connect-password').value = ''
      const icon = ConnectedUser.actor.info.icon ? ConnectedUser.actor.info.icon : Icons['unknown-user']
      Elem('ask-password-user-icon').innerHTML = '<img src="' + icon + '" width="32" height="32" />'
      Elem('ask-password-user-display-name').innerText = ConnectedUser.actor.displayName()
      Elem('ask-password-user-address').href = ConnectedUser.actor.urls.profile
      Elem('ask-password-user-address').innerText = ConnectedUser.actor.address()
    },
    'show-profile': function(actor) {
      // data contains the actor to display
      const icon = actor.info.icon ? actor.info.icon : Icons['unknown-user']
      Elem('profile-icon').innerHTML = '<img src="' + icon + '" width="96" height="96" />'
      Elem('profile-display-name').innerText = actor.displayName()
      Elem('profile-address').href = actor.urls.profile
      Elem('profile-address').innerText = actor.address()
      Elem('profile-summary').innerHTML = actor.info.summary
      Elem('profile-code-source').value = JSON.stringify(actor.raw, null, 1)
    },
    'show-activity': function(activity) {
      // data contains the activity to display
      Elem('activity-type').innerText = activity.type
      Elem('activity-published').innerText = activity.published ? activity.published.toLocaleString() : ''
      const icon = activity.actor.info.icon ? activity.actor.info.icon : Icons['unknown-user']
      Elem('activity-actor-icon').innerHTML = '<img src="' + icon + '" width="48" height="48" />'
      Elem('activity-actor-display-name').innerText = activity.actor.displayName()
      Elem('activity-actor-address').innerText = activity.actor.address()
      Elem('activity-actor-address').href = activity.actor.urls.profile
      Elem('activity-to').innerHTML = activity.to.map(
        function(element) {
          return '<li class="actor-display">' + Render.audienceActor(element) + '</li>'
        }).join('')
      Elem('activity-cc').innerHTML = activity.cc.map(
        function(element) {
          return '<li class="actor-display">' + Render.audienceActor(element) + '</li>'
        }).join('')
      Elem('activity-code-source').value = JSON.stringify(activity.raw, null, 1)
      // Object of activity
      if (activity.object) {
        Elem('activity-object').style.display = 'block'
        Elem('activity-object-type').innerText = activity.object.type
        Elem('activity-object-published').innerText = activity.object.published ? activity.object.published.toLocaleString() : ''
        const icon = activity.object.actor.info.icon ? activity.object.actor.info.icon : Icons['unknown-user']
        Elem('activity-object-actor-icon').innerHTML = '<img src="' + icon + '" width="48" height="48" />'
        Elem('activity-object-actor-display-name').innerText = activity.object.actor.displayName()
        Elem('activity-object-actor-address').innerText = activity.object.actor.address()
        Elem('activity-object-actor-address').href = activity.object.actor.urls.profile
        Elem('activity-object-to').innerHTML = activity.object.to.map(
          function(element) {
            return '<li class="actor-display">' + Render.audienceActor(element) + '</li>'
          }).join('')
        Elem('activity-object-cc').innerHTML = activity.object.cc.map(
          function(element) {
            return '<li class="actor-display">' + Render.audienceActor(element) + '</li>'
          }).join('')
        Elem('activity-object-code-source').value = JSON.stringify(activity.object.raw, null, 1)
        Elem('activity-object-title').innerText = activity.object.title
        Elem('activity-object-summary').innerText = activity.object.summary
        Elem('activity-object-content').innerHTML = activity.object.content
        // Elem('activity-object-attachments')
        // Elem('activity-object-tags')
      } else {
        // Hide the element
        Elem('activity-object').style.display = 'none'
      }
    },
    'send-message': function(_) {
      Elem('send-message-to-recipient').value = ''
      Elem('send-message-cc-recipient').value = ''
      Elem('send-message-public-visibility').value = UI.composed_message.public_visibility
      Elem('send-message-follower-visibility').value = UI.composed_message.follower_visibility
      Elem('send-message-subject').value = UI.composed_message.subject
      Elem('send-message-content').value = UI.composed_message.content
      // TO/CC
      Elem('send-message-to').innerHTML = UI.composed_message.to.map(
        function(element) {
          return '<li class="actor-display">' + Render.audienceActor(element) + ' <button onclick="UI.removeToRecipient(\'' + element.urls.profile + '\')">×</button></li>'
        }).join('')
      Elem('send-message-cc').innerHTML = UI.composed_message.cc.map(
        function(element) {
          return '<li class="actor-display">' + Render.audienceActor(element) + ' <button onclick="UI.removeCcRecipient(\'' + element.urls.profile + '\')">×</button></li>'
        }).join('')
    }
  },
  // Methods
  // On load, auto-connect
  checkConnection: function() {
    // Connect
    ConnectedUser.loadFromLocalStorage(
      function(load_ok, failure_message) {
        UI.onConnectionChange(load_ok)
        if (failure_message) {
          UI.displayContentError(failure_message)
        }
      })
  },
  // On connected, show the right page
  onConnectionChange: function(connected) {
    UI.is_connected = connected
    UI.refresh_context[UI.current_context]()
  },
  // Display content errors
  displayContentError: function(message) {
    Elem('content-error').style.display = 'block'
    Elem('content-error').innerText = 'Error: ' + message
  },
  // Display timeline errors
  displayTimelineError: function(message) {
    Elem('timeline-error').style.display = 'block'
    Elem('timeline-error').innerText = 'Error: ' + message
  },
  // Clear error messages
  clearError: function() {
    Elem('content-error').style.display = 'none'
    Elem('content-error').innerText = ''
    Elem('timeline-error').style.display = 'none'
    Elem('timeline-error').innerText = ''
  },
  // Show a page
  showPage: function(page, data) {
    // Clear errors
    UI.clearError()
    // Hide all other pages
    for (const p in UI.refresh_page) {
      Elem(p).style.display = 'none'
    }
    // Show the page
    Elem(page).style.display = 'block'
    // Refresh
    UI.refresh_page[page](data)
  },
  // Show the timeline
  showTimeline: function(url, token) {
    if (url) {
      Elem('timeline').style.display = 'block'
      Elem('timeline-data').innerHTML = 'Loading collection...'
      Elem('timeline-prev-top').style.display = 'none'
      Elem('timeline-prev-bottom').style.display = 'none'
      Elem('timeline-next-top').style.display = 'none'
      Elem('timeline-next-bottom').style.display = 'none'
      UI.timeline = new Timeline()
      UI.timeline.load(
        url,
        token,
        function(load_ok, failure_message) {
          if (load_ok) {
            Elem('timeline-data').innerHTML = UI.timeline.activities.map(function(activity) {
              return '<section class="timeline-activity" onclick="UI.showActivity(\'' + activity.id + '\');">'
              + activity.type + ' Activity<br/>'
              + '<strong>' + activity.actor.displayName() + '</strong></section>'
            }).join('')
            if (UI.timeline.prev) {
              Elem('timeline-prev-top').style.display = 'block'
              Elem('timeline-prev-bottom').style.display = 'block'
            }
            if (UI.timeline.next) {
              Elem('timeline-next-top').style.display = 'block'
              Elem('timeline-next-bottom').style.display = 'block'
            }
          } else {
            UI.displayTimelineError(failure_message)
            Elem('timeline-data').innerHTML = ''
          }
        })
    } else {
      Elem('timeline').style.display = 'none'
    }
  },
  // Update the nav
  updateNav: function(selected) {
    // Unselect all options
    ['send-selector', 'inbox-selector', 'outbox-selector', 'profile-selector'].map(x => Elem(x).checked = false)
    if (selected) {
      Elem(selected).checked = true
    }
  },
  // Change context
  setContext: function(ctx) {
    UI.current_context = ctx
    UI.refresh_context[UI.current_context]()
  },
  // Lookup actor
  lookupActor: function() {
    // Find the actor and change to the 'other-profile' context
    UI.other_actor = new Actor()
    UI.other_actor.loadFromNameServerAddress(
      Elem('lookup-actor').value,
      function(load_ok, failure_message) {
        if (load_ok) {
          UI.setContext('other-profile')
        } else {
          UI.displayContentError('Unable to find user (' + failure_message + ')')
        }
      })
  },
  // Action on the select-user page
  selectUser: function() {
    // Load the actor and go to the ask-password page
    ConnectedUser.actor.loadFromNameServerAddress(
      Elem('connect-username').value,
      function(load_ok, failure_message) {
        if (load_ok) {
          UI.showPage('ask-password', undefined)
        } else {
          UI.displayContentError(failure_message)
        }
      })
  },
  // Action on the ask-password page
  connectUser: function() {
    // Connect the user
    ConnectedUser.connect(
      Elem('connect-password').value,
      function(load_ok, failure_message) {
        UI.onConnectionChange(load_ok)
        if (failure_message) {
          UI.displayContentError(failure_message)
        }
      })
  },
  // Action on the send page
  // Update visibility
  updateSendVisibility: function() {
    UI.composed_message.setVisibility(Elem('send-message-public-visibility').value, Elem('send-message-follower-visibility').value)
  },
  // Add in To
  addToRecipient: function() {
    const actor = new Actor()
    actor.loadFromNameServerAddress(
      Elem('send-message-to-recipient').value,
      function(load_ok, failure_message) {
        if (load_ok) {
          UI.composed_message.addToRecipient(actor)
          UI.showPage('send-message', undefined)
        } else {
          UI.displayContentError('Unable to find user (' + failure_message + ')')
        }
      })
  },
  // Add in Cc
  addCcRecipient: function() {
    const actor = new Actor()
    actor.loadFromNameServerAddress(
      Elem('send-message-to-recipient').value,
      function(load_ok, failure_message) {
        if (load_ok) {
          UI.composed_message.addCcRecipient(actor)
          UI.showPage('send-message', undefined)
        } else {
          UI.displayContentError('Unable to find user (' + failure_message + ')')
        }
      })
  },
  // Remove from To
  removeToRecipient: function(url_profile) {
    // Don't fetch the actor, only set the profile url used in removal
    const actor = new Actor()
    actor.urls.profile = url_profile
    UI.composed_message.removeToRecipient(actor)
    UI.showPage('send-message', undefined)
  },
  // Remove from Cc
  removeCcRecipient: function(url_profile) {
    // Don't fetch the actor, only set the profile url used in removal
    const actor = new Actor()
    actor.urls.profile = url_profile
    UI.composed_message.removeCcRecipient(actor)
    UI.showPage('send-message', undefined)
  },
  // Update message content
  updateSendContent: function() {
    UI.composed_message.setContent(Elem('send-message-subject').value, Elem('send-message-content').value)
  },
  // Send message
  sendMessage: function() {
    UI.composed_message.send(
      function(is_ok, failure_message) {
        if (is_ok) {
          UI.showPage('send-message', undefined)
        } else {
          UI.displayContentError('Error when sending message: ' + failure_message)
        }
      })
  },
  // Timeline navigation
  nextTimeline: function() {
    if (UI.timeline.next) {
      UI.showTimeline(UI.timeline.next, UI.timeline.token)
    }
  },
  prevTimeline: function() {
    if (UI.timeline.prev) {
      UI.showTimeline(UI.timeline.prev, UI.timeline.token)
    }
  },
  // Show contents of activities
  showActivity: function(activityId) {
    UI.showPage('show-activity', KnownActivities.get(activityId))
  }
}
