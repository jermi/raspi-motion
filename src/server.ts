import * as express from "express";
import * as bodyParser from "body-parser";
import * as morgan from "morgan";
import * as errorHandler from "errorhandler";
import {ApplicationWs, WsInstance} from "./types/express-ws";
import * as minimist from 'minimist';
import {existsSync, readFileSync} from 'fs';
import * as path from "path";

const argv = minimist(process.argv.slice(2));
const port = argv.port || 3000;
const watchedFile = argv.file || "/sys/class/gpio/gpio17/value";

const app: ApplicationWs = (express() as {}) as ApplicationWs;
const wsInstance: WsInstance = require('express-ws')(app);

console.log(`watching file ${watchedFile} for changes`);
// cant use fs.watch since GPIO is not covered by inotify
let contentsPrev: string = null;
setInterval(() => {
    let contents: string = null;
    if (existsSync(watchedFile)) {
        contents = readFileSync(watchedFile).toString();
    }
    if (contentsPrev !== contents) {
        contentsPrev = contents;
        const clients = wsInstance.getWss("/").clients;
        console.log(`file contents changed to ${contents} notifying ${clients.size} clients`);
        clients.forEach((client) => {
            client.send((parseInt(contents) > 0).toString());
        });
    }
}, 1000);


app.set("port", port);

app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '../static/index.html'));
});

app.ws('/', function (ws, req) {
    let counter = 0;
    ws.on('message', function (msg) {
        console.log('greetings from - ' + msg);
        ws.send(`hello [${counter++}`);
    });
    console.log('socket');
});

app.use(errorHandler());

app.listen(app.get("port"), () => {
    console.log(`app running at http://localhost:${port}`);
});