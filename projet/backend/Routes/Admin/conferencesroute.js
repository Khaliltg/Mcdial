const express = require('express');
const router = express.Router();
const controller = require('../../Controllers/Admin/conferencescontroller');

router.get('/', controller.getAllConferences);
router.post('/', controller.createConference);
router.put('/:id', controller.updateConference);
router.get('/server_ips', controller.getServerIPs);
router.put('/:conference', controller.updateConference);


module.exports = router;
