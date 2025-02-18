// controllers/userController.js
const db = require('../../config/bd'); // Assurez-vous que ce chemin est correct
const bcrypt = require('bcryptjs');

const checkUserExists = async (userNumber) => {
    const [rows] = await db.query('SELECT * FROM vicidial_users WHERE user= ?', [userNumber]);
    return rows.length > 0;
};

const insertUser = async (newUser) => {
    await db.query('INSERT INTO vicidial_users SET ?', newUser);
};

// create new user 
exports.createUser = async (req, res) => {
    const {
        user,
        pass,
        full_name,
        user_level ,
        user_group ,
        phone_login,
        phone_pass,
    } = req.body;

    // Validation des champs obligatoires
    if (!user|| !pass || !full_name) {
        return res.status(400).json({ message: 'User Number, Password, and Full Name are required.' });
    }

    try {
        // Vérification de l'existence de l'utilisateur
        const userExists = await checkUserExists(user);
        if (userExists) {
            return res.status(400).json({ message: 'User already exists.' });
        }

        // Hashage du mot de passe
        const hashedPassword = await bcrypt.hash(pass, 10);

        // Création de l'utilisateur
        const newUser = {
            user: user,
            pass: hashedPassword,
            full_name: full_name,
            user_level: user_level,
            user_group: user_group,
            phone_login: phone_login,
            phone_pass: phone_pass,
        };

        // Insertion de l'utilisateur
        await insertUser(newUser);
        res.status(201).json({ message: 'User created successfully.' });
    } catch (error) {
        console.error('Error creating user:', error); // Log de l'erreur pour le développement
        res.status(500).json({ message: 'An error occurred, please try again later.' });
    }
};

// Retrieve all users
exports.getUsers = async (req, res) => {
    try {
        const [users] = await db.query('SELECT * FROM vicidial_users');
        res.json(users);
    } catch (error) {
        console.error('Error retrieving users:', error);
        res.status(500).json({ message: 'An error occurred, please try again later.' });
    }
};

// Retrieve user by ID
exports.getUserById = async (req, res) => {
    const { userId } = req.params;

    try {
        const [user] = await db.query('SELECT * FROM vicidial_users WHERE user_id = ?', [userId]);
        
        
        if (user.length<1) {
            console.log('user not fouund');
            
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error retrieving user by ID:', error);
        res.status(500).json({ message: 'An error occurred, please try again later.' });
    }
};