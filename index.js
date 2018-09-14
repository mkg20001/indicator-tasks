'use strict'

const {
  app,
  Menu,
  Tray
} = require('electron')

const fs = require('fs')
const path = require('path')

const n = path.join(__dirname, 'tasks')

const TaskDB = require('./taskdb')
const parser = require('./tasks_parser')

// Linux tray fix
const cp = require('child_process')
const labelTask = cp.spawn('python2', [path.join(__dirname, 'tray_text.py')])

let appIcon = null
app.on('ready', () => {
  appIcon = new Tray(path.join(__dirname, 'ico.png'))
  if (!fs.existsSync(n + '.json')) {
    fs.writeFileSync(n + '.json', Buffer.from('{}'))
  }
  const db = new TaskDB(n + '.json')
  db.tasks(parser(n + '.txt'))

  const trayTop = [{
    label: 'Update Tasks',
    click: () => {
      db.tasks(parser(n + '.txt'))
      rebuild()
    }
  }].map(e => !(e.position || (e.position = 'endof=top')) || e)
  const trayBottom = [{
    label: 'Quit',
    click: onExit
  }].map(e => !(e.position || (e.position = 'endof=bottom')) || e)

  function rebuild () {
    let c = {}
    let co = []

    db.getG().map(g => {
      c[g.id] = [{
        label: g.g,
        position: 'endof=' + g.id
      }]
      co.push(g.id)
    })

    db.get().filter(n => n.active()).map(task => c[task.groupId].push({
      label: task.render(),
      type: 'checkbox',
      checked: task.state(),
      enabled: true,
      task,
      position: 'endof=' + task.groupId,
      click: () => {
        if (task.state()) task.untick()
        else task.tick()
        rebuild()
        return true
      }
    }))

    db.get().filter(n => !n.active()).map(task => c[task.groupId].push({
      label: task.render(),
      type: 'checkbox',
      checked: task.state(),
      enabled: false,
      task,
      position: 'endof=' + task.groupId
    }))

    co.map(c_ => {
      let n = c[c_].slice(0)
      n.shift()
      n = n.filter(n => n.task.active()).filter(n => !n.task.state()).filter(n => !n.task.longterm)
      if (n.length) c[c_][0].label += ' (' + n.length + ')'
    })

    let tasks = co.map(c_ => c[c_]).reduce((a, b) => a.concat(b), [])

    // console.log(c)

    const tasksToDo = db.get().filter(n => n.active()).filter(n => !n.longterm).filter(n => !n.state()).length

    let label
    if (tasksToDo) {
      label = tasksToDo + ' thing' + (tasksToDo !== 1 ? 's' : '') + ' to do'
    } else {
      label = ''
    }
    appIcon.setTitle(label)
    appIcon.setToolTip(label)
    fs.writeFileSync(path.join(__dirname, 'label.txt'), Buffer.from(label))

    appIcon.setContextMenu(Menu.buildFromTemplate((label ? [{
      label
    }] : []).concat(trayTop, tasks, trayBottom)))
  }
  rebuild()
  setInterval(rebuild, 10 * 1000)

  function onExit () {
    db.save()
    labelTask.kill('SIGKILL')
    process.exit(0)
  }

  process.on('SIGINT', onExit).on('SIGTERM', onExit)
})
