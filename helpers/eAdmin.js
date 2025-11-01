module.exports = {
    eAdmin: function(req, res, next){

        if(req.isAuthenticated() && req.user.eAdmin){
            return next();
        }
        req.flash("error_msg", "Você deve ser adm!")
        res.redirect("/")
    }

}