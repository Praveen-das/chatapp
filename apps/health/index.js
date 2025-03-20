import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send('test server');
});

app.get("/health", (req, res) => {
  res.json({ status: "good" });
});

app.listen(3003,()=>console.log('Server running on port 3003'))
