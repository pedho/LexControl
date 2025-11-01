const LocalStrategy = require("passport-local").Strategy
const bcrypt = require("bcryptjs")
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

module.exports = function (passport) {
  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "senha" },
      async (email, senha, done) => {
        try {
          
          const usuario = await prisma.usuario.findUnique({
            where: { email },
          })

          if (!usuario) {
            return done(null, false, { message: "Conta não existente" })
          }

          
          const senhaCorreta = await bcrypt.compare(senha, usuario.senha)
          if (!senhaCorreta) {
            return done(null, false, { message: "Senha incorreta" })
          }

          return done(null, usuario)
        } catch (err) {
          return done(err)
        }
      }
    )
  )


  passport.serializeUser((usuario, done) => {
    done(null, usuario.usuario_id)
  })

  
  passport.deserializeUser(async (id, done) => {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { usuario_id: id },
      })
      done(null, usuario)
    } catch (err) {
      done(err, null)
    }
  })
}