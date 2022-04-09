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
const port = args.port
const debug = args.debug
const log = args.log
const help = (`
server.js [options]

--port  Set the port number for the server to lister on. Must be an interger
            between 1 and 65535.

--debug If set to true, creates endpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error/ which throws
            an error with the message "Error test successful." Defaults to
            false.

--log           If set to false, no log files are written. Defaults to true.
            Logs are always written to database.

--help  Return this message and exit.
`)

const server = app.listen(port, () => {
  console.log("App listening on port %PORT%".replace("%PORT%", port))
})

if (args.help || args.h) {
  console.log(help)
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
    status: res.statusCode,
    referer: req.headers['referer'],
    useragent: req.headers['user-agent']
  }
  const stmt = logdb.prepare(`INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referer, logdata.useragent)
  next()
})

if (log == true) {
  const WRITESTREAM = fs.createWriteStream("access.log", {flags: 'a'})
  app.use(morgan("combined", {stream: WRITESTREAM}))
}

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