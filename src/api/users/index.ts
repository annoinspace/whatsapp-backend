import express from "express"
import createHttpError from "http-errors"
import { JwtAuthenticationMiddleware, UserRequest } from "../../lib/jwtAuth"
import UsersModel from "./model"
import { v2 as cloudinary } from "cloudinary"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import multer from "multer"
import { createAccessToken } from "../../lib/tools"

const cloudinaryUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const result = await cloudinary.uploader.upload(req.body.avatar, {
        public_id: `user-avatar`,
        overwrite: true,
        folder: "whatsapp",
        tags: ["user-avatar"],
        transformation: { width: 400, height: 400, crop: "fill" }
      })
      console.log("result", result)
      return result
    }
  }),

  limits: { fileSize: 1024 * 1024 }
}).single("avatar")

const usersRouter = express.Router()

//1. GET USERS (EITHER ALL OF THEM OR BY EMAIL)
usersRouter.get("/", JwtAuthenticationMiddleware, async (req, res, next) => {
  try {
    let users
    if (req.query.search) {
      users = await UsersModel.find({
        $or: [
          { username: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } }
        ]
      })
    } else {
      users = await UsersModel.find()
    }

    if (users) {
      res.status(200).send(users)
    } else {
      next(createHttpError(404, "No users were found."))
    }
  } catch (error) {
    next(error)
  }
})

//2. GET ME

usersRouter.get("/me", JwtAuthenticationMiddleware, async (req: UserRequest, res, next) => {
  try {
    if (req.user) {
      const me = await UsersModel.findById(req.user._id)
      if (me) {
        res.send(me)
      }
    } else {
      createHttpError(404, "user not found")
    }
  } catch (error) {
    next(error)
  }
})

//3. EDIT ME

usersRouter.put("/me", JwtAuthenticationMiddleware, async (req: UserRequest, res, next) => {
  try {
    if (req.user) {
      const updatedUser = await UsersModel.findByIdAndUpdate(req.user._id, req.body, {
        new: true,
        runValidators: true
      })
      res.send(updatedUser)
    }
  } catch (error) {
    next(error)
  }
})

//4. CHANGE MY AVATAR
usersRouter.post("/me/avatar", JwtAuthenticationMiddleware, cloudinaryUploader, async (req: UserRequest, res, next) => {
  console.log("before middleware")
  try {
    console.log("req.body", req.body)
    if (req.user) {
      console.log(req.body.avatar)
      const { avatar, ...user } = req.body
      const foundUser = await UsersModel.findByIdAndUpdate(req.user._id, user, { new: true, runValidators: true })

      if (foundUser) {
        res.status(201).send({ message: "User Pic Uploaded" })
      }
    } else {
      next(createHttpError(404, `User with id is not found`))
    }
  } catch (error) {
    next(error)
  }
  console.log("after middleware")
})

//5. GET SPECIFIC USER

usersRouter.get("/:userId", JwtAuthenticationMiddleware, async (req, res, next) => {
  try {
    const foundUser = await UsersModel.findById(req.params.userId)
    if (foundUser) {
      res.status(200).send(foundUser)
    } else {
      createHttpError(404, `user with id ${req.params.userId} not found `)
    }
  } catch (error) {
    next(error)
  }
})

//6. REGISTER USER

usersRouter.post("/register", async (req, res, next) => {
  try {
    const newUser = new UsersModel(req.body)
    const { _id } = await newUser.save()

    res.status(201).send({ _id })
  } catch (error) {
    next(error)
  }
})

//7. LOGIN USER

usersRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body

    const user = await UsersModel.checkCredentials(email, password)

    if (user) {
      const payload = { _id: user._id }
      const accessToken = await createAccessToken(payload)
      res.send({ accessToken })
    } else {
      next(createHttpError(401, `Credentials are not ok!`))
    }
  } catch (error) {
    next(error)
  }
})

//8. LOGOUT USER

usersRouter.delete("/session", JwtAuthenticationMiddleware, async (req: UserRequest, res, next) => {
  try {
    if (req.user) {
      const user = await UsersModel.updateOne({ id: req.user._id })

      if (user) {
        res.status(200).send({ message: "User logged out" })
      }
    }
  } catch (error) {
    next(error)
  }
})

export default usersRouter
