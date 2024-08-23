import express from "express"
import cors from "cors"
import uploadRoutes from "./routes/upload.route"
import logger from "./config/logger"
const app = express()
const PORT = process.env.PORT || 5000

// Middleware to log every request
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});


app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use("/api/upload", uploadRoutes)

app.listen(PORT, () => {
    logger.info(`app  on port ${PORT}`)
})