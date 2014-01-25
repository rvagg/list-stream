var test       = require('tape')
  , xtend      = require('xtend')
  , fs         = require('fs')
  , os         = require('os')
  , path       = require('path')
  , through2   = require('through2')
  , crypto     = require('crypto')
  , ListStream = require('./')

test('collect list of objects from write()s', function (t) {
  var expectedObjects = [
      'foo'
    , 'bar'
    , { obj: true }
    , [ 1, 2, 3 ]
  ]

  var ls = ListStream.obj(function (err, data) {
    t.notOk(err, 'no error')
    t.deepEqual(data, xtend(expectedObjects), 'got expected objects')
    t.end()
  })

  expectedObjects.forEach(function (o) {
    ls.write(o)
  })
  ls.end()
})

test('collect list of objects from pipe()', function (t) {
  var expectedObjects = [
      'foo'
    , 'bar'
    , { obj: true }
    , [ 1, 2, 3 ]
  ]

  var ls = ListStream.obj(function (err, data) {
    t.notOk(err, 'no error')
    t.deepEqual(data, xtend(expectedObjects), 'got expected objects')
    t.end()
  })

  var t2 = through2.obj()
  t2.pipe(ls)

  expectedObjects.forEach(function (o) {
    t2.write(o)
  })
  t2.end()
})


test('collects buffers from binary stream', function (t) {
  var expected = Array.apply(null, Array(20)).map(function () { return crypto.randomBytes(32) })
    , ls       = ListStream(verify)
    , t2       = through2()

  t2.pipe(ls)

  expected.forEach(function (b) {
    t2.write(b)
  })
  t2.end()

  function verify (err, data) {
    t.notOk(err, 'no error')
    t.equal(data.length, expected.length, 'got expected number of buffers')
    for (var i = 0; i < data.length; i++) {
      t.ok(Buffer.isBuffer(data[i]), 'got buffer at #' + i)
      t.equal(data[i].toString('hex'), expected[i].toString('hex'), 'got same buffer value at #' + i)
    }
    t.end()
  }

})


test('duplexicity', function (t) {
  var expected = Array.apply(null, Array(20)).map(function () { return crypto.randomBytes(32) })
    , tmpfile  = path.join(os.tmpDir(), '_list-stream-test.' + process.pid)
    , t2       = through2()
    , ls       = new ListStream()

  t2.pipe(ls)

  expected.forEach(function (b) {
    t2.write(b)
  })
  t2.end()

  // need to delay this because if we start pulling from the ListStream too early
  // it won't have any data and will trigger an end (this.push(null))
  setTimeout(function () {
    t.equal(ls.length, expected.length, 'correct .length property')
    expected.forEach(function (d, i) {
      t.equal(ls.get(i).toString('hex'), expected[i].toString('hex'), 'got correct element with .get(' + i + ')')
    })

    ls.pipe(fs.createWriteStream(tmpfile)).on('close', verify)
  }, 100)

  function verify () {
    fs.readFile(tmpfile, function (err, data) {
      t.notOk(err, 'no error reading ' + tmpfile)
      t.equal(Buffer.concat(expected).toString('hex'), data.toString('hex'), 'got expected contents in file')
      t.end()
    })
  }
})