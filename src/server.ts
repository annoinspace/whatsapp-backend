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
import { Server } from "socket.io"
import { createServer } from "http"
import { newConnectionHandler } from "./socket"

export const expressServer = express()

// *******************************SOCKET>IO*****************************
const httpServer = createServer(expressServer)
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.FE_URL,
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
})
io.on("connection", newConnectionHandler)

// ***************************** MIDDLEWARES ***************************
expressServer.use(cors())
expressServer.use(express.json())

// ****************************** ENDPOINTS ****************************
expressServer.use("/users", usersRouter)
expressServer.use("/chats", chatsRouter)

// *************************** ERROR HANDLERS **************************
expressServer.use(unauthorizedErrorHandler)
expressServer.use(forbiddenErrorHandler)
expressServer.use(notFoundErrorHandler)
expressServer.use(genericErrorHandler)

export default httpServer
