
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
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_connected INTEGER DEFAULT 0
    );
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

// 🔐 Route : inscription
app.post("/signup", (req, res) => {
  const { username, password } = req.body;

  db.run(
    "INSERT INTO users (username, password) VALUES (?, ?)",
    [username, password],
    function (err) {
      if (err) {
        return res.status(400).json({ message: "Erreur ou utilisateur déjà existant." });
      }
      res.json({ message: "Compte créé avec succès" });
    }
  );
});


// 🔓 Route : connexion
app.post("/signin", (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
    if (err || !row) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    if (password !== row.password) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    db.run("UPDATE users SET is_connected = 1 WHERE username = ?", [username], (err) => {
      if (err) {
        return res.status(500).json({ message: "Erreur serveur lors de la connexion" });
      }
      res.json({ message: "Connexion réussie" });
    });
  });
});


// ✅ Liste des utilisateurs connectés (sauf moi)
app.get("/connected-users/:username", (req, res) => {
  const { username } = req.params;
  db.all(
    "SELECT username FROM users WHERE is_connected = 1 AND username != ?",
    [username],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Erreur serveur." });
      res.json(rows);
    }
  );
});

// 📜 Tous les utilisateurs (sauf moi)=)à=

app.get("/users/:username", (req, res) => {
  const { username } = req.params;
  db.all("SELECT username FROM users WHERE username != ?", [username], (err, rows) => {
    if (err) return res.status(500).json({ message: "Erreur serveur." });
    res.json(rows);
  });
});

// ✉️ Envoi de message
app.post("/message", (req, res) => {
  const { sender, receiver, message } = req.body;

  if (!sender || !receiver || !message) {
    return res.status(400).json({ message: "Champs manquants." });
  }

  db.run(
    "INSERT INTO messages (sender, receiver, message) VALUES (?, ?, ?)",
    [sender, receiver, message],
    function (err) {
      if (err) return res.status(500).json({ message: "Erreur d'envoi." });
      res.json({ message: "Message envoyé." });
    }
  );
});

// 📩 Récupération des messages entre 2 utilisateurs
app.get("/messages/:user1/:user2", (req, res) => {
  const { user1, user2 } = req.params;

  db.all(
    `
    SELECT * FROM messages 
    WHERE (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?)
    ORDER BY timestamp ASC
  `,
    [user1, user2, user2, user1],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Erreur récupération." });
      res.json(rows);
    }
  );
});

// 🚀 Lancement du serveur
app.listen(3000, () => {
  console.log("✅ Serveur lancé sur http://localhost:3000");
});

// 🚪 Déconnexion
app.post("/signout", (req, res) => {
  const { username } = req.body;

  db.run("UPDATE users SET is_connected = 0 WHERE username = ?", [username], (err) => {
    if (err) {
      return res.status(500).json({ message: "Erreur lors de la déconnexion." });
    }
    res.json({ message: "Déconnexion réussie." });
  });
});
