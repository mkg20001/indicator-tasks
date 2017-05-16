"use strict"

const fs = require("fs")
const crypto = require("crypto")

function hash(str, alg) {
  return crypto.createHash(alg || "sha512").update(str).digest('hex')
}

/*function getMatches(string, regex, index) {
  index = index || 1 // default to the first capturing group
  var matches = []
  var match
  while ((match = regex.exec(string)))
    matches.push(match[index])
  return matches
}*/

function getAlpha(str, re) {
  return str.replace(re || /[^a-z0-9]/gmi, "").toLowerCase()
}

function Parse(file) {
  const c = fs.readFileSync(file).toString().split("\n").filter(e => !!e) //filter all the lines, remove empty ones
  var group = "Tasks"
  return c.map(line => {
    const m = line.match(/\[(.*)\] *(.*)/mi)
    if (line.startsWith("~")) group = line.substr(1).trim()
    if (!m) return
    const a = getAlpha(m[2]) //just alphanumeric stuff
    //so edits and spaces don't cause the id to change
    return {
      prop: m[1],
      val: m[2],
      id: hash(a).substr(0, 10),
      alpha: a,
      group: group
    }
  }).filter(e => !!e).map(e => {
    if ((!e.prop && e.prop !== "") || !e.val) return //drop invalid
    let prop = {}
    let task = {
      text: e.val,
      id: e.id,
      alpha: e.alpha,
      group: e.group,
      groupId: getAlpha(e.group)
    }
    getAlpha(e.prop, /[^a-z0-9\=\,\*\|]/gmi) /*filter alphanum + set chars*/ .split("|").map(p => {
      const v = p.split("=")
      if (typeof v[1] == "undefined") prop[v[0]] = true
      else prop[v[0]] = v[1]
    })
    if (prop.long || prop.longterm) task.longterm = true
    if (!Object.keys(prop).length) task.type = "simple"
    else if (prop.time && prop.days) {
      task.type = "daystime"
      task.days = prop.days.split(",")
      task.times = prop.time.split(",")
    } else if (prop.time) {
      task.type = "time"
      task.times = prop.time.split(",")
    } else if (prop.days) {
      task.type = "days";
      task.days = prop.days.split(",")
    } else task.type = "simple"
    return task
  })
}
module.exports = Parse
