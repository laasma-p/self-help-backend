const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const db = require("./db");

const app = express();
dotenv.config();

app.use(cors());

app.use(bodyParser.json());

const PORT = process.env.PORT;

app.post("/sign-up", async (req, res) => {
  try {
    const { email, password } = req.body;

    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);

    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await db("users").insert({
      email,
      password: hashedPassword,
    });

    return res.status(201).json({ message: "User registered successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.listen(PORT, () => {
  console.log(`Server is listening for requests on port ${PORT}`);
});
