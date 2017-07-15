import {Application, Request} from "express";

declare module "express-ws";

export interface ApplicationWs extends Application {
    ws: (path: string, ws: WsHandler) => void
}

export interface WsInstance {
    getWss: (path: string) => Wss
}

export interface Wss {
    clients: Set<WebSocket>
}

export interface WsHandler {
    (ws: WsMessageHandler, req: Request): void
}

export interface WsMessageHandler {
    on(event: string, callback: MessageCallback): void

    send(message: string): void;
}

export interface MessageCallback {
    (payload: string): void
}
