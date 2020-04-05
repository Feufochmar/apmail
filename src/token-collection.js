// A small object for getting the token when talking to a server
TokenCollection = {
  tokens: {},
  set: function (server, token) {
    TokenCollection.tokens[server] = token
  },
  get: function (url) {
    const server = url.replace('http://', '').replace('https://', '').split(/[/?#]/)[0]
    return TokenCollection.tokens[server]
  }
}

// Exported structures
exports.TokenCollection = TokenCollection
