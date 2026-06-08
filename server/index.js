import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Replicate from "replicate";
import { parseSceneInNode } from "./parseSceneNode.js";
import { buildAssetPrompt } from "./assetPrompt.js";
import { PythonParserWorker } from "./pythonParserWorker.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : true;

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

function attachPrompts(assets) {
  return assets.map((asset) => ({
    ...asset,
    prompt: asset.prompt ?? buildAssetPrompt(asset.name),
  }));
}

const pythonParserWorker = new PythonParserWorker();

pythonParserWorker.warmup().catch((error) => {
  console.warn("Python parser warmup failed:", error.message);
});

app.post("/parse-scene", async (req, res) => {
  const { sceneText } = req.body;

  if (!sceneText || !sceneText.trim()) {
    return res.status(400).json({ error: "Missing sceneText" });
  }

  try {
    let assets;

    try {
      assets = await pythonParserWorker.parse(sceneText);
    } catch (pythonError) {
      console.warn(
        "Python parser unavailable, using Node fallback:",
        pythonError.message
      );
      assets = parseSceneInNode(sceneText).assets;
    }

    if (!Array.isArray(assets) || assets.length === 0) {
      return res.status(422).json({
        error: "No objects found in scene text. Try naming specific items.",
        assets: [],
      });
    }

    res.json({ assets: attachPrompts(assets) });
  } catch (error) {
    console.error("Error parsing scene:", error);
    res.status(500).json({ error: "Failed to parse scene", assets: [] });
  }
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

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
