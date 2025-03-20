const express = require("express");
const nodemailer = require('nodemailer');
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require('body-parser');
const bcrypt = require("bcrypt");
const session = require("express-session");
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

// Middleware pour gérer les sessions
app.use(session({
    secret: 'tonSecretDeSession', // Remplace ça par un secret sécurisé
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // Mettre à true si tu utilises HTTPS
}));

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
app.get("/compte.html", (req, res) => res.sendFile(path.join(__dirname, "/templates/compte.html")));
// Middleware pour parser les données du formulaire
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Route pour afficher la page de contact
app.get('/contact.html', (req, res) => {
    res.sendFile(__dirname + '/contact.html'); // Remplace avec ton chemin correct
});

// Route pour traiter le formulaire de contact
app.post('/send-contact', (req, res) => {
    const { nom, email, message } = req.body;

    // Configuration de Nodemailer (ici, par exemple, avec un service Gmail)
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'direction.globaltradings@gmail.com',
            pass: 'fchr zeyo bfan inhv'
        }
    });

    const mailOptions = {
        from: email, // Email de l'expéditeur
        to: 'baba78450molko@gmail.com', // Ton email où tu veux recevoir les messages
        subject: 'Question Etudiant',
        text: `Nom: ${nom}\nEmail: ${email}\nMessage: ${message}`
    };

    // Envoi de l'email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).json({ message: 'Erreur lors de l\'envoi du message.' });
        }
        res.json({ message: 'Message envoyé avec succès !' });
    });
});


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
 // Si la connexion est réussie, on stocke l'utilisateur dans la session
            req.session.userId = user.id;  // Ici, on stocke l'ID de l'utilisateur dans la session
            res.status(200).json({ message: "Connexion réussie", user });
        });
    });
});

// Vérifier si l'utilisateur est connecté
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    } else {
        return res.status(401).json({ message: "Utilisateur non authentifié" });
    }
}

// Exemple d'une route protégée, accessible seulement si l'utilisateur est connecté
app.get("/profile", isAuthenticated, (req, res) => {
    // Ici, tu pourrais récupérer et afficher les informations de l'utilisateur
    res.json({ message: "Page de profil", userId: req.session.userId });
});
app.get("/", (req, res) => {
    // Vérifie si l'utilisateur est connecté
    const isLoggedIn = req.session.userId ? true : false;
    res.render("index.html", { isLoggedIn });
});
app.get("/check-session", (req, res) => {
    // Vérifie si la session est active (si l'utilisateur est connecté)
    if (req.session.userId) {
        res.json({ isLoggedIn: true });
    } else {
        res.json({ isLoggedIn: false });
    }
});
app.get("/profile", (req, res) => {
    if (req.session.userId) {
        // L'utilisateur est connecté, on lui envoie la page avec son nom
        res.render("profile.html", { username: req.session.username });
    } else {
        // Si l'utilisateur n'est pas connecté, on le redirige vers la page de connexion
        res.redirect("/login.html");
    }
});
app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: "Erreur lors de la déconnexion" });
        }
        res.redirect("/login.html");  // Redirige l'utilisateur vers la page de connexion
    });
});


// Lancer le serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
