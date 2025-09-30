const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");// pour autoriser les requêtes cross-origin

const app = express();
const db = new sqlite3.Database("users.db");

app.use(cors());
app.use(express.json());// <--- IMPORTANT pour que req.body fonctionne

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
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_name TEXT NOT NULL,
      creator TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS group_members (
      group_id INTEGER,
      username TEXT,
      FOREIGN KEY(group_id) REFERENCES groups(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS group_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER,
      sender TEXT,
      message TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(group_id) REFERENCES groups(id)
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
        console.error("UPDATE error:", err);
        return res.status(500).json({ message: "Erreur serveur lors de la connexion" });
      }
      res.json({ message: "Connexion réussie" });
    });
  });
});


// ✅ Liste des utilisateurs sauf moi
app.get("/users/:username", (req, res) => {
  const { username } = req.params;
  db.all("SELECT username FROM users WHERE username != ?", [username], (err, rows) => {
    if (err) return res.status(500).json({ message: "Erreur serveur." });
    res.json(rows);
  });
});

// 📜 Tous les utilisateurs (sauf moi)=)à=

app.get("/users", (req, res) => {
  db.all("SELECT username FROM users", [], (err, rows) => {
    if (err) return res.status(500).json({ message: "Erreur serveur." });
    res.json(rows);
  });
});

// recherche des user pour la création de groupes
app.get("/searchUser", (req, res) => {
  const query = `%${req.query.query}%`;
  db.all("SELECT username FROM users WHERE username LIKE ?", [query], (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.json(rows.map(r => r.username));
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

// Récupérer tous les groupes dont l'utilisateur est membre
app.get("/groups/:username", (req, res) => {
  const { username } = req.params;
  const sql = `
    SELECT g.id, g.group_name 
    FROM groups g
    JOIN group_members gm ON g.id = gm.group_id
    WHERE gm.username = ?
  `;
  db.all(sql, [username], (err, rows) => {
    if (err) return res.status(500).json({ message: "Erreur récupération groupes" });
    res.json(rows);
  });
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

// 📌 Créer un groupe
app.post("/groups", (req, res) => {
  const { group_name, creator } = req.body;

  db.run(
    "INSERT INTO groups (group_name, creator) VALUES (?, ?)",
    [group_name, creator],
    function (err) {
      if (err) return res.status(500).json({ message: "Erreur lors de la création du groupe." });

      const groupId = this.lastID;

      // Ajouter le créateur comme membre du groupe
      db.run(
        "INSERT INTO group_members (group_id, username) VALUES (?, ?)",
        [groupId, creator],
        (err2) => {
          if (err2) return res.status(500).json({ message: "Erreur ajout du créateur." });
          res.json({ message: "Groupe créé avec succès", groupId });
        }
      );
    }
  );
});

// 📌 Ajouter un membre dans un groupe
app.post("/groups/:groupId/add-member", (req, res) => {
  const { username } = req.body;
  const { groupId } = req.params;

  db.run(
    "INSERT INTO group_members (group_id, username) VALUES (?, ?)",
    [groupId, username],
    (err) => {
      if (err) return res.status(500).json({ message: "Erreur ajout membre." });
      res.json({ message: "Membre ajouté avec succès" });
    }
  );
});

// 📌 Récupérer les membres d’un groupe
app.get("/groups/:groupId/members", (req, res) => {
  const { groupId } = req.params;

  db.all(
    "SELECT username FROM group_members WHERE group_id = ?",
    [groupId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Erreur récupération membres." });
      res.json(rows);
    }
  );
});

// 📌 Envoyer un message de groupe
app.post("/groups/:groupId/messages", (req, res) => {
  const { sender, message } = req.body;
  const { groupId } = req.params;

  db.run(
    "INSERT INTO group_messages (group_id, sender, message) VALUES (?, ?, ?)",
    [groupId, sender, message],
    function (err) {
      if (err) return res.status(500).json({ message: "Erreur envoi message." });
      res.json({ message: "Message envoyé avec succès" });
    }
  );
});

// 📌 Récupérer les messages d’un groupe
app.get("/groups/:groupId/messages", (req, res) => {
  const { groupId } = req.params;

  db.all(
    "SELECT * FROM group_messages WHERE group_id = ? ORDER BY timestamp ASC",
    [groupId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Erreur récupération messages." });
      res.json(rows);
    }
  );
});

let typingStatus = {}; 
// ex: typingStatus["Alice->Bob"] = true

// Quand quelqu'un commence à taper
app.post("/typing", (req, res) => {
  const { from, to } = req.body;
  typingStatus[`${from}->${to}`] = true;
  res.json({ ok: true });
});

// Quand quelqu'un arrête de taper
app.post("/stopTyping", (req, res) => {
  const { from, to } = req.body;
  typingStatus[`${from}->${to}`] = false;
  res.json({ ok: true });
});

// Récupérer le statut typing d’un user
app.get("/typing/:from/:to", (req, res) => {
  const { from, to } = req.params;
  const status = typingStatus[`${from}->${to}`] || false;
  res.json({ typing: status });
});
