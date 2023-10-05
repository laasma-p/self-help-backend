const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const db = require("./db");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");

const app = express();
dotenv.config();

app.use(cors());

app.use(bodyParser.json());

const PORT = process.env.PORT;

app.get("/boundaries", async (req, res) => {
  try {
    const boundaries = await db("boundaries").select("*");

    return res.status(200).json(boundaries);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.post("/add-a-boundary", async (req, res) => {
  try {
    const { boundary, category, userId } = req.body;

    const result = await db("boundaries").insert({
      boundary,
      category,
      user_id: userId,
    });

    return res.status(201).json({
      message: "Boundary added successfully.",
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.post("/add-a-physical-goal", async (req, res) => {
  try {
    const { physicalGoal, userId } = req.body;

    const result = await db("physical_goals").insert({
      physical_goal: physicalGoal,
      user_id: userId,
    });

    return res
      .status(201)
      .json({ message: "Physical goal added successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.get("/physical-goals", async (req, res) => {
  try {
    const physicalGoals = await db("physical_goals").select("*");

    const formattedPhysicalGoals = physicalGoals.map((physicalGoal) => ({
      id: physicalGoal.id,
      physicalGoal: physicalGoal.physical_goal,
    }));

    return res.status(200).json(formattedPhysicalGoals);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.post("/add-a-problem", async (req, res) => {
  try {
    const { problem, userId } = req.body;

    const result = await db("problems").insert({
      problem,
      user_id: userId,
    });

    return res.status(201).json({ message: "Problem added successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.get("/problems", async (req, res) => {
  try {
    const problems = await db("problems").select("*");

    const formattedProblems = problems.map((problem) => ({
      id: problem.id,
      problem: problem.problem,
    }));

    return res.status(200).json(formattedProblems);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.post("/add-a-therapy-goal", async (req, res) => {
  try {
    const { therapyGoal, userId } = req.body;

    const result = await db("therapy_goals").insert({
      therapy_goal: therapyGoal,
      user_id: userId,
    });

    return res
      .status(201)
      .json({ message: "Therapy goal added successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.get("/therapy-goals", async (req, res) => {
  try {
    const therapyGoals = await db("therapy_goals").select("*");

    const formattedTherapyGoals = therapyGoals.map((therapyGoal) => ({
      id: therapyGoal.id,
      therapyGoal: therapyGoal.therapy_goal,
    }));

    return res.status(200).json(formattedTherapyGoals);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.delete("/therapy-goals/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db("therapy_goals").where({ id }).del();

    if (result === 0) {
      return res.status(404).json({ message: "Therapy goal not found." });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.post("/add-a-value", async (req, res) => {
  try {
    const { value, userId } = req.body;

    const result = await db("values").insert({
      value,
      user_id: userId,
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

    const userId = user.id;

    const token = jwt.sign(
      {
        userId: userId,
        email: user.email,
      },
      process.env.SECRET,
      {
        expiresIn: "2h",
      }
    );

    const jwtCookie = cookie.serialize("token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "test",
      path: "/",
    });

    res.setHeader("Set-Cookie", jwtCookie);

    return res.status(200).json({ message: "Login successful", token, userId });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.listen(PORT, () => {
  console.log(`Server is listening for requests on port ${PORT}`);
});
