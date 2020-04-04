// Implementation of Activity Vocabulary, with extension for ActivityPub
// https://www.w3.org/TR/activitystreams-vocabulary
// https://www.w3.org/TR/activitypub

// Note: their prototypes are defined after to allow the definition of ObjectFetcher
// Base for other elements - to put things in common
const ASBase = function() {}
// Core types
const ASObject = function() {}
const ASLink = function() {}
const ASActivity = function() {}
const ASIntransitiveActivity = function() {}
const ASCollection = function() {}
const ASOrderedCollection = function() {}
const ASCollectionPage = function() {}
const ASOrderedCollectionPage = function() {}
// Extension for modelisation of ActivityPub actors
const ASActor = function() {}

// Extended Types
// Activity Types
const ASAccept = function() {}
const ASAdd = function() {}
const ASAnnounce = function() {}
const ASArrive = function() {}
const ASBlock = function() {}
const ASCreate = function() {}
const ASDelete = function() {}
const ASDislike = function() {}
const ASFlag = function() {}
const ASFollow = function() {}
const ASIgnore = function() {}
const ASInvite = function() {}
const ASJoin = function() {}
const ASLeave = function() {}
const ASLike = function() {}
const ASListen = function() {}
const ASMove = function() {}
const ASOffer = function() {}
const ASQuestion = function() {}
const ASReject = function() {}
const ASRead = function() {}
const ASRemove = function() {}
const ASTentativeReject = function() {}
const ASTentativeAccept = function() {}
const ASTravel = function() {}
const ASUndo = function() {}
const ASUpdate = function() {}
const ASView = function() {}

// Actor Types
const ASApplication = function() {}
const ASGroup = function() {}
const ASOrganization = function() {}
const ASPerson = function() {}
const ASService = function() {}

// Object Types
const ASArticle = function() {}
const ASAudio = function() {}
const ASDocument = function() {}
const ASEvent = function() {}
const ASImage = function() {}
const ASNote = function() {}
const ASPage = function() {}
const ASPlace = function() {}
const ASProfile = function() {}
const ASRelationship = function() {}
const ASTombstone = function() {}
const ASVideo = function() {}

// Link Types
const ASMention = function() {}

// Object fetcher
// Convert resources from the resource fetcher into Activity objects
Fetcher = {
  // Cache of already accessed objects
  knownObjects: {},
  // Get an object
  // Callback signature is function(load_ok, fetched_object, failure_message)
  get: function(id, token, callback) {
    if (Fetcher.knownObjects[id]) {
      callback(true, Fetcher.knownObjects[id], '')
    } else {
      Fetcher.refresh(id, token, callback)
    }
  },
  // Refresh a resource
  // Callback signature is function(load_ok, fetched_object, failure_message)
  refresh: function(id, token, callback) {
    const request = new XMLHttpRequest()
    request.onreadystatechange = function() {
      if (request.readyState == 4 && request.status == 200) {
        const answer = JSON.parse(request.responseText)
        if (answer) {
          // Build the object
          const obj = Fetcher.fromJson(answer)
          Fetcher.knownObjects[id] = obj
          callback(true, obj, undefined)
        } else {
          callback(false, 'Unexpected answer from server when fetching object.')
          console.log(answer)
        }
      } else if (request.readyState == 4) {
        callback(false, 'Server error when fetching object (' + request.status + ').')
      }
    }
    request.open('GET', id, true)
    if (token) {
      request.setRequestHeader('Authorization', 'Bearer ' + token)
    }
    request.setRequestHeader('Content-Type', 'application/activity+json')
    request.setRequestHeader('Accept', 'application/activity+json')
    request.send()
  },
  // Build from type name
  _type_from_name: {
    // Core types
    'Object': ASObject,
    'Link': ASLink,
    'Activity': ASActivity,
    'IntransitiveActivity': ASIntransitiveActivity,
    'Collection': ASCollection,
    'OrderedCollection': ASOrderedCollection,
    'CollectionPage': ASCollectionPage,
    'OrderedCollectionPage': ASOrderedCollectionPage,
    'Actor': ASActor,
    // Activity Types
    'Accept': ASAccept,
    'Add': ASAdd,
    'Announce': ASAnnounce,
    'Arrive': ASArrive,
    'Block': ASBlock,
    'Create': ASCreate,
    'Delete': ASDelete,
    'Dislike': ASDislike,
    'Flag': ASFlag,
    'Follow': ASFollow,
    'Ignore': ASIgnore,
    'Invite': ASInvite,
    'Join': ASJoin,
    'Leave': ASLeave,
    'Like': ASLike,
    'Listen': ASListen,
    'Move': ASMove,
    'Offer': ASOffer,
    'Question': ASQuestion,
    'Reject': ASReject,
    'Read': ASRead,
    'Remove': ASRemove,
    'TentativeReject': ASTentativeReject,
    'TentativeAccept': ASTentativeAccept,
    'Travel': ASTravel,
    'Undo': ASUndo,
    'Update': ASUpdate,
    'View': ASView,
    // Actor Types
    'Application': ASApplication,
    'Group': ASGroup,
    'Organization': ASOrganization,
    'Person': ASPerson,
    'Service': ASService,
    // Object Types
    'Article': ASArticle,
    'Audio': ASAudio,
    'Document': ASDocument,
    'Event': ASEvent,
    'Image': ASImage,
    'Note': ASNote,
    'Page': ASPage,
    'Place': ASPlace,
    'Profile': ASProfile,
    'Relationship': ASRelationship,
    'Tombstone': ASTombstone,
    'Video': ASVideo,
    // Link Types
    'Mention': ASMention,
  },
  // Add additionnal types
  addType: function(name, type) {
    Fetcher._type_from_name[name] = type
  },
  // Build an object of the right type from its json representation
  fromJson: function(raw) {
    const result = Fetcher._type_from_name[raw.type] ? new (Fetcher._type_from_name[raw.type])() : new ASBase()
    result.fromJson(raw)
    return result
  }
}

// ASBase prototype
ASBase.prototype = {
  // Raw representation of the element
  _raw: undefined,
  // Description of the properties
  // Array of properties that do not need to be fetched
  // Those are directly copied from/to raw into the object
  // This array should be overwritten when inheriting prototypes (by completing it)
  _alwaysAvailable: ['id', 'type'],
  // Array of properties that may need to be fetched
  // Those need an additional fetch from raw, and special handling when converting back to raw
  // This array should be overwritten when inheriting prototypes (by completing it)
  _mayNeedFetch: [ /*empty*/ ],
  // Properties
  id: undefined, // Id of element
  type: undefined, // Type of element
  // Methods
  // Load from a Json representation
  fromJson: function(raw) {
    this._raw = raw
    // copy everything expected from raw
    this._alwaysAvailable.map(function(elem) {
      this[elem] = raw[elem]
    }.bind(this))
    // Copy everything expected from raw, fetchAttribute should be used to retrieve the values when needed
    this._mayNeedFetch.map(function(elem) {
      this[elem] = raw[elem]
    }.bind(this))
  },
  // Convert to Json representation
  updateRaw: function() {
    this._raw = {}
    // Copy everything of _alwaysAvailable into raw
    this._alwaysAvailable.map(function(elem) {
      this._raw[elem] = this[elem]
    }.bind(this))
    // Use getAttributeRawValue for everything of _mayNeedFetch
    this._mayNeedFetch.map(function(elem) {
      this._raw[elem] = this.getAttributeRawValue(this[elem])
    }.bind(this))
  },
  // Utilitary function to use for updating raw data
  // Returns either:
  // - val.id if it exists
  // - val._raw if val.updateRaw exists, after a call to val.updateRaw()
  // - val in other cases
  getAttributeRawValue: function(val) {
    if (val && val.id) {
      return val.id
    } else if (val && val.updateRaw) {
      val.updateRaw()
      return val._raw
    } else {
      return val
    }
  },
  // For fetching properties
  // Fetch a property
  // After fromJson has been called, the attributes may not be yet in a usable format, notably those which can be objects
  // This method fetch and convert an attribute in a usable format
  // Callback signature is function(load_ok, failure_message)
  // Note: done this way to avoid fetching all resources in fromJson, but only when they are needed
  fetchAttribute: function(attribute_name, token, callback) {
    const attribute_value = this[attribute_name]
    if (this._alwaysAvailable.includes(attribute_name)) {
      // Those attributes are always available in a usable format, no need to fetch
      callback(true, undefined)
    } else if (!this._mayNeedFetch.includes(attribute_name)) {
      // Invalid call: the asked attribute cannot be fetched
      callback(false, 'Invalid argument to fetchAttribute: ' + attribute_name + ' cannot be fetched.')
    } else if ((typeof attribute_value === undefined) || (typeof attribute_value === null)) {
      // Nothing to do
      callback(true, undefined)
    } else if (Array.isArray(attribute_value)) {
      // Attribute is an array of elements. Each element should be converted.
      this._fetchAndConvertAllAttributeValue(attribute_value.values(), token, function(load_ok, fetched_value, failure_message) {
        // Update value of attribute
        this[attribute_name] = fetched_value
        callback(load_ok, failure_message)
      }.bind(this))
    } else if ((typeof attribute_value === 'object') && (attribute_value._raw !== undefined)) {
      // Attribute has already been fetched
      callback(true, undefined)
    } else {
      // Convertion needed
      this._fetchAndConvertAttributeValue(attribute_value, token, function(load_ok, fetched_value, failure_message) {
        // Update value of attribute
        this[attribute_name] = fetched_value
        callback(load_ok, failure_message)
      }.bind(this))
    }
  },
  // Fetch all elements of an array iterator to populate a result array
  // Callback signature is function(load_ok, fetched_value, failure_message)
  _fetchAndConvertAllAttributeValue: function(iter, token, callback, ret_value, previous_errors) {
    const next = iter.next()
    if (next.done) {
      callback(true, ret_value, (previous_errors === '') ? undefined : previous_errors)
    } else {
      this._fetchAndConvertAttributeValue(next.value, token, function(load_ok, fetched_value, failure_message) {
        var values = ret_value ? ret_value : []
        const msg_errors = (previous_errors ? previous_errors : '') + (load_ok ? '' : '<br/>' + failure_message)
        if (load_ok) {
          values.push(fetched_value)
        } else {
          // Don't stop at first error, but cumulate error messages
          console.log(failure_message)
        }
        // Next
        this._fetchAndConvertAllAttributeValue(iter, token, callback, values, msg_errors)
      }.bind(this))
    }
  },
  // Fetch an attribute value
  // Callback signature is function(load_ok, fetched_value, failure_message)
  _fetchAndConvertAttributeValue: function(attribute_value, token, callback) {
    if ((attribute_value === undefined) || (attribute_value === null)) {
      // attribute is not present, return it as is
      callback(true, attribute_value, undefined)
    } else if (typeof attribute_value === 'object') {
      // In object format already, as a Json value,
      // use Fetcher.fromJson
      callback(true, Fetcher.fromJson(attribute_value), undefined)
    } else if (typeof attribute_value === 'string') {
      // Link => fetch value
      Fetcher.get(attribute_value, token, function(load_ok, obj, failure_message) {
        if (load_ok) {
          callback(true, obj, undefined)
        } else {
          callback(false, undefined, failure_message)
        }
      })
    } else {
      // Should not happen
      console.log(attribute_value)
      callback(false, undefined, 'Unexpected type of attribute.')
    }
  },
  // Fetch several attributes at the same time
  // Callback signature is function(load_ok, failure_message)
  fetchAttributeList: function (attribute_lst, token, callback) {
    this._fetchAttributeListIter(attribute_lst.values(), token, callback, undefined)
  },
  //
  _fetchAttributeListIter: function (attribute_lst, token, callback, previous_errors) {
    const next = attribute_lst.next()
    if (next.done) {
      callback(true, (previous_errors === '') ? undefined : previous_errors)
    } else {
      this.fetchAttribute(next.value, token, function(load_ok, failure_message) {
        const msg_errors = (previous_errors ? previous_errors : '') + (load_ok ? '' : '<br/>' + failure_message)
        if (!load_ok) {
          // Don't stop at first error, but cumulate error messages
          console.log(failure_message)
        }
        // Next
        this._fetchAttributeListIter(attribute_lst, token, callback, msg_errors)
      }.bind(this))
    }
  }
}

// ASObject prototype
ASObject.prototype = Object.create(ASBase.prototype)
Object.assign(ASObject.prototype,
  {
    // Attributes
    attachment: undefined,
    attributedTo: undefined,
    audience: undefined,
    content: undefined,
    context: undefined,
    name: undefined,
    endTime: undefined,
    generator: undefined,
    icon: undefined,
    image: undefined,
    inReplyTo: undefined,
    location: undefined,
    preview: undefined,
    published: undefined,
    replies: undefined,
    startTime: undefined,
    summary: undefined,
    tag: undefined,
    updated: undefined,
    url: undefined,
    to: undefined,
    bto: undefined,
    cc: undefined,
    bcc: undefined,
    mediaType: undefined,
    duration: undefined,
    // defined in ActivityPub
    source: undefined,
    likes: undefined,
    shares: undefined,
    // Array of properties that do not need to be fetched
    // This array should be overwritten when inheriting prototypes (by completing it)
    _alwaysAvailable: ASBase.prototype._alwaysAvailable.concat([
      'content', 'name', 'endTime', 'published', 'startTime', 'summary', 'updated', 'url',
      'mediaType', 'duration',
    ]),
    // Array of properties that may need to be fetched
    // This array should be overwritten when inheriting prototypes (by completing it)
    _mayNeedFetch: ASBase.prototype._mayNeedFetch.concat([
      'attachment', 'attributedTo', 'audience', 'context', 'generator', 'icon', 'image', 'inReplyTo',
      'location', 'preview', 'replies', 'tag', 'to', 'bto', 'cc', 'bcc', 'source', 'likes', 'shares'
    ]),
  })
ASObject.prototype.constructor = ASObject

// ASLink prototype
ASLink.prototype = Object.create(ASBase.prototype)
Object.assign(ASLink.prototype,
  {
    // Attributes
    href: undefined,
    rel: undefined,
    mediaType: undefined,
    name: undefined,
    hreflang: undefined,
    height: undefined,
    width: undefined,
    preview: undefined,
    // Array of properties that do not need to be fetched
    // This array should be overwritten when inheriting prototypes (by completing it)
    _alwaysAvailable: ASBase.prototype._alwaysAvailable.concat([
      'href', 'rel', 'mediaType', 'name', 'hreflang', 'height', 'width',
    ]),
    // Array of properties that may need to be fetched
    // This array should be overwritten when inheriting prototypes (by completing it)
    _mayNeedFetch: ASBase.prototype._mayNeedFetch.concat([
      'preview',
    ]),
  })
ASLink.prototype.constructor = ASLink

// ASActivity prototype
ASActivity.prototype = Object.create(ASObject.prototype)
Object.assign(ASActivity.prototype,
  {
    // Attributes
    actor: undefined,
    object: undefined,
    target: undefined,
    result: undefined,
    origin: undefined,
    instrument: undefined,
    // Array of properties that do not need to be fetched
    // This array should be overwritten when inheriting prototypes (by completing it)
    _alwaysAvailable: ASObject.prototype._alwaysAvailable.concat([
    ]),
    // Array of properties that may need to be fetched
    // This array should be overwritten when inheriting prototypes (by completing it)
    _mayNeedFetch: ASObject.prototype._mayNeedFetch.concat([
      'actor', 'object', 'target', 'result', 'origin', 'instrument',
    ]),
  })
ASActivity.prototype.constructor = ASActivity

// ASIntransitiveActivity prototype
// Note: the object field is not removed from ASActivity
ASIntransitiveActivity.prototype = Object.create(ASActivity.prototype)
ASIntransitiveActivity.prototype.constructor = ASIntransitiveActivity

// ASCollection prototype
ASCollection.prototype = Object.create(ASObject.prototype)
Object.assign(ASCollection.prototype,
  {
    // Attributes
    totalItems: undefined,
    current: undefined,
    first: undefined,
    last: undefined,
    items: undefined,
    // Array of properties that do not need to be fetched
    // This array should be overwritten when inheriting prototypes (by completing it)
    _alwaysAvailable: ASObject.prototype._alwaysAvailable.concat([
      'totalItems',
    ]),
    // Array of properties that may need to be fetched
    // This array should be overwritten when inheriting prototypes (by completing it)
    _mayNeedFetch: ASObject.prototype._mayNeedFetch.concat([
      'current', 'first', 'last', 'items',
    ]),
  })
ASCollection.prototype.constructor = ASCollection

// ASOrderedCollection prototype
ASOrderedCollection.prototype = Object.create(ASCollection.prototype)
ASOrderedCollection.prototype.constructor = ASOrderedCollection

// ASCollectionPage prototype
ASCollectionPage.prototype = Object.create(ASCollection.prototype)
Object.assign(ASCollectionPage.prototype,
  {
    // Attributes
    partOf: undefined,
    next: undefined,
    prev: undefined,
    // Array of properties that do not need to be fetched
    // This array should be overwritten when inheriting prototypes (by completing it)
    _alwaysAvailable: ASCollection.prototype._alwaysAvailable.concat([
    ]),
    // Array of properties that may need to be fetched
    // This array should be overwritten when inheriting prototypes (by completing it)
    _mayNeedFetch: ASCollection.prototype._mayNeedFetch.concat([
      'partOf', 'next', 'prev',
    ]),
  })
ASCollectionPage.prototype.constructor = ASCollectionPage

// ASOrderedCollectionPage prototype
// Specification says that it inherits from both ASCollectionPage and ASOrderedCollection,
// but ASOrderedCollection does not defines more fields than ASCollection,
// so we only inherit from ASCollectionPage, which already inherits from ASCollection
ASOrderedCollectionPage.prototype = Object.create(ASCollectionPage.prototype)
Object.assign(ASOrderedCollectionPage.prototype,
  {
    // Attributes
    startIndex: undefined,
    // Array of properties that do not need to be fetched
    // This array should be overwritten when inheriting prototypes (by completing it)
    _alwaysAvailable: ASCollectionPage.prototype._alwaysAvailable.concat([
      'startIndex',
    ]),
    // Array of properties that may need to be fetched
    // This array should be overwritten when inheriting prototypes (by completing it)
    _mayNeedFetch: ASCollectionPage.prototype._mayNeedFetch.concat([
    ]),
  })
ASOrderedCollectionPage.prototype.constructor = ASOrderedCollectionPage

// ASActor
// Defined from the ActivityPub spec, which adds fields to actor types
ASActor.prototype = Object.create(ASObject.prototype)
Object.assign(ASActor.prototype,
  {
    // Attributes
    inbox: undefined,
    outbox: undefined,
    following: undefined,
    followers: undefined,
    liked: undefined,
    streams: undefined,
    preferredUsername: undefined,
    endpoints: undefined,
    // Array of properties that do not need to be fetched
    // This array should be overwritten when inheriting prototypes (by completing it)
    _alwaysAvailable: ASObject.prototype._alwaysAvailable.concat([
      'preferredUsername', 'endpoints',
      // Note: endpoints should be in the _mayNeedFetch, but it is usually not represented with a vocabulary object, so no type associated
      // However, in the observed implementations, this structure is always provided in the actor
    ]),
    // Array of properties that may need to be fetched
    // This array should be overwritten when inheriting prototypes (by completing it)
    _mayNeedFetch: ASObject.prototype._mayNeedFetch.concat([
      'inbox', 'outbox', 'following', 'followers', 'liked', 'streams',
    ]),
  })
ASActor.prototype.constructor = ASActor

// Extended Types
// Activity Types

// ASAccept prototype
ASAccept.prototype = Object.create(ASActivity.prototype)
ASAccept.prototype.constructor = ASAccept

// ASTentativeAccept prototype
ASTentativeAccept.prototype = Object.create(ASAccept.prototype)
ASAccept.prototype.constructor = ASAccept

// ASAdd prototype
ASAdd.prototype = Object.create(ASActivity.prototype)
ASAdd.prototype.constructor = ASAdd

// ASArrive prototype
ASArrive.prototype = Object.create(ASIntransitiveActivity.prototype)
ASArrive.prototype.constructor = ASArrive

// ASCreate prototype
ASCreate.prototype = Object.create(ASActivity.prototype)
ASCreate.prototype.constructor = ASCreate

// ASDelete prototype
ASDelete.prototype = Object.create(ASActivity.prototype)
ASDelete.prototype.constructor = ASDelete

// ASFollow prototype
ASFollow.prototype = Object.create(ASActivity.prototype)
ASFollow.prototype.constructor = ASFollow

// ASIgnore prototype
ASIgnore.prototype = Object.create(ASActivity.prototype)
ASIgnore.prototype.constructor = ASIgnore

// ASJoin prototype
ASJoin.prototype = Object.create(ASActivity.prototype)
ASJoin.prototype.constructor = ASJoin

// ASLeave prototype
ASLeave.prototype = Object.create(ASActivity.prototype)
ASLeave.prototype.constructor = ASLeave

// ASLike prototype
ASLike.prototype = Object.create(ASActivity.prototype)
ASLike.prototype.constructor = ASLike

// ASOffer prototype
ASOffer.prototype = Object.create(ASActivity.prototype)
ASOffer.prototype.constructor = ASOffer

// ASInvite prototype
ASInvite.prototype = Object.create(ASOffer.prototype)
ASInvite.prototype.constructor = ASInvite

// ASReject prototype
ASReject.prototype = Object.create(ASActivity.prototype)
ASReject.prototype.constructor = ASReject

// ASTentativeReject prototype
ASTentativeReject.prototype = Object.create(ASReject.prototype)
ASTentativeReject.prototype.constructor = ASTentativeReject

// ASRemove prototype
ASRemove.prototype = Object.create(ASActivity.prototype)
ASRemove.prototype.constructor = ASRemove

// ASUndo prototype
ASUndo.prototype = Object.create(ASActivity.prototype)
ASUndo.prototype.constructor = ASUndo

// ASUpdate prototype
ASUpdate.prototype = Object.create(ASActivity.prototype)
ASUpdate.prototype.constructor = ASUpdate

// ASView prototype
ASView.prototype = Object.create(ASActivity.prototype)
ASView.prototype.constructor = ASView

// ASListen prototype
ASListen.prototype = Object.create(ASActivity.prototype)
ASListen.prototype.constructor = ASListen

// ASRead prototype
ASRead.prototype = Object.create(ASActivity.prototype)
ASRead.prototype.constructor = ASRead

// ASMove prototype
ASMove.prototype = Object.create(ASActivity.prototype)
ASMove.prototype.constructor = ASMove

// ASTravel prototype
ASTravel.prototype = Object.create(ASIntransitiveActivity.prototype)
ASTravel.prototype.constructor = ASTravel

// ASAnnounce prototype
ASAnnounce.prototype = Object.create(ASActivity.prototype)
ASAnnounce.prototype.constructor = ASAnnounce

// ASBlock prototype
ASBlock.prototype = Object.create(ASIgnore.prototype)
ASBlock.prototype.constructor = ASBlock

// ASFlag prototype
ASFlag.prototype = Object.create(ASActivity.prototype)
ASFlag.prototype.constructor = ASFlag

// ASDislike prototype
ASDislike.prototype = Object.create(ASActivity.prototype)
ASDislike.prototype.constructor = ASDislike

// ASQuestion prototype
ASQuestion.prototype = Object.create(ASIntransitiveActivity.prototype)
Object.assign(ASQuestion.prototype,
  {
    // Attributes
    oneOf: undefined,
    anyOf: undefined,
    closed: undefined,
    // Array of properties that do not need to be fetched
    // This array should be overwritten when inheriting prototypes (by completing it)
    _alwaysAvailable: ASIntransitiveActivity.prototype._alwaysAvailable.concat([
      'closed',
    ]),
    // Array of properties that may need to be fetched
    // This array should be overwritten when inheriting prototypes (by completing it)
    _mayNeedFetch: ASIntransitiveActivity.prototype._mayNeedFetch.concat([
      'oneOf', 'anyOf',
    ]),
  })
ASQuestion.prototype.constructor = ASQuestion

// Actor Types
// ASApplication prototype
ASApplication.prototype = Object.create(ASActor.prototype)
ASApplication.prototype.constructor = ASApplication

// ASGroup prototype
ASGroup.prototype = Object.create(ASActor.prototype)
ASGroup.prototype.constructor = ASGroup

// ASOrganization prototype
ASOrganization.prototype = Object.create(ASActor.prototype)
ASOrganization.prototype.constructor = ASOrganization

// ASPerson prototype
ASPerson.prototype = Object.create(ASActor.prototype)
ASPerson.prototype.constructor = ASPerson

// ASService prototype
ASService.prototype = Object.create(ASActor.prototype)
ASService.prototype.constructor = ASService

// ASRelationship prototype
ASRelationship.prototype = Object.create(ASObject.prototype)
Object.assign(ASRelationship.prototype,
  {
    // Attributes
    subject: undefined,
    object: undefined,
    relationship: undefined,
    // Array of properties that do not need to be fetched
    // This array should be overwritten when inheriting prototypes (by completing it)
    _alwaysAvailable: ASObject.prototype._alwaysAvailable.concat([
    ]),
    // Array of properties that may need to be fetched
    // This array should be overwritten when inheriting prototypes (by completing it)
    _mayNeedFetch: ASObject.prototype._mayNeedFetch.concat([
      'subject', 'object', 'relationship',
    ]),
  })
ASRelationship.prototype.constructor = ASRelationship

// ASArticle prototype
ASArticle.prototype = Object.create(ASObject.prototype)
ASArticle.prototype.constructor = ASArticle

// ASDocument prototype
ASDocument.prototype = Object.create(ASObject.prototype)
ASDocument.prototype.constructor = ASDocument

// ASAudio prototype
ASAudio.prototype = Object.create(ASDocument.prototype)
ASAudio.prototype.constructor = ASAudio

// ASImage prototype
ASImage.prototype = Object.create(ASDocument.prototype)
ASImage.prototype.constructor = ASImage

// ASVideo prototype
ASVideo.prototype = Object.create(ASDocument.prototype)
ASVideo.prototype.constructor = ASVideo

// ASNote prototype
ASNote.prototype = Object.create(ASObject.prototype)
ASNote.prototype.constructor = ASNote

// ASPage prototype
ASPage.prototype = Object.create(ASDocument.prototype)
ASPage.prototype.constructor = ASPage

// ASEvent prototype
ASEvent.prototype = Object.create(ASObject.prototype)
ASEvent.prototype.constructor = ASEvent

// ASPlace prototype
ASPlace.prototype = Object.create(ASObject.prototype)
Object.assign(ASPlace.prototype,
  {
    // Attributes
    accuracy: undefined,
    altitude: undefined,
    latitude: undefined,
    longitude: undefined,
    radius: undefined,
    units: undefined,
    // Array of properties that do not need to be fetched
    // This array should be overwritten when inheriting prototypes (by completing it)
    _alwaysAvailable: ASObject.prototype._alwaysAvailable.concat([
      'accuracy', 'altitude', 'latitude', 'longitude',
      'radius', 'units',
    ]),
    // Array of properties that may need to be fetched
    // This array should be overwritten when inheriting prototypes (by completing it)
    _mayNeedFetch: ASObject.prototype._mayNeedFetch.concat([
    ]),
  })
ASPlace.prototype.constructor = ASPlace

// ASProfile prototype
ASProfile.prototype = Object.create(ASObject.prototype)
Object.assign(ASProfile.prototype,
  {
    // Attributes
    describes: undefined,
    // Array of properties that do not need to be fetched
    // This array should be overwritten when inheriting prototypes (by completing it)
    _alwaysAvailable: ASObject.prototype._alwaysAvailable.concat([
    ]),
    // Array of properties that may need to be fetched
    // This array should be overwritten when inheriting prototypes (by completing it)
    _mayNeedFetch: ASObject.prototype._mayNeedFetch.concat([
      'describes'
    ]),
  })
ASProfile.prototype.constructor = ASProfile

// ASTombstone prototype
ASTombstone.prototype = Object.create(ASObject.prototype)
Object.assign(ASTombstone.prototype,
  {
    // Attributes
    formerType: undefined,
    deleted: undefined,
    // Array of properties that do not need to be fetched
    // This array should be overwritten when inheriting prototypes (by completing it)
    _alwaysAvailable: ASObject.prototype._alwaysAvailable.concat([
      'formerType', 'deleted',
    ]),
    // Array of properties that may need to be fetched
    // This array should be overwritten when inheriting prototypes (by completing it)
    _mayNeedFetch: ASObject.prototype._mayNeedFetch.concat([
    ]),
  })
ASTombstone.prototype.constructor = ASTombstone

// Link Types
// ASMention prototype
ASMention.prototype = Object.create(ASLink.prototype)
ASMention.prototype.constructor = ASMention

////
// Exported structures
// Fetcher
exports.Fetcher = Fetcher
// Core types
exports.ASObject = ASObject
exports.ASLink = ASLink
exports.ASActivity = ASActivity
exports.ASIntransitiveActivity = ASIntransitiveActivity
exports.ASCollection = ASCollection
exports.ASOrderedCollection = ASOrderedCollection
exports.ASCollectionPage = ASCollectionPage
exports.ASOrderedCollectionPage = ASOrderedCollectionPage
exports.ASActor = ASActor
// Activity types
exports.ASAccept = ASAccept
exports.ASAdd = ASAdd
exports.ASAnnounce = ASAnnounce
exports.ASArrive = ASArrive
exports.ASBlock = ASBlock
exports.ASCreate = ASCreate
exports.ASDelete = ASDelete
exports.ASDislike = ASDislike
exports.ASFlag = ASFlag
exports.ASFollow = ASFollow
exports.ASIgnore = ASIgnore
exports.ASInvite = ASInvite
exports.ASJoin = ASJoin
exports.ASLeave = ASLeave
exports.ASLike = ASLike
exports.ASListen = ASListen
exports.ASMove = ASMove
exports.ASOffer = ASOffer
exports.ASQuestion = ASQuestion
exports.ASReject = ASReject
exports.ASRead = ASRead
exports.ASRemove = ASRemove
exports.ASTentativeReject = ASTentativeReject
exports.ASTentativeAccept = ASTentativeAccept
exports.ASTravel = ASTravel
exports.ASUpdate = ASUpdate
exports.ASView = ASView
// Actor types
exports.ASApplication = ASApplication
exports.ASGroup = ASGroup
exports.ASOrganization = ASOrganization
exports.ASPerson = ASPerson
exports.ASService = ASService
// Object types
exports.ASArticle = ASArticle
exports.ASAudio = ASAudio
exports.ASDocument = ASDocument
exports.ASImage = ASImage
exports.ASNote = ASNote
exports.ASPage = ASPage
exports.ASPlace = ASPlace
exports.ASProfile = ASProfile
exports.ASRelationship = ASRelationship
exports.ASTombstone = ASTombstone
exports.ASVideo = ASVideo
// Link types
exports.ASMention = ASMention
