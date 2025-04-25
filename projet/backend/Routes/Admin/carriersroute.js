const express = require('express');
const router = express.Router();

const carriersController = require('../../Controllers/Admin/carriercontroller');

router.get('/', carriersController.getCarriers);
router.put('/:id', carriersController.updateCarrier);
router.post('/', carriersController.addCarrier);

module.exports = router;
