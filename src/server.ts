import express from "express"
import bodyParser from "body-parser"
import cors from "cors"
import {
  forbiddenErrorHandler,
  genericErrorHandler,
  notFoundErrorHandler,
  unauthorizedErrorHandler
} from "./errorHandlers"
import usersRouter from "./api/users"
import chatsRouter from "./api/chats"
import { Server as SocketIOServer } from "socket.io"
import { createServer } from "http"
import { newConnectionHandler } from "./socket"

export const server = express()

// *******************************SOCKET>IO*****************************
const httpServer = createServer(server)
export const io = new SocketIOServer(httpServer)

io.on("connection", newConnectionHandler)

// ***************************** MIDDLEWARES ***************************
server.use(cors())

server.use(express.json())

// ****************************** ENDPOINTS ****************************
server.use("/users", usersRouter)
server.use("/chats", chatsRouter)

// *************************** ERROR HANDLERS **************************
server.use(unauthorizedErrorHandler)
server.use(forbiddenErrorHandler)
server.use(notFoundErrorHandler)
server.use(genericErrorHandler)

export default httpServer
