module.exports = {
    eUser: function(req, res, next){

        if(req.isAuthenticated()){
            return next();
        }
        req.flash("error_msg", "Você deve estar conectado!")
        res.redirect("/")
    }
}