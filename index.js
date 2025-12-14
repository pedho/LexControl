const express = require("express");
const app = express();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require("path")
const admin = require("./routes/admin")
const advogado = require("./routes/advogado")
const bodyParser = require("body-parser")
const bcrypt = require("bcryptjs");
const flash = require("connect-flash")
const session = require("express-session"); 
const passport = require("passport")
require("./config/auth")(passport)
const {eUser} = require("./helpers/eUser")

app.set("view engine", "ejs");
app.set('views', './views')
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")))

app.use(session({
        secret: "lexcontrollexcontrol",
        resave: true,
        saveUninitialized: true
    }))

app.use((req, res, next) => {
    res.locals.eUser = req.session.user || null;
    next();
});

app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

app.use((req, res, next) => {
      res.locals.success_msg = req.flash("success_msg")
      res.locals.error_msg = req.flash("error_msg")
      res.locals.error = req.flash("error")
      res.locals.user = req.user || null;
      res.locals.eAdmin = req.user?.eAdmin === 1;
      next()
})
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

async function addAdmin() {
  try {
    const admin = await prisma.usuario.findFirst({
      where: { eAdmin: 1 }
    });

    if (!admin) {
      const senhaHash = await bcrypt.hash("lex123", 10);

      await prisma.usuario.create({
        data: {
          nome: "Administrador LexControl",
          email: "admin@lexcontrol.com",
          senha: senhaHash,
          eAdmin: 1
        }
      });

    } else {
      
    }
  } catch (err) {
    
  }
}

addAdmin().then(() => {
  app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000");
  });
});

app.get("/", async(req, res) => {
  res.render("./advogado/login");
});

app.get("/logout", (req, res) => {
    req.logout(function(err) {
        if (err) {
            req.flash("error_msg", "Erro ao deslogar");
            return res.redirect("/");
        }
        req.flash("success_msg", "Sessão encerrada");
        res.redirect("/");
    });
});

app.get("/inicio", eUser, async(req, res) => {
  res.render("index");
});

app.use('/admin', admin)
app.use('/advogado', advogado)

module.exports = prisma;