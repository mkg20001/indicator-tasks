'use strict'

const n = _ => _ < 10 ? _.toString() + '0' : _.toString()

function getWeekDay () {
  return new Date().toLocaleString('en', {
    weekday: 'long'
  }).toLowerCase()
}

function getDate () {
  const d = new Date()
  return n(d.getDate()) + n(d.getMonth()) + n(d.getFullYear())
}

const timeTable = {
  early: {
    from: 500,
    to: 800
  },
  morning: {
    from: 800,
    to: 1000
  },
  evening: {
    from: 2000,
    to: 2200
  },
  late: {
    from: 1900,
    to: 2400
  }
}

function gotTime (time) {
  const cur = new Date().getHours() * 100 + new Date().getMinutes()
  return Object.keys(timeTable).filter(k => timeTable[k].from <= cur && timeTable[k].to >= cur).indexOf(time) !== -1
}

const types = {
  simple: {
    active: () => true,
    tick: (task) => task.set('ticked', true),
    untick: (task) => task.set('ticked', false),
    state: (task) => Boolean(task.get('ticked')),
    render: (task) => task.text
  },
  days: {
    active: (task) => {
      if (task.opt.days.indexOf('*') !== -1) return true
      let l = getWeekDay()
      while (l.length > 1) {
        if (task.opt.days.indexOf(l) !== -1) return true
        l = l.substr(0, l.length - 1)
      }
      return false
    },
    tick: (task) => task.set('ticked', getDate()),
    untick: (task) => task.set('ticked', 0),
    state: (task) => task.get('ticked') === getDate(),
    render: (task) => task.text
  },
  daystime: {
    active: (task) => {
      if (!task.opt.times.filter(gotTime).length) return false
      if (task.opt.days.indexOf('*') !== -1) return true
      let l = getWeekDay()
      while (l.length > 1) {
        if (task.opt.days.indexOf(l) !== -1) return true
        l = l.substr(0, l.length - 1)
      }
      return false
    },
    tick: (task) => task.set('ticked', getDate()),
    untick: (task) => task.set('ticked', 0),
    state: (task) => task.get('ticked') === getDate(),
    render: (task) => task.text
  },
  time: {
    active: (task) => Boolean(task.opt.times.filter(gotTime).length),
    tick: (task) => task.set('ticked', true),
    untick: (task) => task.set('ticked', false),
    state: (task) => Boolean(task.get('ticked')),
    render: (task) => task.text
  }
}

function Task (data, db) {
  const id = data.id

  if (!db.get(id)) db.set(id, {}) // init
  const type = types[data.type]
  const self = this
  if (!type) throw new Error('Unsupported type ' + data.type)

  function wrap (prop) {
    return function () {
      var a = [].slice.call(arguments, 0)
      a.unshift(_task)
      return type[prop].apply(_task, a)
    }
  }
  ['active', 'tick', 'untick', 'state', 'render'].map(s => (self[s] = wrap(s)));
  ['group', 'groupId', 'id', 'longterm'].map(s => (self[s] = data[s]))

  function get (prop) {
    return db.get(id + '.' + prop)
  }

  function set (prop, val) {
    db.set(id + '.' + prop, val)
    db.writeSync()
  }
  const _task = {
    get: get,
    set: set,
    opt: data,
    text: data.text
  } // mini object to pass to type
}
module.exports = Task
