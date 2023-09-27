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

app.post("/add-a-therapy-goal", async (req, res) => {
  try {
    const { therapyGoal } = req.body;

    const result = await db("therapy_goals").insert({
      therapy_goal: therapyGoal,
    });

    return res
      .status(201)
      .json({ message: "Therapy goal added successfully." });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.post("/add-a-value", async (req, res) => {
  try {
    const { value } = req.body;

    const result = await db("values").insert({
      value,
    });

    return res.status(201).json({ message: "Value added successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.get("/values", async (req, res) => {
  try {
    const values = await db("values").select("*");

    const formattedValues = values.map((value) => ({
      id: value.id,
      value: value.value,
    }));

    return res.status(200).json(formattedValues);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.delete("/values/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db("values").where({ id }).del();

    if (result === 0) {
      return res.status(404).json({ message: "Value not found." });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

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

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await db("users").where({ email }).first();

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    return res.status(200).json({ message: "Login successful" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.listen(PORT, () => {
  console.log(`Server is listening for requests on port ${PORT}`);
});
