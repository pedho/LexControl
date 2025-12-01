const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const passport = require("passport")
const {eAdmin} = require("../helpers/eAdmin")
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get("/", (req, res) => {
  res.send("Painel do admin")
})

router.get("/inicio", eAdmin, async(req, res) => {
  res.render("index");
});

router.get('/advogados', eAdmin, async (req, res) => {
  
  try {
    const advogados = await prisma.usuario.findMany({
      orderBy: { usuario_id: "desc" }
    });

    res.render("admin/advogados", {advogados: advogados});
  } catch (erros) {
    console.error(erros);
    req.flash("error_msg", "Erro ao listar advogados");
    res.redirect("/admin");
  }  
})

router.get('/advogados/add', eAdmin, (req, res) => {
    res.render("admin/addadvogado")
})

router.post("/advogados/add", async (req, res) => {
  try {
    
    const { nome, email, senha_pura }  = req.body;
    const senha = await bcrypt.hash(req.body.senha_pura, 10)

    await prisma.usuario.create({
      data: {
        nome,
        email,
        senha
      }
    });

    req.flash("success_msg", "Advogado adicionado com sucesso");
    res.redirect("/admin/advogados");

  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Erro ao criar advogado");
    res.redirect("/");
  }
});

router.get("/advogados/edit/:id", eAdmin, (req, res) => {
  const usuarioId = Number(req.params.id);

  prisma.usuario.findUnique({
    where: { usuario_id: usuarioId }
  })
  .then((usuario) => {
    if (!usuario) {
      req.flash("error_msg", "Advogado não existente");
      return res.redirect("/admin/advogados");
    }
    res.render("admin/editadvogado", { advogado: usuario });
  })
  .catch((err) => {
    console.error(err);
    req.flash("error_msg", "Erro ao buscar advogado");
    res.redirect("/admin/advogados");
  });
    
})

router.post("/advogados/edit", eAdmin, async (req, res) => {
  const usuarioId = Number(req.body.id); 
  const { nome, email, senha_pura } = req.body;

  try {
    
    const dados= { nome, email };

    
    if (senha_pura && senha_pura.trim() !== "") {
      const senhaHash = await bcrypt.hash(senha_pura, 10);
      dados.senha = senhaHash;
    }

    await prisma.usuario.update({
      where: { usuario_id: usuarioId },
      data: dados,
    });

    req.flash("success_msg", "Advogado editado com sucesso");
    res.redirect("/admin/advogados");
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Erro ao editar advogado");
    res.redirect("/admin/advogados");
  }
});

router.post("/advogados/deletar", eAdmin, async (req, res) => {
  try {
    const id = Number(req.body.id);

    await prisma.usuario.delete({
      where: { usuario_id: id }
    });

    req.flash("success_msg", "Advogado deletado com sucesso!");
    res.redirect("/admin/advogados");

  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Erro ao deletar advogado");
    res.redirect("/admin/advogados");
  }
});


router.get('/clientes', eAdmin, async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      include: {
        advogado_responsavel: true,  
      },
      orderBy: {
        cliente_id: 'desc'
      }
    });

    res.render('admin/clientes', { clientes });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Erro ao listar clientes");
    res.redirect("/admin");
  }
});  

module.exports = router

