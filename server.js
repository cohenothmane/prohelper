const bcrypt = require("bcrypt");

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const db = new sqlite3.Database("users.db");

app.use(cors());
app.use(bodyParser.json());

// Création des tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender TEXT,
      receiver TEXT,
      message TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Route : inscription
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Hachage du mot de passe
    const hash = await bcrypt.hash(password, 10);

    // Insertion dans la base
    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hash], function (err) {
      if (err) {
        return res.status(400).json({ message: "Erreur ou utilisateur déjà existant." });
      }
      res.json({ message: "Compte créé avec succès" });
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur." });
  }
});


// Route : connexion
app.post("/signin", (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, row) => {
    if (err || !row) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    const valid = await bcrypt.compare(password, row.password);
    if (valid) {
      res.json({ message: "Connexion réussie" });
    } else {
      res.status(401).json({ message: "Mot de passe incorrect" });
    }
  });
});


app.listen(3000, () => {
  console.log("Serveur lancé sur http://localhost:3000");
});



app.get("/users/:username", (req, res) => {
  const { username } = req.params;

  db.all("SELECT username FROM users WHERE username != ?", [username], (err, rows) => {
    if (err) return res.status(500).json({ message: "Erreur serveur." });
    res.json(rows);
  });
});

app.post("/message", (req, res) => {
  const { sender, receiver, message } = req.body;

  db.run("INSERT INTO messages (sender, receiver, message) VALUES (?, ?, ?)",
    [sender, receiver, message],
    function (err) {
      if (err) return res.status(500).json({ message: "Erreur d'envoi." });
      res.json({ message: "Message envoyé." });
    });
});


app.get("/messages/:user1/:user2", (req, res) => {
  const { user1, user2 } = req.params;

  db.all(`
    SELECT * FROM messages 
    WHERE (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?)
    ORDER BY timestamp ASC
  `,
    [user1, user2, user2, user1],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Erreur récupération." });
      res.json(rows);
    });
});

app.post('/send', (req, res) => {
  const { from, to, message } = req.body;
  if (!from || !to || !message) {
    return res.status(400).json({ message: "Champs manquants." });
  }

  db.run(
    `INSERT INTO messages (sender, recipient, content) VALUES (?, ?, ?)`,
    [from, to, message],
    function (err) {
      if (err) return res.status(500).json({ message: "Erreur lors de l’envoi." });
      res.json({ message: "Message envoyé !" });
    }
  );
});
