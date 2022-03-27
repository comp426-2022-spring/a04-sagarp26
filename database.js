"use strict"

const database = require("better-sqlite3")

const logdb = new database("log.db")

const stmt = logdb.prepare(`SELECT name FROM sqlite_master WHERE type='table' and name='accesslog';`)
let row = stmt.get()
if (row === undefined) {
    const sqlInit = `
        CREATE TABLE accesslog (
            remoteaddr VARCHAR,
            remoteuser VARCHAR,
            time VARCHAR,
            method VARCHAR,
            url VARCHAR,
            protocol VARCHAR,
            httpversion NUMERIC,
            secure INTEGER,
            status INTEGER,
            referer VARCHAR,
            useragent VARCHAR
        );
    `
    logdb.exec(sqlInit)
}

module.exports = logdb