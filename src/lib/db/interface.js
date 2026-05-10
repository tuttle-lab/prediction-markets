/**
 * Base DatabaseClient — extend this to add a new backend.
 * Swap implementations in src/lib/db/index.js.
 */
export class DatabaseClient {
  /** @returns {Promise<object[]>} */
  async select(_table, _options = {}) { throw new Error('select() not implemented') }

  /** @returns {Promise<object[]>} */
  async insert(_table, _data) { throw new Error('insert() not implemented') }

  /** @returns {Promise<object[]>} */
  async update(_table, _data, _filters) { throw new Error('update() not implemented') }

  /** @returns {Promise<object[]>} */
  async delete(_table, _filters) { throw new Error('delete() not implemented') }

  /** @returns {Promise<any>} */
  async rpc(_fn, _params = {}) { throw new Error('rpc() not implemented') }
}
