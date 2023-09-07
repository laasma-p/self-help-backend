const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const app = express();
dotenv.config();

app.use(cors());

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server is listening for requests on port ${PORT}`);
});
