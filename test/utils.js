'use strict'

process.on('unhandledRejection', up => { throw up })

const Hemera = require('nats-hemera')
const HemeraMongoStore = require('./../index')
const HemeraJoi = require('hemera-joi')
const Nats = require('nats')
const HemeraTestsuite = require('hemera-testsuite')
const EJSON = require('mongodb-extended-json')
const expect = require('code').expect

function createExtendedData(mongodb, date) {
  const oid = new mongodb.ObjectID('58c6c65ed78c6a977a0041a8')
  return EJSON.serialize({
    date: date || new Date(),
    objectId: oid,
    ref: mongodb.DBRef('test', oid)
  })
}

function testExtendedData(plugin, testCollection, id, done) {
  plugin.db.collection(testCollection).findOne(
    {
      _id: new plugin.mongodb.ObjectID(id)
    },
    (err, doc) => {
      expect(err).to.be.null()
      testExtendedDoc(plugin, doc)
      done()
    }
  )
}

function testExtendedDoc(plugin, doc) {
  const ObjectID = plugin.mongodb.ObjectID
  const DBRef = plugin.mongodb.DBRef

  expect(doc.date).to.be.a.date()
  expect(doc.objectId).to.be.an.instanceof(ObjectID)
  expect(doc.ref).to.be.an.instanceof(DBRef)
}

function initServer(topic, testCollection, pluginOptions, cb) {
  let PORT = 6242
  var authUrl = 'nats://localhost:' + PORT

  const server = HemeraTestsuite.start_server(PORT, err => {
    if (err) {
      return cb(err)
    }
    const nats = Nats.connect(authUrl)
    const hemera = new Hemera(nats, {
      logLevel: 'warn'
    })
    hemera.use(HemeraMongoStore, pluginOptions)
    hemera.ready(err => {
      if (err) {
        return cb(err)
      }
      const plugin = {
        mongodb: hemera.mongodb.client,
        db: hemera.mongodb.db
      }
      hemera
        .act({
          topic,
          cmd: 'dropCollection',
          collection: testCollection
        })
        .then(() => {
          return hemera.act({
            topic,
            cmd: 'createCollection',
            collection: testCollection
          })
        })
        .catch(err => cb(err))
        .then(() => cb(null, { server, hemera, plugin }))
    })
  })
}

exports.initServer = initServer
exports.testExtendedData = testExtendedData
exports.createExtendedData = createExtendedData
exports.testExtendedDoc = testExtendedDoc
