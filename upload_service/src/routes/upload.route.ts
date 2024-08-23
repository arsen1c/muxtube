import express from "express"
import { initUpload, uploadPart } from "../controller/multiparupload.controller"
import multer from "multer"
const upload = multer()

const router = express.Router()

router.get("/", (req, res) => res.status(200).send("hello"))
router.post("/init", initUpload)
router.post("/", upload.single("chunk"), uploadPart)

export default router