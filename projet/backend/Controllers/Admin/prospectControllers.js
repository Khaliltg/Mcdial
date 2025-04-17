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

const csv = require('csv-parser');
const { Readable } = require('stream');

// Fonction pour importer les leads
exports.uploadLeads = async (req, res) => {
    const file = req.file;
    const { listIdOverride } = req.body;

    if (!file) {
        return res.status(400).json({ error: "Aucun fichier n'a été téléchargé." });
    }

    const results = [];

    try {
        // Lire depuis le buffer
        const stream = Readable.from(file.buffer.toString());

        stream
            .pipe(csv({ separator: ';' })) // adaptateur selon ton fichier
            .on('data', (row) => results.push(row))
            .on('end', async () => {
                let insertCount = 0;

                for (const row of results) {
                    try {
                        const values = [
                            new Date(),            // entry_date
                            new Date(),            // modify_date
                            'NEW',                 // status
                            'admin',               // user
                            '',                    // vendor_lead_code
                            '',                    // source_id
                            listIdOverride || 1001, // list_id
                            '+1',                  // gmt_offset_now
                            'N',                   // called_since_last_reset
                            '33',                  // phone_code
                            row.phone_number || '',
                            '',                    // title
                            row.first_name || '',
                            '',                    // middle_initial
                            row.last_name || '',
                            row.adress1 || '',
                            '',                    // address2
                            '',                    // address3
                            row.city || '',
                            '',                    // state
                            '',                    // province
                            row.code || '',
                            'FR',                  // country_code
                            row.genre === 'mr' ? 'M' : 'F',
                            '',          // date_of_birth
                            '',                    // alt_phone
                            row.email || '',
                            '',                    // security_phrase
                            '',                    // comments
                            0,                     // called_count
                            new Date(),            // last_local_call_time
                            1,                     // rank
                            'admin'                // owner
                        ];

                        const query = `
                            INSERT INTO vicidial_list (
                                entry_date, modify_date, status, user, vendor_lead_code,
                                source_id, list_id, gmt_offset_now, called_since_last_reset,
                                phone_code, phone_number, title, first_name, middle_initial,
                                last_name, address1, address2, address3, city, state,
                                province, postal_code, country_code, gender, date_of_birth,
                                alt_phone, email, security_phrase, comments, called_count,
                                last_local_call_time, rank, owner
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `;

                        await db.query(query, values);
                        insertCount++;

                    } catch (err) {
                        console.error("Erreur ligne ignorée :", err.message);
                        continue;
                    }
                }

                res.json({ message: `Import terminé avec succès. ${insertCount} leads insérés.` });
            });

    } catch (err) {
        console.error("Erreur de parsing :", err);
        res.status(500).json({ error: "Erreur serveur pendant le traitement du fichier." });
    }
};
