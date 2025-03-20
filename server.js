const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
const PORT = 3000;

// Connexion à la base de données SQLite
const db = new sqlite3.Database("./data_base_bds.db", (err) => {
    if (err) {
        console.error("Erreur de connexion à la base de données :", err.message);
    } else {
        console.log("Connexion réussie à SQLite !");
    }
});

// Middleware pour le traitement des données JSON et URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware pour servir les fichiers statiques et templates
app.use("/static", express.static(path.join(__dirname, "static")));
app.use("/back", express.static(path.join(__dirname, "back")));

// Routes pour les pages HTML
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "/templates/index.html")));
app.get("/galerie.html", (req, res) => res.sendFile(path.join(__dirname, "/templates/galerie.html")));
app.get("/evenement.html", (req, res) => res.sendFile(path.join(__dirname, "/templates/evenement.html")));
app.get("/contact.html", (req, res) => res.sendFile(path.join(__dirname, "/templates/contact.html")));
app.get("/login.html", (req, res) => res.sendFile(path.join(__dirname, "/templates/login.html")));
app.get("/register.html", (req, res) => res.sendFile(path.join(__dirname, "/templates/register.html")));

// Route pour l'inscription
app.post("/register", (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "Tous les champs sont requis !" });
    }

    // Vérification si l'email existe déjà
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
        if (err) {
            return res.status(500).json({ message: "Erreur serveur" });
        }

        if (user) {
            return res.status(400).json({ message: "Email déjà utilisé" });
        }

        // Hashing du mot de passe avec bcrypt
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                return res.status(500).json({ message: "Erreur lors du hachage du mot de passe" });
            }

            // Insertion du nouvel utilisateur
            db.run("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", [username, email, hash], (err) => {
                if (err) {
                    return res.status(500).json({ message: "Erreur d'inscription" });
                }
                res.status(200).json({ message: "Utilisateur créé avec succès" });
            });
        });
    });
});


// Route pour la connexion
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    // Recherche de l'utilisateur
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
        if (err) {
            return res.status(500).json({ message: "Erreur serveur" });
        }

        if (!user) {
            return res.status(400).json({ message: "Utilisateur non trouvé" });
        }

        // Comparaison des mots de passe
        bcrypt.compare(password, user.password, (err, result) => {
            if (err || !result) {
                return res.status(400).json({ message: "Mot de passe incorrect" });
            }

            // Connexion réussie
            res.status(200).json({ message: "Connexion réussie", user });
        });
    });
});

// Lancer le serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
