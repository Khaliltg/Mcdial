const db = require('../../config/bd'); // Ensure this path is correct
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Setup multer for handling file uploads
const storage = multer.memoryStorage(); // Use memory storage for easy buffer access
const upload = multer({ storage: storage }).single('file'); // Expect a single file with the name 'file'

// Function to add a prospect
exports.addProspect = async (req, res) => {
    const {
        name, phone, email, address1, address2, address3, city, state,
        postalCode, province, country, dateOfBirth, show, vendorId,
        rank, owner, comments, listId, phone_code, title, firstName,
        middleInitial, lastName, entryDate, modifyDate, status,
        vendorLeadCode, sourceId, gmtOffsetNow, calledSinceLastReset,
        altPhone, securityPhrase, calledCount, lastLocalCallTime
    } = req.body;

    console.log(req.body);

    // Check for required fields
    if (!name || !phone || !listId || !phone_code) {
        console.log("Prob here - champs manquants");
        return res.status(400).json({ error: "Tous les champs requis ne sont pas fournis." });
    }

    try {
        console.log("Ajout du prospect :", req.body);
        const query = `
            INSERT INTO vicidial_list (
                entry_date, modify_date, status, user, vendor_lead_code,
                source_id, list_id, gmt_offset_now, called_since_last_reset,
                phone_code, phone_number, title, first_name, middle_initial,
                last_name, address1, address2, address3, city, state,
                province, postal_code, country_code, gender, date_of_birth,
                alt_phone, email, security_phrase, comments, called_count,
                last_local_call_time, rank, owner
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?
            )
        `;

        // Execute the query with the values
        const [result] = await db.query(query, [
            entryDate, modifyDate, status, name, vendorLeadCode,
            sourceId, listId, gmtOffsetNow, calledSinceLastReset, phone_code,
            phone, title, firstName, middleInitial, lastName, address1,
            address2, address3, city, state, province, postalCode, country,
            null, dateOfBirth, altPhone, email, securityPhrase, comments,
            calledCount, lastLocalCallTime, rank, owner
        ]);

        res.json({ id: result.insertId, ...req.body });
    } catch (err) {
        console.error("Erreur lors de l'ajout du prospect :", err);
        return res.status(500).json({ error: err.message });
    }
};

// Upload leads function
exports.uploadLeads = async (req, res) => {
    // Check if the uploaded file exists
    const file = req.file; // Access the uploaded file
    const { listIdOverride, fileLayout } = req.body; // Access the other form fields

    if (!file) {
        console.log("File not found");
        return res.status(400).json({ error: "Aucun fichier n'a été téléchargé." });
    }

    // Logic to process the uploaded file
    const uploadsDir = path.join(__dirname, 'uploads');
    // Ensure the uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
    }

    const filePath = path.join(uploadsDir, file.originalname);
    fs.writeFileSync(filePath, file.buffer); // Save the file to filesystem

    // Logic to insert data into the database
    try {
        const query = `
            INSERT INTO vicidial_lists_fields (list_id, file_layout, file_path)
            VALUES (?, ?, ?)
        `;
        
        const [result] = await db.query(query, [listIdOverride, fileLayout, filePath]);
        res.json({ id: result.insertId, message: 'Leads chargés avec succès' });
    } catch (err) {
        console.error("Erreur lors du chargement des leads :", err);
        return res.status(500).json({ error: "Erreur serveur lors du chargement des leads." });
    }
};