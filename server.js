const express = require("express");
const app = express();
const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");
const cors = require("cors");

app.use(cors());
app.use(express.static("public")); // Serve static files from 'public' directory
app.use("/bg", express.static("path_to_bg_directory")); // Serve images from 'bg' directory

async function addTextToImage(inputText, imagePath, outputPath) {
  try {
    const image = await loadImage(imagePath);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    ctx.font = "16rem Itim";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    const textX = canvas.width / 2;
    const textY = canvas.height / 2 + 100;
    const formattedText = `${inputText}`;
    ctx.fillText(formattedText, textX, textY);
    const outputStream = fs.createWriteStream(outputPath);
    const stream = canvas.createJPEGStream();
    stream.pipe(outputStream);
    await new Promise((resolve) => {
      outputStream.on("finish", resolve);
    });
    console.log(`Image with text saved successfully: ${outputPath}`);
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

const getUniqueFileName = (dir, fileName) => {
  let counter = 1;
  let uniqueFileName = fileName;
  while (fs.existsSync(`${dir}/${uniqueFileName}.jpg`)) {
    uniqueFileName = `${fileName}_${counter}`;
    counter++;
  }
  return uniqueFileName;
};

app.use(express.static(__dirname + "/public"));

app.get("/process", async (req, res) => {
  const { jsonFile, outputDir, bgColor } = req.query;

  try {
    const backgroundPath = `./bg/${bgColor}`;
    const imagePaths = [backgroundPath];

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const textData = fs.readFileSync(`./json/${jsonFile}`, "utf-8");
    const textList = JSON.parse(textData);

    for (const imagePath of imagePaths) {
      for (const textItem of textList) {
        const { text, outputName } = textItem;
        if (!outputName) {
          console.error("Missing outputName for an item in the JSON file");
          continue;
        }
        const formattedOutputName = getUniqueFileName(
          outputDir,
          outputName.replace(/\s/g, "_")
        );
        const outputFileName = `${formattedOutputName}.jpg`;
        const outputPath = `${outputDir}/${outputFileName}`;
        await addTextToImage(text, imagePath, outputPath);
      }
    }

    res.send("Image processing completed.");
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).send(`Image processing failed: ${error.message}`);
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
