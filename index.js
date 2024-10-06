require("dotenv").config();
const path = require("path");

const uri = process.env.MONGODB_URL;
const express = require("express");
const bodyParser = require("body-parser");
const { MongoClient, ObjectId } = require("mongodb");
const { error } = require("console");
const multer = require("multer");
const cors = require("cors");
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

app.use(cors());
// Serve static files from the 'uploads' folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    const mimeType = require('mime-types').lookup(filePath);
    if (mimeType) {
      res.setHeader('Content-Type', mimeType);
    }
  }
}));

const dbName = "test";

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Ensure this directory exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to filename
  },
});

const upload = multer({ storage });

MongoClient.connect(uri)
  .then((client) => {
    console.log("Connected to MongoDB");
    const db = client.db(dbName);
    const Logincollection = db.collection("login");
    const Educationcollection = db.collection("education");
    const Skillscollection = db.collection("skills");
    const Projectscollection = db.collection("projects");
    const CompetitionsCollection = db.collection("competitions");
    const BlogsCollection = db.collection("blogs");

    // POST request handler
    app.post("/register", async (req, res) => {
      try {
        const { username, password } = req.body;
        console.log(username, password);
        const user = await Logincollection.findOne({
          username: username,
        });
        if (user) {
          return res.status(409).json("Already existing user");
        }
        const result = await Logincollection.insertOne({ username, password });
        res.status(201).json(result);
      } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).send({ error: "An error occurred" });
      }
    });

    app.post("/blogs", upload.single("image"), async (req, res) => {
      try {
        const { title, content,link } = req.body;
        const image = req.file ? req.file.path : ""; // Get uploaded image path

        // Validate input
        if (!title || !image) {
          return res.status(400).json({ message: "Invalid format" });
        }

        const newBlog = {
          title,
          content,
          image,
          link,
          createdAt: new Date(),
        };

        const result = await BlogsCollection.insertOne(newBlog);
        res.status(201).json({ message: "Blog created successfully", result });
      } catch (error) {
        console.error("Error creating blog:", error);
        res.status(500).json({ error: "Failed to create blog" });
      }
    });

    // GET request handler to retrieve all blog posts
    app.get("/blogs", async (req, res) => {
      try {
        const blogs = await BlogsCollection.find({}).toArray();
        res.status(200).json(blogs);
      } catch (error) {
        console.error("Error retrieving blogs:", error);
        res.status(500).json({ error: "Failed to retrieve blogs" });
      }
    });

    // PUT request handler to update a blog post
    app.put("/blogs/:id", upload.single("image"), async (req, res) => {
      try {
        const id = req.params.id;
        const updatedBlog = {
          title: req.body.title,
          content: req.body.content,
        };

        if (req.file) {
          updatedBlog.image = req.file.path; // Update image if new one is provided
        }

        const result = await BlogsCollection.updateOne(
          { _id: ObjectId.createFromHexString(id) },
          { $set: updatedBlog }
        );

        if (result.matchedCount > 0) {
          res.status(200).json({ message: "Blog updated successfully" });
        } else {
          res.status(404).json({ message: "Blog not found" });
        }
      } catch (error) {
        console.error("Error updating blog:", error);
        res.status(500).json({ error: "Failed to update blog" });
      }
    });

    // DELETE request handler to delete a blog post
    app.delete("/blogs/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await BlogsCollection.deleteOne({
          _id: ObjectId.createFromHexString(id),
        });

        if (result.deletedCount > 0) {
          res.status(200).json({ message: "Blog deleted successfully" });
        } else {
          res.status(404).json({ message: "Blog not found" });
        }
      } catch (error) {
        console.error("Error deleting blog:", error);
        res.status(500).json({ error: "Failed to delete blog" });
      }
    });

    app.post("/login", async (req, res) => {
      try {
        const { username, password } = req.body;
        console.log(username, password);

        if (!username || !password) {
          return res.status(400).json({ message: "Invalid format" });
        }

        const user = await Logincollection.findOne({
          username: username,
          password: password,
        });

        if (!user) {
          return res.status(401).json({ message: "Invalid user" });
        }

        res.status(200).json({ message: "login successful" });
      } catch (error) {
        console.log(error);
      }
    });

    app.post("/skills", async (req, res) => {
      // try {}
    });

    app.post("/education", async (req, res) => {
      console.log("running");
      try {
        const { institute, startYear, endYear, duration, description } =
          req.body;
        if (!institute || !startYear || !endYear || !duration) {
          return res.status(400).json({ message: "invalid format" });
        }
        const result = await Educationcollection.insertOne({
          institute,
          startYear,
          endYear,
          duration,
          description,
        });
        res.status(201).json({ result });
      } catch (error) {
        console.log(error);
      }
    });

    app.post("/option/skills/new", upload.single("image"), async (req, res) => {
      console.log("running");
      try {
        const { skillName, level, stack } = req.body;
        const imageUrl = req.file ? req.file.path : ""; // Get uploaded image path

        if (!skillName || !level || !imageUrl || !stack) {
          return res.status(400).json({ message: "invalid format" });
        }

        const skill = await Skillscollection.findOne({ skillName: skillName });

        if (skill) {
          return res.status(401).json({ message: "Skill already exists" });
        }

        const result = await Skillscollection.insertOne({
          skillName,
          level,
          imageUrl,
          stack,
        });
        res.status(201).json({ result });
      } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to add skill" });
      }
    });

    // Update skill endpoint
    app.put("/skills/:id", upload.single("image"), async (req, res) => {
      try {
        const id = req.params.id;
        const { skillName, level, stack } = req.body;
        const imageUrl = req.file ? req.file.path : undefined; // Update image if provided

        const updatedSkill = {
          skillName,
          level,
          ...(imageUrl && { imageUrl }), // Include imageUrl only if it's provided
          stack,
        };

        const result = await Skillscollection.updateOne(
          { _id: ObjectId.createFromHexString(id) },
          { $set: updatedSkill }
        );

        if (result.matchedCount > 0) {
          res.status(200).json({ message: "Skill updated successfully" });
        } else {
          res.status(404).json({ message: "Skill not found" });
        }
      } catch (error) {
        console.error("Error updating skill:", error);
        res.status(500).json({ error: "Failed to update skill" });
      }
    });

    // Delete skill endpoint
    app.delete("/skills/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await Skillscollection.deleteOne({
          _id: ObjectId.createFromHexString(id),
        });

        if (result.deletedCount > 0) {
          res.status(200).json({ message: "Skill deleted successfully" });
        } else {
          res.status(404).json({ message: "Skill not found" });
        }
      } catch (error) {
        console.error("Error deleting skill:", error);
        res.status(500).json({ error: "Failed to delete skill" });
      }
    });

    app.get("/skills", async (req, res) => {
      try {
        const response = await Skillscollection.find({}).toArray();
        console.log(response);
        res.status(200).json({ response });
      } catch (error) {
        console.log(error);
      }
    });

    app.get("/education", async (req, res) => {
      try {
        const response = await Educationcollection.find({}).toArray();
        console.log(response);
        res.status(200).json({ response });
      } catch (error) {
        console.log(error);
      }
    });

    app.put("/education/:id", async (req, res) => {
      try {
        const id = req.params.id;
        console.log(id);
        const updatedEducation = req.body;
        console.log(updatedEducation);
        const result = await Educationcollection.updateOne(
          { _id: ObjectId.createFromHexString(id) },
          { $set: updatedEducation },
          { upsert: false }
        );
        if (result.matchedCount > 0) {
          res.status(200).json({ message: "updated successfully" });
        } else {
          return res
            .status(400)
            .json({ message: "Couldn't find the document" });
        }
      } catch (error) {
        console.log(error);
      }
    });

    app.delete("/education/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await Educationcollection.deleteOne({
          _id: ObjectId.createFromHexString(id),
        });

        if (result.deletedCount > 0) {
          res.status(200).json({ message: "Deleted successfully" });
        } else {
          res.status(404).json({ message: "Document not found" });
        }
      } catch (error) {
        console.error("Error during deletion:", error);
        res.status(500).json({ error: "An error occurred while deleting" });
      }
    });

    app.post("/projects", upload.single("image"), async (req, res) => {
      try {
        const { title, description, githubLink, linkedinLink } = req.body;
        const image = req.file ? req.file.path : ""; // Get uploaded image path

        const newProject = {
          title,
          description,
          image,
          githubLink,
          linkedinLink,
        };
        console.log("newproject", newProject);

        const result = await Projectscollection.insertOne(newProject);
        res
          .status(201)
          .json({ message: "Project created successfully", result });
      } catch (error) {
        console.error("Error creating project:", error);
        res.status(500).json({ error: "Failed to create project" });
      }
    });

    // New endpoint to get all projects
    app.get("/projects", async (req, res) => {
      try {
        console.log("running");
        const projects = await Projectscollection.find({}).toArray();
        console.log(projects);
        res.status(200).json(projects);
      } catch (error) {
        console.error("Error retrieving projects:", error);
        res.status(500).json({ error: "Failed to retrieve projects" });
      }
    });

    // New endpoint to update a project
    app.put("/projects/:id", upload.single("image"), async (req, res) => {
      try {
        const id = req.params.id;
        const updatedProject = {
          title: req.body.title,
          description: req.body.description,
          githubLink: req.body.githubLink,
          linkedinLink: req.body.linkedinLink,
        };

        if (req.file) {
          updatedProject.image = req.file.path; // Update image if new one is provided
        }

        const result = await Projectscollection.updateOne(
          { _id: ObjectId.createFromHexString(id) },
          { $set: updatedProject }
        );

        if (result.matchedCount > 0) {
          res.status(200).json({ message: "Project updated successfully" });
        } else {
          res.status(404).json({ message: "Project not found" });
        }
      } catch (error) {
        console.error("Error updating project:", error);
        res.status(500).json({ error: "Failed to update project" });
      }
    });

    // New endpoint to delete a project
    app.delete("/projects/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await Projectscollection.deleteOne({
          _id: ObjectId.createFromHexString(id),
        });

        if (result.deletedCount > 0) {
          res.status(200).json({ message: "Project deleted successfully" });
        } else {
          res.status(404).json({ message: "Project not found" });
        }
      } catch (error) {
        console.error("Error deleting project:", error);
        res.status(500).json({ error: "Failed to delete project" });
      }
    });

    app.post("/competitions", upload.single("image"), async (req, res) => {
      try {
        const { competitionName, description, position } = req.body;
        const image = req.file ? req.file.path : ""; // Get uploaded image path

        // Validate input
        if (!competitionName || !description || !position || !image) {
          return res.status(400).json({ message: "Invalid format" });
        }

        const newCompetition = {
          competitionName,
          description,
          position,
          image,
        };

        const result = await CompetitionsCollection.insertOne(newCompetition);
        res
          .status(201)
          .json({ message: "Competition created successfully", result });
      } catch (error) {
        console.error("Error creating competition:", error);
        res.status(500).json({ error: "Failed to create competition" });
      }
    });

    // GET request handler to retrieve all competitions
    app.get("/competitions", async (req, res) => {
      try {
        const competitions = await CompetitionsCollection.find({}).toArray();
        res.status(200).json(competitions);
      } catch (error) {
        console.error("Error retrieving competitions:", error);
        res.status(500).json({ error: "Failed to retrieve competitions" });
      }
    });

    // PUT request handler to update a competition
    app.put("/competitions/:id", upload.single("image"), async (req, res) => {
      try {
        const id = req.params.id;
        const updatedCompetition = {
          competitionName: req.body.competitionName,
          description: req.body.description,
          position: req.body.position,
        };

        if (req.file) {
          updatedCompetition.image = req.file.path; // Update image if new one is provided
        }

        const result = await CompetitionsCollection.updateOne(
          { _id: ObjectId.createFromHexString(id) },
          { $set: updatedCompetition }
        );

        if (result.matchedCount > 0) {
          res.status(200).json({ message: "Competition updated successfully" });
        } else {
          res.status(404).json({ message: "Competition not found" });
        }
      } catch (error) {
        console.error("Error updating competition:", error);
        res.status(500).json({ error: "Failed to update competition" });
      }
    });

    // DELETE request handler to delete a competition
    app.delete("/competitions/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await CompetitionsCollection.deleteOne({
          _id: ObjectId.createFromHexString(id),
        });

        if (result.deletedCount > 0) {
          res.status(200).json({ message: "Competition deleted successfully" });
        } else {
          res.status(404).json({ message: "Competition not found" });
        }
      } catch (error) {
        console.error("Error deleting competition:", error);
        res.status(500).json({ error: "Failed to delete competition" });
      }
    });
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => console.error(error));
