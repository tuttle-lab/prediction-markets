import { createClient } from '@supabase/supabase-js'
import { DatabaseClient } from './interface'

export class SupabaseClient extends DatabaseClient {
  constructor() {
    super()
    this._client = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
    )
  }

  _applyFilters(query, filters = {}) {
    return Object.entries(filters).reduce((q, [col, val]) => q.eq(col, val), query)
  }

  async select(table, { columns = '*', filters, limit } = {}) {
    let q = this._client.from(table).select(columns)
    if (filters) q = this._applyFilters(q, filters)
    if (limit)   q = q.limit(limit)
    const { data, error } = await q
    if (error) throw error
    return data
  }

  async insert(table, data) {
    const { data: rows, error } = await this._client.from(table).insert(data).select()
    if (error) throw error
    return rows
  }

  async update(table, data, filters) {
    let q = this._client.from(table).update(data)
    q = this._applyFilters(q, filters)
    const { data: rows, error } = await q.select()
    if (error) throw error
    return rows
  }

  async delete(table, filters) {
    let q = this._client.from(table).delete()
    q = this._applyFilters(q, filters)
    const { data: rows, error } = await q.select()
    if (error) throw error
    return rows
  }

  async rpc(fn, params = {}) {
    const { data, error } = await this._client.rpc(fn, params)
    if (error) throw error
    return data
  }

  /** Expose raw client for auth, realtime, storage, etc. */
  get raw() { return this._client }
}
