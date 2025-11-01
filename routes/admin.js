const express = require("express")
const router = express.Router()

router.get("/", (req, res) => {
  res.send("Painel do admin")
})

module.exports = router
