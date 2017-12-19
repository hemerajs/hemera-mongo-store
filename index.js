'use strict'

const Hp = require('hemera-plugin')
const Mongodb = require('mongodb')
const ObjectID = Mongodb.ObjectID
const MongoStore = require('./store')
const StorePattern = require('hemera-store/pattern')
const serialize = require('mongodb-extended-json').serialize
const deserialize = require('mongodb-extended-json').deserialize

function hemeraMongoStore(hemera, opts, done) {
  let topic = 'mongo-store'

  const preResponseHandler = result => {
    if (opts.serializeResult === true) {
      return serialize(result)
    }
    return result
  }

  Mongodb.MongoClient.connect(opts.mongo.url, opts.mongos.options, function(
    err,
    db
  ) {
    if (err) {
      done(err)
      return
    }

    // from mongodb driver
    const dbName = db.databaseName

    if (opts.useDbAsTopicSuffix) {
      topic = `mongo-store.${dbName}`
    }

    hemera.decorate('mongodb', {
      client: Mongodb,
      db
    })

    // Gracefully shutdown
    hemera.ext('onClose', (ctx, done) => {
      hemera.log.debug('Mongodb connection closed!')
      db.close(done)
    })

    hemera.add(
      {
        topic,
        cmd: 'dropCollection'
      },
      function(req) {
        const collection = db.collection(req.collection)
        return collection.drop()
      }
    )

    hemera.add(StorePattern.create(topic), function(req) {
      const collection = db.collection(req.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID
      req.data = deserialize(req.data)

      return store.create(req)
    })

    hemera.add(StorePattern.update(topic), function(req) {
      const collection = db.collection(req.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID
      req.query = deserialize(req.query)

      return store
        .update(req, deserialize(req.data))
        .then(resp => resp.value)
        .then(preResponseHandler)
    })

    hemera.add(StorePattern.updateById(topic), function(req) {
      const collection = db.collection(req.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID

      return store
        .updateById(req, deserialize(req.data))
        .then(resp => resp.value)
        .then(preResponseHandler)
    })

    hemera.add(StorePattern.remove(topic), function(req) {
      const collection = db.collection(req.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID
      req.query = deserialize(req.query)

      return store.remove(req)
    })

    hemera.add(StorePattern.removeById(topic), function(req) {
      const collection = db.collection(req.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID

      return store
        .removeById(req)
        .then(resp => resp.value)
        .then(preResponseHandler)
    })

    hemera.add(StorePattern.replace(topic), function(req) {
      const collection = db.collection(req.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID
      req.query = deserialize(req.query)

      return store.replace(req, deserialize(req.data))
    })

    hemera.add(StorePattern.replaceById(topic), function(req) {
      const collection = db.collection(req.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID

      return store
        .replaceById(req, deserialize(req.data))
        .then(resp => resp.value)
        .then(preResponseHandler)
    })

    hemera.add(StorePattern.findById(topic), function(req) {
      const collection = db.collection(req.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID

      return store.findById(req).then(preResponseHandler)
    })

    hemera.add(StorePattern.find(topic), function(req) {
      const collection = db.collection(req.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID
      req.query = deserialize(req.query)

      return store.find(req, req.options).then(preResponseHandler)
    })

    hemera.add(StorePattern.count(topic), function(req) {
      const collection = db.collection(req.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID
      req.query = deserialize(req.query)

      return store.count(req, req.options).then(preResponseHandler)
    })

    hemera.log.debug('DB connected!')
    done()
  })
}

const plugin = Hp(hemeraMongoStore, '>=3.0.0')
plugin[Symbol.for('name')] = require('./package.json').name
plugin[Symbol.for('options')] = {
  payloadValidator: 'hemera-joi',
  mongos: {},
  serializeResult: false,
  mongo: {
    url: 'mongodb://localhost:27017/'
  },
  store: {
    replace: { upsert: true }
  }
}
plugin[Symbol.for('dependencies')] = ['hemera-joi']
module.exports = plugin
