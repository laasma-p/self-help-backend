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

app.use((req, res, next) => {
  if (req.path === "/login" || req.path === "/sign-up") {
    return next();
  }

  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  jwt.verify(token, process.env.SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };
    next();
  });
});

app.put("/track-boundary/:userId/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.params.userId;
    const startTrackingTime = new Date();

    const result = await db("boundaries")
      .where({ id, user_id: userId })
      .update({ is_tracking: true, added_date: startTrackingTime });

    if (result === 0) {
      return res.status(404).json({ message: "Boundary not found." });
    }

    return res.status(200).json({ message: "Boundary is now being tracked." });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.get("/recent-boundaries/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const recentBoundaries = await db("boundaries")
      .where({ user_id: userId })
      .orderBy("id", "desc")
      .limit(3);

    return res.status(200).json(recentBoundaries);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.get("/boundary-count/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const myBoundariesCount = await db("boundaries")
      .where({ user_id: userId, category: "my-boundary" })
      .count("* as count")
      .first();

    const othersBoundariesCount = await db("boundaries")
      .where({ user_id: userId, category: "others-boundary" })
      .count("* as count")
      .first();

    return res.status(200).json({
      myBoundariesCount: myBoundariesCount.count,
      othersBoundariesCount: othersBoundariesCount.count,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.get("/boundaries/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const boundaries = await db("boundaries")
      .where({ user_id: userId })
      .select("*");

    return res.status(200).json(boundaries);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.post("/add-a-boundary/:userId", async (req, res) => {
  try {
    const { boundary, category } = req.body;
    const userId = req.params.userId;

    const dateAdded = new Date();

    const result = await db("boundaries").insert({
      boundary,
      category,
      user_id: userId,
      date_added: dateAdded,
    });

    return res.status(201).json({
      message: "Boundary added successfully.",
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.delete("/boundaries/:userId/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db("boundaries").where({ id }).del();

    if (result === 0) {
      return res.status(404).json({ message: "Boundary not found." });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.post("/add-a-physical-goal/:userId", async (req, res) => {
  try {
    const { physicalGoal } = req.body;
    const userId = req.params.userId;

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

app.get("/physical-goals/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const physicalGoals = await db("physical_goals")
      .where({ user_id: userId })
      .select("*");

    const formattedPhysicalGoals = physicalGoals.map((physicalGoal) => ({
      id: physicalGoal.id,
      physicalGoal: physicalGoal.physical_goal,
    }));

    return res.status(200).json(formattedPhysicalGoals);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.delete("/physical-goals/:userId/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db("physical_goals").where({ id }).del();

    if (result === 0) {
      return res.status(404).json({ message: "Physical goal not found." });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.post("/add-a-problem/:userId", async (req, res) => {
  try {
    const { problem } = req.body;
    const userId = req.params.userId;

    const result = await db("problems").insert({
      problem,
      user_id: userId,
    });

    return res.status(201).json({ message: "Problem added successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.get("/problems/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const problems = await db("problems")
      .where({ user_id: userId })
      .select("*");

    const formattedProblems = problems.map((problem) => ({
      id: problem.id,
      problem: problem.problem,
    }));

    return res.status(200).json(formattedProblems);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.delete("/problems/:userId/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db("problems").where({ id }).del();

    if (result === 0) {
      return res.status(404).json({ message: "Problem not found." });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.post("/add-a-therapy-goal/:userId", async (req, res) => {
  try {
    const { therapyGoal } = req.body;
    const userId = req.params.userId;

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

app.get("/therapy-goals/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const therapyGoals = await db("therapy_goals")
      .where({ user_id: userId })
      .select("*");

    const formattedTherapyGoals = therapyGoals.map((therapyGoal) => ({
      id: therapyGoal.id,
      therapyGoal: therapyGoal.therapy_goal,
    }));

    return res.status(200).json(formattedTherapyGoals);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.delete("/therapy-goals/:userId/:id", async (req, res) => {
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

app.post("/add-a-value/:userId", async (req, res) => {
  try {
    const { value } = req.body;
    const userId = req.params.userId;

    const result = await db("values").insert({
      value,
      user_id: userId,
    });

    return res.status(201).json({ message: "Value added successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.get("/values/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const values = await db("values").where({ user_id: userId }).select("*");

    const formattedValues = values.map((value) => ({
      id: value.id,
      value: value.value,
    }));

    return res.status(200).json(formattedValues);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.delete("/values/:userId/:id", async (req, res) => {
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
    const { firstName, lastName, email, password } = req.body;

    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);

    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await db("users").insert({
      first_name: firstName,
      last_name: lastName,
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
