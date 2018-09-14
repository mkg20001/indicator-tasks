'use strict'

const jf = require('json-file')

const Task = require('./task')

function TaskDB (file) {
  const db = jf.read(file)

  function save () {
    db.writeSync()
  }
  let nt = []
  let nt_ = {}
  let gr = []

  function tasks (_nt) {
    nt_ = {}
    nt = _nt.map(n => new Task(n, db))
    let g = {}
    nt.map(n => (nt_[n.id] = n && (g[n.groupId] = {
      id: n.groupId,
      g: n.group
    })))
    gr = Object.keys(g).map(k => g[k])
    save()
  }

  function get (id) {
    if (id) return nt_[id]
    else return nt
  }

  function getG () {
    return gr
  }
  this.save = save
  this.tasks = tasks
  this.get = get
  this.getG = getG
}
module.exports = TaskDB
