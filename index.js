import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import imageRoute from "./src/imagesRouter.js";
import mongoose from "mongoose";
import { v2 as cloudinary } from 'cloudinary';
import bodyParser from "body-parser";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";
import path from "path";
import { fileURLToPath } from "url";
import swaggerUiDist from "swagger-ui-dist";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSS_URL = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.css";
dotenv.config();

const app = express();
app.use(morgan("dev"));
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));

// Serve static files including favicon
app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
    res.send('<a href="https://server-psi-orcin.vercel.app/api-docs">Server Methodologies</a>');
});

app.use("/api", imageRoute);

mongoose.connect(process.env.URL).then(() => {
    console.log("Database connection established");
}).catch(err => {
    console.log(err);
});

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

// Serve Swagger UI static assets
const swaggerUiAssetPath = swaggerUiDist.getAbsoluteFSPath();
app.use('/api-docs', express.static(swaggerUiAssetPath));

// Swagger options
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Image uploader API",
            version: "1.0.0",
            description: "API documentation for Image uploader"
        },
        servers: [
            {
                url: "https://server-psi-orcin.vercel.app", // Replace with your Vercel app URL
                description: "Image uploader API"
            }
        ]
    },
    apis: ["./src/**/*.js"]
};

const specs = swaggerJSDoc(options);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs, { customCssUrl: CSS_URL }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Export the app for Vercel
export default app;
