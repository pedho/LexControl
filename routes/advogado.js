const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const passport = require("passport")

router.get("/login", (req, res) => {
    res.render("advogado/login")
})

router.post("/login", (req, res, next) => {

    passport.authenticate("local", {
        successRedirect: "/inicio",
        failureRedirect: "/advogado/login",
        failureFlash: true
    })(req, res, next)
})

module.exports = router
