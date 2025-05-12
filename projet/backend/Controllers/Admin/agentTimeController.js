// controllers/agentTimeController.js

exports.submitAgentTimeDetails = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            selectedCampaign,
            selectedUserGroup,
            shiftOption,
            displayAs,
            showParkHolds,
            timeInSeconds,
            searchArchivedData
        } = req.body;

        console.log('Received Agent Time Details:', {
            startDate,
            endDate,
            selectedCampaign,
            selectedUserGroup,
            shiftOption,
            displayAs,
            showParkHolds,
            timeInSeconds,
            searchArchivedData
        });

       

        const fakeReportData = {
            message: 'Report generated successfully!',
            reportData: [
                { agent: 'John Doe', loginTime: '08:00', logoutTime: '16:00', totalCalls: 45 },
                { agent: 'Jane Smith', loginTime: '09:00', logoutTime: '17:00', totalCalls: 50 }
            ]
        };

        return res.status(200).json(fakeReportData);

    } catch (error) {
        console.error('Error submitting agent time details:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
