import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Replicate from "replicate";

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

app.post("/generate-texture", async (req, res) => {
    try {
      const { prompt } = req.body;
  
      const texturePrompt = `
        ${prompt}.
        This is a flat seamless material texture only.
        Orthographic top-down texture sample.
        No room.
        No furniture.
        No objects.
        No windows.
        No lighting setup.
        No perspective.
        No isometric scene.
        No walls or floor meeting.
        No interior design.
        The image should look like a repeatable material swatch.
      `;
  
      const output = await replicate.run("black-forest-labs/flux-schnell", {
        input: {
          prompt: texturePrompt,
          output_format: "png",
        },
      });
  
      const imageUrl = output[0].url();
  
      res.json({ imageUrl });
    } catch (error) {
      console.error("Error generating texture:", error);
      res.status(500).json({ error: "Failed to generate texture" });
    }
  });

app.post("/generate-asset", async (req, res) => {
    try {
      const { prompt } = req.body;
  
      // 1. Generate asset with FLUX
      const fluxOutput = await replicate.run("black-forest-labs/flux-schnell", {
        input: {
          prompt,
          output_format: "png",
        },
      });
  
      const rawImageUrl = fluxOutput[0].url();
  
      // 2. Remove background
      const bgRemovedOutput = await replicate.run(
        "recraft-ai/recraft-remove-background",
        {
          input: {
            image: rawImageUrl,
          },
        }
      );
  
      const imageUrl =
        typeof bgRemovedOutput === "string"
          ? bgRemovedOutput
          : bgRemovedOutput.url
            ? bgRemovedOutput.url()
            : bgRemovedOutput[0].url();
  
      res.json({
        imageUrl,
        rawImageUrl,
      });
    } catch (error) {
      console.error("Error generating asset:", error);
      res.status(500).json({ error: "Failed to generate asset" });
    }
  });

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
