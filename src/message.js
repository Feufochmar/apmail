import {ConnectedUser} from './connected-user.js'

// Outgoing messages
var Message = function() {
  this.to = []
  this.cc = []
}
Message.prototype = {
  // Attributes
  to: [],
  cc: [],
  public_visibility: 'to', // 'to', 'cc', 'non'
  follower_visibility: 'cc', // 'to', 'cc', 'non'
  subject: '',
  content: '',
  type: 'Note',
  media_type: 'text/plain', // Pleroma also accepts: text/markdown, text/html, text/bbcode
  // Methods
  setContent: function(subject, content) {
    this.subject = subject
    this.content = content
  },
  setVisibility: function(pub, follower) {
    // TODO: filter visibility
    this.public_visibility = pub
    this.follower_visibility = follower
  },
  // Add recipients
  addToRecipient: function(actor) {
    this.to.push(actor)
  },
  addCcRecipient: function(actor) {
    this.cc.push(actor)
  },
  // Remove recipients
  removeToRecipient: function(actor) {
    var idx = this.to.findIndex(x => x.data.id === actor.data.id)
    if (idx !== -1) {
      this.to.splice(idx, 1)
    }
  },
  removeCcRecipient: function(actor) {
    var idx = this.cc.findIndex(x => x.data.id === actor.data.id)
    if (idx !== -1) {
      this.cc.splice(idx, 1)
    }
  },
  // Send message
  send: function(callback) {
    // Recipients
    var recipients_to = this.to.map(x => x.data.id)
    var recipients_cc = this.cc.map(x => x.data.id)
    if (this.public_visibility === 'to') {
      recipients_to.push('https://www.w3.org/ns/activitystreams#Public')
    } else if (this.public_visibility === 'cc') {
      recipients_cc.push('https://www.w3.org/ns/activitystreams#Public')
    }
    if (this.follower_visibility === 'to') {
      recipients_to.push(ConnectedUser.actor.data.followers)
    } else if (this.follower_visibility === 'cc') {
      recipients_cc.push(ConnectedUser.actor.data.followers)
    }
    //
    var message = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: this.type,
      to: recipients_to,
      cc: recipients_cc,
      summary: this.subject !== '' ? this.subject : null,
      content: this.content,
      mediaType: this.media_type
    }
    // Encapsulate in a create activity, although this should not be mandatory
    var activity = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'Create',
      to: message.to,
      cc: message.cc,
      object: message
    }
    var json_message = JSON.stringify(activity)
    var request = new XMLHttpRequest()
    request.onreadystatechange = function() {
      if (request.readyState == 4 && request.status == 201) {
        callback(true, undefined)
      } else if (request.readyState == 4) {
        callback(false, 'Send: Message not created on server')
      }
    }
    request.open('POST', ConnectedUser.actor.data.outbox, true)
    request.setRequestHeader('Authorization', 'Bearer ' + ConnectedUser.tokens.user.access_token)
    request.setRequestHeader('Content-Type', 'application/activity+json')
    request.setRequestHeader('Accept', 'application/activity+json')
    request.send(json_message)
  }
}

// Exported structures
export {Message}
