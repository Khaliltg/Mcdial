const express = require("express")
const {
  getPhoneList,
  getPhoneByExtension,
  createPhone,
  updatePhone,
  deletePhone,
  updatePhoneStatus,
  getPhonesByStatus,
} = require("../../Controllers/Admin/phone")

const router = express.Router()

// Phone routes
router.get("/list", getPhoneList)
router.get("/:extension", getPhoneByExtension)
router.get("/status/:status", getPhonesByStatus)
router.post("/", createPhone)
router.put("/:extension", updatePhone)
router.delete("/:extension", deletePhone)
router.patch("/:extension/status", updatePhoneStatus)


module.exports = router
