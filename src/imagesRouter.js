import { Router } from "express";
import { v2 as cloudinary } from 'cloudinary';
import ImageModel from "../models/imagemodel.js"; // Ensure this path is correct

const imageRoute = Router();

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload a new image
 *     tags: [images]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *               title:
 *                 type: string
 *     responses:
 *       200:
 *         description: Image was successfully uploaded
 *       400:
 *         description: Image was not provided
 *       500: 
 *         description: Server error
 */
imageRoute.post("/upload", async (req, res) => {
    try {
        const { image, title } = req.body;
        if (!image) {
            return res.status(400).json({ message: "Image not found" });
        }
        // if (!image.startsWith("data:image/jpeg;base64,")){
        //     return res.status(400).json({message:"invalid image provided"})
        // }

        const result = await cloudinary.uploader.upload(image, {
            folder: "uploads",
            resource_type: "auto"
        });
        
        console.log(result);

        const newImage = new ImageModel({
            title,
            imageurl: result.secure_url,
            public_id: result.public_id
        });

        await newImage.save();
        res.status(200).json({ message: "Image successfully uploaded", data: newImage });
    } catch (error) {
        console.error("Upload Error: ", error.message);
        res.status(500).json({ message: "Server error during image upload" });
    }
});

/**
 * @swagger
 * /api/allImages:
 *   get:
 *     summary: Get all Images
 *     tags: [images]
 *     responses:
 *       200:
 *         description: A list of all Images
 *       404:
 *         description: No Image found
 *       500:
 *         description: Server error
 */
imageRoute.get("/allImages", async (req, res) => {
    try {
        const allImages = await ImageModel.find();
        if (!allImages.length) {
            return res.status(404).json({ message: "No images found" });
        }
        res.status(200).json(allImages);
    } catch (error) {
        console.error("Fetch Error: ", error.message);
        res.status(500).json({ message: "Server error fetching images" });
    }
});

/**
 * @swagger
 * /api/image/{id}:
 *   delete:
 *     summary: Delete an image by ID
 *     tags: [images]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The image ID
 *     responses:
 *       200:
 *         description: Deleted Image Successfully
 *       400:
 *         description: Invalid image ID format
 *       404:
 *         description: Image not Found
 *       500:
 *         description: Server error
 */
imageRoute.delete("/image/:id", async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Attempting to delete image with id: ${id}`);

        // Check if the ID is a valid MongoDB ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            console.log('Invalid image ID format.');
            return res.status(400).json({ message: "Invalid image ID format" });
        }

        const deletedImage = await ImageModel.findByIdAndDelete(id);
        if (deletedImage == null) {
            console.log(`Image with id: ${id} not found in database.`);
            return res.status(404).json({ message: "Image not Found" });
        }

        console.log(`Deleting image from Cloudinary with public_id: ${deletedImage.public_id}`);
        await cloudinary.uploader.destroy(deletedImage.public_id);
        console.log('Image deleted from Cloudinary successfully.');

        res.status(200).json({ message: "Deleted Image Successfully" });
    } catch (error) {
        console.error('Error occurred while deleting image:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * @swagger
 * /api/image/{id}:
 *   put:
 *     summary: Update an existing image
 *     tags: [images]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The image ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *               title:
 *                 type: string
 *     responses:
 *       200:
 *         description: Image was successfully updated
 *       400:
 *         description: Invalid image ID or image data
 *       500:
 *         description: Server error
 */
imageRoute.put("/image/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const { image, title } = req.body;

        console.log(`Attempting to update image with id: ${id}`);
        // Check if the ID is a valid MongoDB ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            console.log('Invalid image ID format.');
            return res.status(400).json({ message: "Invalid image ID format" });
        }

        const existingImage = await ImageModel.findById(id);
        if (!existingImage) {
            console.log(`Image with id: ${id} not found in database.`);
            return res.status(404).json({ message: "Image not Found" });
        }

        let updatedFields = { title };
        if (image) {
            // if (!image.startsWith("data:image/jpeg;base64,")){
            //     return res.status(400).json({message:"Invalid image provided"})
            // }

            // Delete the old image from Cloudinary
            await cloudinary.uploader.destroy(existingImage.public_id);

            // Upload the new image to Cloudinary
            const result = await cloudinary.uploader.upload(image, {
                folder: "uploads",
                resource_type: "auto"
            });

            console.log(result);

            updatedFields.imageurl = result.secure_url;
            updatedFields.public_id = result.public_id;
        }

        const updatedImage = await ImageModel.findByIdAndUpdate(id, updatedFields, { new: true });

        res.status(200).json({ message: "Image successfully updated", data: updatedImage });
    } catch (error) {
        console.error("Update Error: ", error.message);
        res.status(500).json({ message: "Server error during image update" });
    }
});

export default imageRoute;
