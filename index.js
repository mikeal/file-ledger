const contentfs = require('contentfs')

/* ContentFSLedger is a ContentFS object that is kept in
   sync with a ledger and validates root updates within
   the ledger stay consistent with the root nodes updated
   in ContentFS
*/
class ContentFSLedger extends contentfs.AbstractContentFS {
  constructor (local, remote, ledger) {
    super(local, remote)
    ledger.addValidation(async msg => {
      let _root = await this.ledger.getRoot()
      if (!_root) return true
      let block = await this._getBlock(_root)
      return msg.parent === block.msg.fileRoot
    })
    this.ledger = ledger
    this._ledgerMap = new Map()
    // TODO: setup realtime update on leger appends
  }
  async _getBlock (blockid) {
    let blockBuffer = await this.ledger.store.get(blockid)
    let block = JSON.parse(blockBuffer.toString())
    return block
  }
  async getRoot () {
    // TODO: caching with realtime cache invalidation.
    let blockid = await this.ledger.getRoot()
    if (blockid === null) {
      return null // ledger is new.
    }
    let block = await this._getBlock(blockid)
    if (!block || !block.msg || !block.msg.fileRoot) {
      throw new Error('This ledger is not a FileLedger.')
    }
    this._ledgerMap.set(block.msg.fileRoot, blockid)
    return block.msg.fileRoot
  }
  async setRoot (root, oldroot) {
    await this.push(root)
    let msg = {fileRoot: root, parent: oldroot}
    await this.getRoot() // ensure ledgerMap is set.
    let _root = oldroot ? this._ledgerMap.get(oldroot) : null
    await this.ledger.append(msg, _root)
    return this
  }
}

module.exports = (...args) => new ContentFSLedger(...args)
