const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const passport = require("passport")
const {eUser} = require("../helpers/eUser")
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

router.get("/inicio", eUser, async(req, res) => {
  res.render("./index");
});

router.get('/clientes', eUser, async (req, res) => {
  
  try {
    const clientes = await prisma.cliente.findMany({
  where: {
    advogado_responsavel_id: req.user.usuario_id
  },
  orderBy: {
    cliente_id: "desc"
  }
});

    res.render("advogado/clientes", {clientes: clientes});
  } catch (erros) {
    console.error(erros);
    req.flash("error_msg", "Erro ao listar clientes");
    res.redirect("/");
  }  
})

router.get('/clientes/add', eUser, (req, res) => {
    res.render("advogado/addcliente")
})

router.post("/clientes/add", async (req, res) => {
  try {
    
    const { nome, telefone, endereco, email, cpf_cnpj }  = req.body;

    await prisma.cliente.create({
    data: {
    nome: req.body.nome,
    telefone: req.body.telefone,
    endereco: req.body.endereco,
    email: req.body.email,
    cpf_cnpj: req.body.cpf_cnpj,
    advogado_responsavel_id: req.user.usuario_id 
    }
});

    req.flash("success_msg", "Cliente adicionado com sucesso");
    res.redirect("/advogado/clientes");

  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Erro ao criar cliente");
    res.redirect("/advogado/clientes");
  }
});

router.get("/clientes/edit/:id", eUser, (req, res) => {
  const clienteId = Number(req.params.id);

  prisma.cliente.findUnique({
    where: { cliente_id: clienteId }
  })
  .then((cliente) => {
    if (!cliente) {
      req.flash("error_msg", "Cliente não existente");
      return res.redirect("/advogado/clientes");
    }
    res.render("advogado/editcliente", { cliente });
  })
  .catch((err) => {
    console.error(err);
    req.flash("error_msg", "Erro ao buscar cliente");
    res.redirect("/advogado/clientes");
  });
    
})

router.post("/clientes/edit", async (req, res) => {
  const clienteId = Number(req.body.id); 
  const { nome, telefone, endereco, email, cpf_cnpj } = req.body;

  try {
    
    const dados = { nome, telefone, endereco, email, cpf_cnpj };

    await prisma.cliente.update({
      where: { cliente_id: clienteId },
      data: dados,
    });

    req.flash("success_msg", "Cliente editado com sucesso");
    res.redirect("/advogado/clientes");
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Erro ao editar cliente");
    res.redirect("/advogado/clientes");
  }
});


router.post("/clientes/deletar", eUser, async (req, res) => {
  try {
    const id = Number(req.body.id);

    await prisma.cliente.delete({
      where: { cliente_id: id }
    });

    req.flash("success_msg", "Cliente deletado com sucesso!");
    res.redirect("/advogado/clientes");

  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Erro ao deletar cliente");
    res.redirect("/advogado/clientes");
  }
});
module.exports = router
