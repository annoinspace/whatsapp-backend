import express from "express";
import cors from "cors";
import {
  forbiddenErrorHandler,
  genericErrorHandler,
  notFoundErrorHandler,
  unauthorizedErrorHandler,
} from "./errorHandlers";
import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";

export const server = express();

// *******************************SOCKET>IO*****************************
const httpServer = createServer(server);
export const io = new SocketIOServer(httpServer);

// ***************************** MIDDLEWARES ***************************
server.use(cors());
server.use(express.json());

// ****************************** ENDPOINTS ****************************

// *************************** ERROR HANDLERS **************************
server.use(unauthorizedErrorHandler);
server.use(forbiddenErrorHandler);
server.use(notFoundErrorHandler);
server.use(genericErrorHandler);

export default httpServer;
