'use strict'

const Store = require('hemera-store')

/**
 *
 *
 * @class MongoStore
 * @extends {Store}
 */
class MongoStore extends Store {
  /**
   * Creates an instance of MongoStore.
   *
   * @param {any} driver
   * @param {any} options
   *
   * @memberOf MongoStore
   */
  constructor(driver, options = {}) {
    options.mongo = {}
    super(driver, options)
  }

  /**
   *
   *
   * @param {any} req
   * @param {any} cb
   *
   * @memberOf MongoStore
   */
  create(req, cb) {
    if (req.data instanceof Array) {
      let op = null
      if (this.options.store.create) {
        op = this._driver.insertMany(req.data, this.options.store.create)
      } else {
        op = this._driver.insertMany(req.data)
      }
      return op.then(resp => {
        return {
          _ids: resp.insertedIds
        }
      })
    } else if (req.data instanceof Object) {
      let op = null
      if (this.options.store.create) {
        op = this._driver.insertOne(req.data, this.options.store.create)
      } else {
        op = this._driver.insertOne(req.data)
      }
      return op.then(resp => {
        return {
          _id: resp.insertedId.toString()
        }
      })
    }
  }

  /**
   *
   *
   * @param {any} req
   * @param {any} cb
   *
   * @memberOf MongoStore
   */
  remove(req, cb) {
    let op = null
    if (this.options.store.remove) {
      op = this._driver.deleteMany(req.query, this.options.store.remove)
    } else {
      op = this._driver.deleteMany(req.query)
    }

    return op.then(resp => {
      return {
        deletedCount: resp.deletedCount
      }
    })
  }

  /**
   *
   *
   * @param {any} req
   *
   * @memberOf MongoStore
   */
  removeById(req) {
    if (this.options.store.removeById) {
      return this._driver.findOneAndDelete(
        {
          _id: this.ObjectID(req.id)
        },
        this.options.store.removeById
      )
    }

    return this._driver.findOneAndDelete({
      _id: this.ObjectID(req.id)
    })
  }

  /**
   *
   *
   * @param {any} req
   * @param {any} data
   *
   * @memberOf MongoStore
   */
  update(req, data) {
    if (this.options.store.update) {
      return this._driver.findOneAndUpdate(
        req.query,
        data,
        this.options.store.update
      )
    }

    return this._driver.findOneAndUpdate(req.query, data)
  }

  /**
   *
   *
   * @param {any} req
   * @param {any} data
   *
   * @memberOf MongoStore
   */
  updateById(req, data) {
    if (this.options.store.updateById) {
      return this._driver.findOneAndUpdate(
        {
          _id: this.ObjectID(req.id)
        },
        data,
        this.options.store.updateById
      )
    }

    return this._driver.findOneAndUpdate(
      {
        _id: this.ObjectID(req.id)
      },
      data
    )
  }

  /**
   *
   *
   * @param {any} req
   *
   * @memberOf MongoStore
   */
  find(req, options) {
    let cursor = this._driver.find(req.query, this.options.store.find)

    if (options) {
      if (options.limit) {
        cursor = cursor.limit(options.limit)
      }
      if (options.offset) {
        cursor = cursor.skip(options.offset)
      }
      if (options.fields) {
        cursor = cursor.project(options.fields)
      }
      if (options.orderBy) {
        cursor = cursor.sort(options.orderBy)
      }
    }

    return cursor.toArray().then(resp => {
      const result = Object.assign(
        {
          result: resp
        },
        options
      )
      return result
    })
  }

  /**
   *
   *
   * @param {any} req
   *
   * @memberOf MongoStore
   */
  findById(req) {
    if (this.options.store.findById) {
      return this._driver.findOne(
        {
          _id: this.ObjectID(req.id)
        },
        this.options.store.findById
      )
    }

    return this._driver.findOne({
      _id: this.ObjectID(req.id)
    })
  }

  /**
   *
   *
   * @param {any} req
   *
   * @memberOf MongoStore
   */
  replace(req, data) {
    let op = null
    if (this.options.store.replace) {
      op = this._driver.updateMany(req.query, data, this.options.store.replace)
    } else {
      op = this._driver.updateMany(req.query, data)
    }

    return op.then(resp => {
      return {
        matchedCount: resp.matchedCount,
        modifiedCount: resp.modifiedCount,
        upsertedCount: resp.upsertedCount,
        upsertedId: resp.upsertedId
      }
    })
  }

  /**
   *
   *
   * @param {any} req
   * @param {any} data
   * @returns
   * @memberof MongoStore
   */
  replaceById(req, data) {
    if (this.options.store.replaceById) {
      return this._driver.findOneAndReplace(
        {
          _id: this.ObjectID(req.id)
        },
        data,
        this.options.store.replaceById
      )
    }

    return this._driver.findOneAndReplace(
      {
        _id: this.ObjectID(req.id)
      },
      data
    )
  }
  /**
   *
   *
   * @param {any} req
   * @param {any} options
   * @returns
   * @memberof MongoStore
   */
  count(req, options) {
    if (this.options.store.count) {
      return this._driver.count(req.query, this.options.store.count)
    }

    return this._driver.count(req.query)
  }
}

module.exports = MongoStore
