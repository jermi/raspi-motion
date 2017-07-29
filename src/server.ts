import * as express from "express";
import * as bodyParser from "body-parser";
import * as morgan from "morgan";
import * as errorHandler from "errorhandler";
import {ApplicationWs, WsInstance} from "./types/express-ws";
import * as minimist from 'minimist';
import {existsSync, readFileSync} from 'fs';
import * as path from "path";
import {log} from "./logger";
import * as child_process from "child_process";

const argv = minimist(process.argv.slice(2));

const pin = "17";
const command = `echo ${pin} > /sys/class/gpio/export`;
if (!argv.file) { // file is for dev purposes
    log(`executing ${command}`);
    child_process.execSync(command);
}

const app: ApplicationWs = (express() as {}) as ApplicationWs;
const wsInstance: WsInstance = require('express-ws')(app);

const watchedFile = argv.file || `/sys/class/gpio/gpio${pin}/value`;
log(`watching file ${watchedFile} for changes`);
// cant use fs.watch since GPIO is not covered by inotify
let contentsPrev: string = null;
let contents: string = null;
const movementDetected = () => (parseInt(contents) > 0).toString();
setInterval(() => {
    if (existsSync(watchedFile)) {
        contents = readFileSync(watchedFile).toString();
    }
    if (contentsPrev !== contents) {
        contentsPrev = contents;
        const clients = wsInstance.getWss("/").clients;
        log(`file contents changed to ${contents} notifying ${clients.size} clients`);
        clients.forEach((client) => {
            client.send(movementDetected());
        });
    }
}, 500);

app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '../static/index.html'));
});

app.ws('/', function (ws, req) {
    let counter = 0;
    ws.on('message', function (msg) {
        log('greetings from - ' + msg);
        ws.send(`hello [${counter++}`);
        ws.send(movementDetected());
    });
    log('client connected');
});

app.use(errorHandler());

const port = argv.port || 3000;
app.set("port", port);
app.listen(app.get("port"), () => {
    log(`app running at http://localhost:${port}`);
});