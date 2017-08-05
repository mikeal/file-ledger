const fileLedger = require('../')
const inmem = require('lucass/inmemory')
const abstractLedger = require('abstract-ledger')
const test = require('tap').test

test('errors: set, get', async t => {
  t.plan(2)
  let ledger = abstractLedger(inmem())
  await ledger.append({}, null)
  let store = inmem()
  let cfs = fileLedger(store, store, ledger)
  try {
    await cfs.set('/test.txt', Buffer.from('test'))
  } catch (e) {
    t.same(e.message, 'This ledger is not a FileLedger.')
    t.type(e, 'Error')
  }
})
