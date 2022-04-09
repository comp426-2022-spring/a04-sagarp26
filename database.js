"use strict"

const database = require("better-sqlite3")

const logdb = new database("log.db")

const stmt = logdb.prepare(`SELECT name FROM sqlite_master WHERE type='table' and name='accesslogs';`)
let row = stmt.get()
if (row === undefined) {
    const sqlInit = `
        CREATE TABLE accesslogs (
            id INTEGER PRIMARY KEY
            remoteaddr VARCHAR,
            remoteuser VARCHAR,
            time VARCHAR,
            method VARCHAR,
            url VARCHAR,
            protocol VARCHAR,
            httpversion NUMERIC,
            status INTEGER,
            referer VARCHAR,
            useragent VARCHAR
        );
    `
    logdb.exec(sqlInit)
}

module.exports = logdb