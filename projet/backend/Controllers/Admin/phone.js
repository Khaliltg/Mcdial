const db = require("../../config/bd")

// Get all phones (already provided)
exports.getPhoneList = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM phones")
    res.status(200).json(rows)
  } catch (error) {
    console.error("Error fetching phones:", error)
    res.status(500).json({ message: "An error occurred while fetching phones." })
  }
}

// Get a single phone by extension
exports.getPhoneByExtension = async (req, res) => {
  try {
    const { extension } = req.params
    const [rows] = await db.query("SELECT * FROM phones WHERE extension = ?", [extension])

    if (rows.length === 0) {
      return res.status(404).json({ message: "Phone not found" })
    }

    res.status(200).json(rows[0])
  } catch (error) {
    console.error("Error fetching phone:", error)
    res.status(500).json({ message: "An error occurred while fetching the phone." })
  }
}

// Create a new phone
exports.createPhone = async (req, res) => {
  console.log("test");
  
  try {
    const {
      extension,
      dialplan_number,
      voicemail_id,
      phone_ip,
      computer_ip,
      server_ip,
      login,
      pass,
      status,
      active,
      phone_type,
      fullname,
      protocol,
    } = req.body

    // Basic validation
    if (!extension) {
      return res.status(400).json({ message: "Extension is required" })
    }

    const query = `
            INSERT INTO phones (
                extension, dialplan_number, voicemail_id, phone_ip, computer_ip, 
                server_ip, login, pass, status, active, phone_type, fullname,
                protocol
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `

    const [result] = await db.query(query, [
      extension,
      dialplan_number || null,
      voicemail_id || null,
      phone_ip || null,
      computer_ip || null,
      server_ip || null,
      login || null,
      pass || null,
      status || null,
      active || "N",
      phone_type || null,
      fullname || null,
      protocol || "SIP",
    ])

    res.status(201).json({
      message: "Phone created successfully",
      extension: extension,
    })
  } catch (error) {
    console.error("Error creating phone:", error)
    res.status(500).json({ message: "An error occurred while creating the phone." })
  }
}

// Update a phone
exports.updatePhone = async (req, res) => {
  try {
    const currentExtension = req.params.extension;
    const updateData = { ...req.body };

    // Check if phone exists
    const [checkRows] = await db.query("SELECT * FROM phones WHERE extension = ?", [currentExtension]);
    if (checkRows.length === 0) {
      return res.status(404).json({ message: "Phone not found" });
    }

    // Remove extension from updateData to prevent extension updates
    delete updateData.extension;

    // Build dynamic update query for other fields
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updateData)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "No fields to update provided" });
    }

    // Update fields
    values.push(currentExtension); // Add extension for WHERE clause
    const query = `UPDATE phones SET ${fields.join(", ")} WHERE extension = ?`;
    await db.query(query, values);

    return res.status(200).json({ 
      message: "Phone updated successfully",
      extension: currentExtension
    });
  } catch (error) {
    console.error("Error updating phone:", error)
    res.status(500).json({ message: "An error occurred while updating the phone." })
  }
}

// Delete a phone
exports.deletePhone = async (req, res) => {
  try {
    const { extension } = req.params

    // Check if phone exists
    const [checkRows] = await db.query("SELECT * FROM phones WHERE extension = ?", [extension])
    if (checkRows.length === 0) {
      return res.status(404).json({ message: "Phone not found" })
    }

    await db.query("DELETE FROM phones WHERE extension = ?", [extension])

    res.status(200).json({ message: "Phone deleted successfully" })
  } catch (error) {
    console.error("Error deleting phone:", error)
    res.status(500).json({ message: "An error occurred while deleting the phone." })
  }
}

// Update phone status
exports.updatePhoneStatus = async (req, res) => {
  try {
    const { extension } = req.params
    const { status } = req.body

    if (!status) {
      return res.status(400).json({ message: "Status is required" })
    }

    // Check if phone exists
    const [checkRows] = await db.query("SELECT * FROM phones WHERE extension = ?", [extension])
    if (checkRows.length === 0) {
      return res.status(404).json({ message: "Phone not found" })
    }

    await db.query("UPDATE phones SET status = ? WHERE extension = ?", [status, extension])

    res.status(200).json({ message: "Phone status updated successfully" })
  } catch (error) {
    console.error("Error updating phone status:", error)
    res.status(500).json({ message: "An error occurred while updating the phone status." })
  }
}

// Get phones by status
exports.getPhonesByStatus = async (req, res) => {
  try {
    const { status } = req.params

    const [rows] = await db.query("SELECT * FROM phones WHERE status = ?", [status])

    res.status(200).json(rows)
  } catch (error) {
    console.error("Error fetching phones by status:", error)
    res.status(500).json({ message: "An error occurred while fetching phones by status." })
  }
}
