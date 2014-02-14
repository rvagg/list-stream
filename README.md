# ListStream

[![Build Status](https://secure.travis-ci.org/rvagg/list-stream.png)](http://travis-ci.org/rvagg/list-stream)

**Collect chunks / objects from a readable stream, write obejcts / chunks to a writable stream**

[![NPM](https://nodei.co/npm/list-stream.svg)](https://nodei.co/npm/list-stream/)

Built on a [DuplexStream](http://nodejs.org/docs/latest/api/stream.html#stream_class_stream_duplex), **ListStream** can collect the chunks as they come in so you can use them later as an array, or pipe them on to another stream.

Using the same callback style as **[bl](https://github.com/rvagg/bl)** and a similar style to **[concat-stream](https://github.com/maxogden/concat-stream)**, you can use **ListStream** as a terminal stream collecting the chunks or objects for use once the stream has ended. This is particularly helpful for object streams where each chunk is a discrete object.

```js
var ListStream = require('list-stream')
  , db = require('level')('/path/to/db', { valueEncoding: 'json' }) // stream from LevelDB!

db.createValueStream().pipe(ListStream.obj(function (err, data) {
  if (err)
    throw err

  console.log('Values in the database:')
  // `data` is an array of objects from the database, serialised from JSON strings
  data.forEach(function (value, i) {
    console.log(i, JSON.stringify(value))
  })
}))
```

Or emulate `fs.readFile()`:

```js
var ListStream = require('list-stream')
  , fs = require('fs')

fs.createReadStream('/path/to/file.dat').pipe(ListStream(function (err, data) {
  if (err)
    throw err

  console.log('Contents of /path/to/file.dat:')
  // `data` is an array of Buffer objects
  console.log(Buffer.concat(data).toString('utf8'))
}))
```

*See [bl](https://github.com/rvagg/bl) for nicer Buffer stream handling*

Or use as a store to stream from later

```js
var list = require('list-stream').obj()
  , db = require('level')('/path/to/db')

list.write({ key: 'name', value: 'Yuri Irsenovich Kim' })
list.write({ key: 'dob', value: '16 February 1941' })
list.write({ key: 'spouse', value: 'Kim Young-sook' })
list.write({ key: 'occupation', value: 'Clown' })

list.pipe(db.createWriteStream()) // write all of the stored entries to a database
```

## API

  * <a href="#ctor"><code><b>[new ]ListStream([ options, ][ callback ])</b></code></a>
  * <a href="#obj"><code><b>ListStream.obj([ options, ][ callback ])</b></code></a>
  * <a href="#length"><code>listStream.<b>length</b></code></a>
  * <a href="#append"><code>listStream.<b>append(obj)</b></code></a>
  * <a href="#get"><code>listStream.<b>get(index)</b></code></a>
  * <a href="#end"><code>listStream.<b>end()</b></code></a>
  * <a href="#duplicate"><code>listStream.<b>duplicate()</b></code></a>


--------------------------------------------------------
<a name="ctor"></a>
### [new ]ListStream([ options, ][ callback ])

Create a new **ListStream** with the given `options` which will be passed up to the parent `DuplexStream`.

The optional `callback` will be called when the stream reaches an *end* event. You will receive both an `error` argument and a `data` argument where the `error` will come off `'error'` events emitted by any piped stream and the `data` will be an **`Array`** of chunks or objects fed in to the stream.

--------------------------------------------------------
<a name="obj"></a>
### ListStream.obj([ options, ][ callback ])

Same as the standard constructor but shorthand for `new ListStream({ objectMode:true }, callback)`.

Use this for when you're not dealing with `Buffer`s or `String`s in your streams.

--------------------------------------------------------
<a name="length"></a>
### listStream.length

The number of chunks currently being held. (Not available in pre-ES5 environments as it uses a *getter*)

--------------------------------------------------------
<a name="append"></a>
### listStream.append(obj)

Append a chunk / object to the list.

--------------------------------------------------------
<a name="get"></a>
### listStream.get(index)

Get the chunk / object from the list at index `index`.

--------------------------------------------------------
<a name="get"></a>
### listStream.end()

End the stream. A standard *WritableStream* method, can be used when piping to another stream:

```js
listStream.pipe(fs.createWriteStream(os.tmpDir() + '/randombytes.dat'))

for (var i = 0; i < 100)
  listStream.append(crypto.randomBytes(32))

listStream.end()
```

--------------------------------------------------------
<a name="duplicate"></a>
### listStream.duplicate()

Create a full duplicate of this `ListStream`. Each item in the list will be `.append()`ed to the new copy. The copy will be returned.


## License

**ListStream** is Copyright (c) 2014 Rod Vagg [@rvagg](https://twitter.com/rvagg) and licenced under the MIT licence. All rights not explicitly granted in the MIT license are reserved. See the included LICENSE file for more details.
