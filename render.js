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
  // Fallback icons
  fallback: {
    // Misc
    'user': "img/unknown-user.svg",
    'activity': "img/unknown-activity.svg",
  },
  // ActivityStream vocabulary: Activities
  vocabulary_activity: {
    'Accept': 'img/accept.svg',
    'Add': 'img/add.svg',
    'Announce': 'img/announce.svg',
    'Arrive': 'img/arrive.svg',
    'Block': 'img/block.svg',
    'Create': 'img/create.svg',
    'Delete': 'img/delete.svg',
    'Dislike': 'img/dislike.svg',
    'Flag': 'img/flag.svg',
    'Follow': 'img/follow.svg',
    'Ignore': 'img/ignore.svg',
    'Invite': 'img/invite.svg',
    'Join': 'img/join.svg',
    'Leave': 'img/leave.svg',
    'Like': 'img/like.svg',
    'Listen': 'img/listen.svg',
    'Move': 'img/move.svg',
    'Offer': 'img/offer.svg',
    'Question': 'img/question.svg',
    'Reject': 'img/reject.svg',
    'Read': 'img/read.svg',
    'Remove': 'img/remove.svg',
    'TentativeReject': 'img/reject.svg',
    'TentativeAccept': 'img/accept.svg',
    'Travel': 'img/travel.svg',
    'Undo': 'img/undo.svg',
    'Update': 'img/update.svg',
    'View': 'img/view.svg'
  },
  // Get activity icon from its type
  activity: function(type) {
    return Icons.vocabulary_activity[type] ? Icons.vocabulary_activity[type] : Icons.fallback['activity']
  }
}

// To render elements that cannot be present in index.html from a model element
const Render = {
  // Render an actor in audience fields context
  audienceActor: function(actor) {
    var display = '<section style="display:inline-block;">'
    if (actor.valid) {
      const icon = actor.info.icon ? actor.info.icon : Icons.fallback['user']
      display = display + '<img src="' + icon + '" width="32" height="32" /> '
      + '<p style="display:inline-block;"><strong>' + actor.displayName() + '</strong> <br/>'
      + '<a href="' + actor.urls.profile + '">'
      + actor.address()
      + '</a></p>'
    } else {
      display = display + '<img src="' + Icons.fallback['user'] + '" width="32" height="32" /> '
      + '<p style="display:inline-block;">'
      + '<a href="' + actor.urls.profile + '">'
      + 'Other actor'
      + '</a></p>'
    }
    display = display + '</section>'
    return display
  },
  // Render an attachment
  attachment: function(attachment) {
    // If a string => link
    var display = ''
    if (typeof attachment === 'string') {
      display = display + '<a href="' + attachment + '">Link to object</a>'
    } else {
      const type = attachment.type
      const name = attachment.name
      const url = attachment.url
      const media_type = attachment.mediaType
      // If the url is a string, display the element
      if (typeof url === 'string') {
        display = display + Render.attachmentFrom(type, name, media_type, url)
      } else if (Array.isArray(url)) {
        // Array of urls => unsupported
      } else if (url.type && url.type === 'Link') {
        // Object
        display = display + Render.attachmentFrom(type, name, url.mediaType ? url.mediaType : media_type, url.href)
      } else {
        // Unsupported
      }
    }
    return display
  },
  attachmentFrom: function(type, name, media_type, url) {
    // Show a link
    var display = (type ? type : 'Document') + '<br/><a href="' + url + '">' + (name ? name : url) + '</a>'
    // Show the attachment if it's an image, an audio, or a video
    if (type && ((type === 'Image') || (type === 'Document' && media_type && media_type.startsWith('image/')))) {
      display = display + '<br/><img src="' + url + '" width="300" ' + (name ? ('alt="' + name + '"') : '') + ' />'
    } else if (type && ((type === 'Audio') || (type === 'Document' && media_type && media_type.startsWith('audio/')))) {
      display = display + '<br/><audio controls preload="none" src="' + url + '">' + (name ? name : url) + '</audio>'
    } else if (type && ((type === 'Video') || (type === 'Document' && media_type && media_type.startsWith('video/')))) {
      display = display + '<br/><video controls preload="none" src="' + url + '" width="300" >' + (name ? name : url) + '</video>'
    }
    return display
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
        UI.displayError('Actor does not have a public outbox.')
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
      const icon = ConnectedUser.actor.info.icon ? ConnectedUser.actor.info.icon : Icons.fallback['user']
      Elem('ask-password-user-icon').innerHTML = '<img src="' + icon + '" width="32" height="32" />'
      Elem('ask-password-user-display-name').innerText = ConnectedUser.actor.displayName()
      Elem('ask-password-user-address').href = ConnectedUser.actor.urls.profile
      Elem('ask-password-user-address').innerText = ConnectedUser.actor.address()
    },
    'show-profile': function(actor) {
      // data contains the actor to display
      const icon = actor.info.icon ? actor.info.icon : Icons.fallback['user']
      Elem('profile-icon').innerHTML = '<img src="' + icon + '" width="96" height="96" />'
      Elem('profile-display-name').innerText = actor.displayName()
      Elem('profile-address').href = actor.urls.profile
      Elem('profile-address').innerText = actor.address()
      Elem('profile-type').innerText = actor.info.type
      Elem('profile-summary').innerHTML = actor.info.summary
      Elem('profile-code-source').innerText = JSON.stringify(actor.raw, null, 1)
      // Controls only shown if the actor is the connected user
      if (actor.urls.profile === ConnectedUser.actor.urls.profile) {
        Elem('profile-controls-connected').style.display = 'block';
      } else {
        Elem('profile-controls-connected').style.display = 'none';
      }
    },
    'show-activity': function(activity) {
      // data contains the activity to display
      Elem('activity-type').innerText = activity.type
      Elem('activity-published').innerText = activity.published ? activity.published.toLocaleString() : ''
      const icon = activity.actor.info.icon ? activity.actor.info.icon : Icons.fallback['user']
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
      Elem('activity-code-source').innerText = JSON.stringify(activity.raw, null, 1)
      // Object of activity
      if (activity.object) {
        Elem('activity-object').style.display = 'block'
        Elem('activity-object-type').innerText = activity.object.type
        Elem('activity-object-published').innerText = activity.object.published ? activity.object.published.toLocaleString() : ''
        const icon = activity.object.actor.info.icon ? activity.object.actor.info.icon : Icons.fallback['user']
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
        Elem('activity-object-code-source').innerText = JSON.stringify(activity.object.raw, null, 1)
        Elem('activity-object-title').innerText = activity.object.title
        Elem('activity-object-summary').innerText = activity.object.summary
        Elem('activity-object-content').innerHTML = activity.object.content
        // If there are attachments on the object, display them
        Elem('activity-object-attachments-number').innerText = activity.object.attachments.length
        Elem('activity-object-attachments').innerHTML = activity.object.attachments.map(
          function(element) {
            return '<li class="attachment-display">' + Render.attachment(element) + '</li>'
          }).join('')
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
          return '<li class="actor-display">'
          + Render.audienceActor(element)
          + ' <button style="vertical-align:top;" onclick="UI.removeToRecipient(\'' + element.urls.profile + '\')">×</button>'
          + '</li>'
        }).join('')
      Elem('send-message-cc').innerHTML = UI.composed_message.cc.map(
        function(element) {
          return '<li class="actor-display">'
          + Render.audienceActor(element)
          + ' <button style="vertical-align:top;" onclick="UI.removeCcRecipient(\'' + element.urls.profile + '\')">×</button>'
          + '</li>'
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
          UI.displayError(failure_message)
        }
      })
  },
  // On connected, show the right page
  onConnectionChange: function(connected) {
    UI.is_connected = connected
    UI.refresh_context[UI.current_context]()
  },
  // Display content errors
  displayError: function(message) {
    Elem('error').style.display = 'block'
    Elem('content-error').innerText = message
  },
  // Clear error messages
  clearError: function() {
    Elem('error').style.display = 'none'
    Elem('content-error').innerText = ''
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
      Elem('timeline-prev-top').disabled = true
      Elem('timeline-next-top').disabled = true
      UI.timeline = new Timeline()
      UI.timeline.load(
        url,
        token,
        function(load_ok, failure_message) {
          if (load_ok) {
            Elem('timeline-data').innerHTML = UI.timeline.activities.map(function(activity) {
              return '<section class="timeline-activity" onclick="UI.showActivity(\'' + activity.id + '\');">'
              + '<img src="' + Icons.activity(activity.type) + '" width="32" height="32"> '
              + '<p style="display:inline-block;">'
              + '<strong>' + activity.type
              + ((activity.object && activity.object.type) ? ' (' + activity.object.type + ')' : '')
              + '</strong><br/>'
              + activity.actor.displayName() + '</p></section>'
            }).join('')
            if (UI.timeline.prev) {
              Elem('timeline-prev-top').disabled = false
            }
            if (UI.timeline.next) {
              Elem('timeline-next-top').disabled = false
            }
          } else {
            UI.displayError(failure_message)
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
          UI.displayError('Unable to find user (' + failure_message + ')')
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
          UI.displayError(failure_message)
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
          UI.displayError(failure_message)
        }
      })
  },
  // Action on the profile page
  disconnectUser: function() {
    // Disconnect the user
    ConnectedUser.disconnect()
    UI.onConnectionChange(false)
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
          UI.displayError('Unable to find user (' + failure_message + ')')
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
          UI.displayError('Unable to find user (' + failure_message + ')')
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
          UI.displayError('Error when sending message: ' + failure_message)
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
