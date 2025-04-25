const connection = require('../../config/bd');

/**
 * Get recent activities from the admin log
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getRecentActivities = async (req, res) => {
    try {
        // Get limit parameter with default of 10
        const limit = parseInt(req.query.limit) || 10;
        
        // Query to get recent admin log entries
        const query = `
            SELECT 
                admin_log_id,
                event_date,
                user,
                event_section,
                event_type,
                record_id,
                event_code
            FROM 
                vicidial_admin_log
            ORDER BY 
                event_date DESC
            LIMIT ?
        `;
        
        const [rows] = await connection.execute(query, [limit]);
        
        // Transform the data to match the frontend's expected format
        const activities = rows.map(row => {
            // Determine activity type based on event_section
            let type = 'system';
            if (row.event_section.includes('CAMPAIGN')) {
                type = 'campaign';
            } else if (row.event_section.includes('CALL') || row.event_section.includes('LEAD')) {
                type = 'call';
            }
            
            // Determine status based on event_type
            let status = 'info';
            if (row.event_type === 'ADD' || row.event_type === 'COPY') {
                status = 'success';
            } else if (row.event_type === 'DELETE' || row.event_type === 'RESET') {
                status = 'error';
            } else if (row.event_type === 'MODIFY') {
                status = 'warning';
            }
            
            return {
                id: row.admin_log_id.toString(),
                type,
                description: `${row.event_type} ${row.event_section}`,
                target: row.record_id || row.event_code,
                timestamp: new Date(row.event_date),
                status,
                user: row.user
            };
        });
        
        res.json({
            success: true,
            data: activities
        });
        
    } catch (error) {
        console.error('Error fetching admin log activities:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching recent activities',
            error: error.message
        });
    }
};
