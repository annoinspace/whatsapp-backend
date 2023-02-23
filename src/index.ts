import mongoose from "mongoose"
import listEndpoints from "express-list-endpoints"
import httpServer, { expressServer } from "./server"

const port = process.env.PORT || 3002

mongoose.connect(process.env.MONGO_URL!)

mongoose.connection.on("connected", () => {
  console.log("Successfully connected to MongoDB!")
  httpServer.listen(port, () => {
    console.table(listEndpoints(expressServer))
    console.log(`Server is running on port ${port}`)
  })
})
