const express = require("express")
const { exit } = require("process")
const app = express()
const fs = require("fs")
const logdb = require("./database")
const morgan = require("morgan")

const args = require("minimist")(process.argv.slice(2))
args["port"]
args["debug"]
args["log"]
args["help"]
const port = args.port || 5555
const debug = args.debug || false
const log = args.log || true
const help = args.help || null

const server = app.listen(port, () => {
  console.log("App listening on port %PORT%".replace("%PORT%", port))
})

if (help) {
  console.log("Return this message and exit.")
  exit(0)
}

if (debug) {
  app.get("/app/log/access/", (req, res) => {
    const stmt = logdb.prepare("SELECT * FROM accesslog").all()
    res.status(200).json(stmt)
  })

  app.get("/app/error/", (req, res) => {
    throw new Error("Error test successful.")
  })
}

if (log) {
  const WRITESTREAM = fs.createWriteStream("access.log", {flags: 'a'})
  app.use(morgan("combined", {stream: WRITESTREAM}))
}

app.get("/app/", (req, res) => {
  res.setHeader("Content-Type", "text/plain")
  res.status(200).send("200 OK")
})

app.get("/app/flip/", (req, res) => {
  res.setHeader("Content-Type", "text/json")
  res.status(200).json({"flip":coinFlip()})
})

app.get("/app/flips/:number/", (req, res) => {
  flips = coinFlips(req.params.number)
  res.setHeader("Content-Type", "text/json")
  res.status(200).json({"raw":flips,"summary":countFlips(flips)})
})

app.get("/app/flip/call/heads/", (req, res) => {
  res.setHeader("Content-Type", "text/json")
  res.status(200).json(flipACoin("heads"))
})

app.get("/app/flip/call/tails/", (req, res) => {
  res.setHeader("Content-Type", "text/json")
  res.status(200).json(flipACoin("tails"))
})

app.use((req, res, next) => {
  let logdata = {
    remoteaddr: req.iq,
    remoteuser: req.user,
    time: Date.now(),
    method: req.method,
    url: req.url,
    protocol: req.protocol,
    httpversion: req.httpVersion,
    secure: req.secure,
    status: res.statusCode,
    referer: req.headers['referer'],
    useragent: req.headers['user-agent']
  }
  const stmt = db.prepare("INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, secure, status, referer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
  const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.secure, logdata.status, logdata.referer, logdata.useragent)
  next()
})

app.use(function(req, res) {
  res.status(404).send("404 NOT FOUND")
})

function coinFlip() {
  let x = Math.floor(Math.random() * 2)
  var result = ""
  if(x < 1) {
    result = "heads"
  }
  else {
    result = "tails"
  }
  return result
}

function coinFlips(flips) {
  const f = []
  for (let i = 0; i < flips; i++) {
    f[i] = coinFlip()
  }
  return f
}

function countFlips(array) {
  var x = 0
  var y = 0
  for(let i = 0; i < array.length; i++) {
    if(array[i] == "heads") {
      x++
    }
    else if(array[i] == "tails") {
      y++
    }
  }
  const result = {"tails":y,"heads":x};
  return result;
}

function flipACoin(c) {
  let f = coinFlip();
  var r = "";
  if(c == f) {
    r = "win"
  }
  else {
    r = "lose"
  }
  const message = {"call":c, "flip":f, "result":r};
  return message;
}