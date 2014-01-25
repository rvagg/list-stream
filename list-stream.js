var DuplexStream = require('readable-stream').Duplex
  , util         = require('util')
  , xtend        = require('xtend')


function ListStream (options, callback) {
  if (!(this instanceof ListStream))
    return new ListStream(options, callback)

  if (typeof options == 'function') {
    callback = options
    options = {}
  }

  this._chunks = []
  Object.defineProperty && Object.defineProperty(
      this
    , 'length'
    , { enumerable: true, configurable: true, get: function () {
        return this._chunks.length
      }}
  )

  if (typeof callback == 'function') {
    this._callback = callback

    var piper = function (err) {
      if (this._callback) {
        this._callback(err)
        this._callback = null
      }
    }.bind(this)

    this.on('pipe', function (src) {
      src.on('error', piper)
    })
    this.on('unpipe', function (src) {
      src.removeListener('error', piper)
    })
  }

  DuplexStream.call(this, options)
}


util.inherits(ListStream, DuplexStream)


ListStream.prototype.append = function (obj) {
  this._chunks.push(obj)
  return this
}


ListStream.prototype.get = function (index) {
  return this._chunks[index]
}


ListStream.prototype._write = function (buf, encoding, callback) {
  this.append(buf)
  if (callback)
    callback()
}


ListStream.prototype._read = function () {
  if (!this._chunks.length)
    return this.push(null)
  this.push(this._chunks.shift())
}


ListStream.prototype.end = function (chunk) {
  DuplexStream.prototype.end.call(this, chunk)

  if (this._callback) {
    this._callback(null, this._chunks)
    this._callback = null
  }
}


ListStream.prototype.duplicate = function () {
  var i = 0
    , copy = new ListStream()

  for (; i < this._chunks.length; i++)
    copy.append(this._chunks[i])

  return copy
}


module.exports = ListStream
module.exports.obj = function (options, callback) {
  if (typeof options == 'function') {
    callback = options
    options = {}
  }
  return new ListStream(xtend({ objectMode: true }, options), callback)
}
