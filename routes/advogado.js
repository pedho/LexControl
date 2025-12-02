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

router.get("/casos", eUser, async (req, res) => {
  try {
    const casos = await prisma.caso.findMany({
      where: { advogado_responsavel_id: req.user.usuario_id },
      orderBy: { caso_id: "desc" },
      include: { cliente: true }
    });

    res.render("advogado/casos", { casos });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Erro ao listar casos");
    res.redirect("/");
  }
});

router.get("/casos/add", eUser, async (req, res) => {
  const clientes = await prisma.cliente.findMany({
    where: { advogado_responsavel_id: req.user.usuario_id }
  });

  res.render("advogado/addcaso", { clientes });
});

router.post("/casos/add", eUser, async (req, res) => {
  try {
    let { titulo, status, prazo_final, cliente_id } = req.body;

    await prisma.caso.create({
      data: {
        titulo,
        status,
        prazo_final: prazo_final ? new Date(prazo_final) : null,
        cliente_id: Number(cliente_id),
        advogado_responsavel_id: req.user.usuario_id
      }
    });

    req.flash("success_msg", "Caso criado com sucesso");
    res.redirect("/advogado/casos");

  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Erro ao criar caso");
    res.redirect("/advogado/casos");
  }
});

router.get("/casos/edit/:id", eUser, async (req, res) => {
  try {
    const caso = await prisma.caso.findUnique({
      where: { caso_id: Number(req.params.id) }
    });

    const clientes = await prisma.cliente.findMany({
      where: { advogado_responsavel_id: req.user.usuario_id }
    });

    res.render("advogado/editcaso", { caso, clientes });

  } catch (err) {
    console.log(err);
    req.flash("error_msg", "Erro ao carregar edição");
    res.redirect("/advogado/casos");
  }
});

router.post("/casos/edit", eUser, async (req, res) => {
  try {
    let { id, titulo, status, prazo_final, cliente_id } = req.body;

    await prisma.caso.update({
      where: { caso_id: Number(id) },
      data: {
        titulo,
        status,
        prazo_final: prazo_final ? new Date(prazo_final) : null,
        cliente_id: Number(cliente_id)
      }
    });

    req.flash("success_msg", "Caso atualizado!");
    res.redirect("/advogado/casos");

  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Erro ao atualizar caso");
    res.redirect("/advogado/casos");
  }
});

router.post("/casos/deletar", eUser, async (req, res) => {
  try {
    await prisma.caso.delete({
      where: { caso_id: Number(req.body.id) }
    });

    req.flash("success_msg", "Caso excluído");
    res.redirect("/advogado/casos");

  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Erro ao excluir caso");
    res.redirect("/advogado/casos");
  }
});

router.get("/audiencias", eUser, async (req, res) => {
  try {
    const audiencias = await prisma.audiencia.findMany({
      where: {
        caso: {
          advogado_responsavel_id: req.user.usuario_id
        }
      },
      orderBy: { audiencia_id: "desc" },
      include: {
        caso: {
          include: { cliente: true }
        }
      }
    });

    res.render("advogado/audiencias", { audiencias });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Erro ao listar audiências");
    res.redirect("/");
  }
});

router.get("/audiencias/add", eUser, async (req, res) => {
  try {
    const casos = await prisma.caso.findMany({
      where: { advogado_responsavel_id: req.user.usuario_id },
      include: { cliente: true },
      orderBy: { caso_id: "desc" }
    });

    res.render("advogado/addaudiencia", { casos });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Erro ao carregar formulário de audiência");
    res.redirect("/advogado/audiencias");
  }
});

router.post("/audiencias/add", eUser, async (req, res) => {
  try {
    const { caso_id, data, local } = req.body;

    const dataObj = data ? new Date(data) : null;

    await prisma.audiencia.create({
      data: {
        data: dataObj,
        local,
        caso_id: Number(caso_id)
      }
    });

    req.flash("success_msg", "Audiência adicionada com sucesso");
    res.redirect("/advogado/audiencias");
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Erro ao adicionar audiência");
    res.redirect("/advogado/audiencias");
  }
});

router.get("/audiencias/edit/:id", eUser, async (req, res) => {
  try {
    const id = Number(req.params.id);

    
    const audiencia = await prisma.audiencia.findUnique({
      where: { audiencia_id: id },
      include: { caso: { include: { cliente: true } } }
    });

    if (!audiencia) {
      req.flash("error_msg", "Audiência não encontrada");
      return res.redirect("/advogado/audiencias");
    }

    
    if (audiencia.caso.advogado_responsavel_id !== req.user.usuario_id) {
      req.flash("error_msg", "Você não tem permissão para editar essa audiência");
      return res.redirect("/advogado/audiencias");
    }

    
    const casos = await prisma.caso.findMany({
      where: { advogado_responsavel_id: req.user.usuario_id },
      include: { cliente: true }
    });

    res.render("advogado/editaudiencia", { audiencia, casos });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Erro ao carregar edição");
    res.redirect("/advogado/audiencias");
  }
});

router.post("/audiencias/edit", eUser, async (req, res) => {
  try {
    const { id, caso_id, data, local } = req.body;

    const caso = await prisma.caso.findUnique({
      where: { caso_id: Number(caso_id) }
    });

    if (!caso || caso.advogado_responsavel_id !== req.user.usuario_id) {
      req.flash("error_msg", "Caso inválido ou não pertence a você");
      return res.redirect("/advogado/audiencias");
    }

    const dataObj = data ? new Date(data) : null;

    await prisma.audiencia.update({
      where: { audiencia_id: Number(id) },
      data: {
        caso_id: Number(caso_id),
        data: dataObj,
        local
      }
    });

    req.flash("success_msg", "Audiência atualizada com sucesso");
    res.redirect("/advogado/audiencias");
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Erro ao atualizar audiência");
    res.redirect("/advogado/audiencias");
  }
});

router.post("/audiencias/deletar", eUser, async (req, res) => {
  try {
    const id = Number(req.body.id);

    const audiencia = await prisma.audiencia.findUnique({
      where: { audiencia_id: id },
      include: { caso: true }
    });

    if (!audiencia) {
      req.flash("error_msg", "Audiência não encontrada");
      return res.redirect("/advogado/audiencias");
    }

    if (audiencia.caso.advogado_responsavel_id !== req.user.usuario_id) {
      req.flash("error_msg", "Você não tem permissão para excluir essa audiência");
      return res.redirect("/advogado/audiencias");
    }

    await prisma.audiencia.delete({ where: { audiencia_id: id } });

    req.flash("success_msg", "Audiência excluída");
    res.redirect("/advogado/audiencias");
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Erro ao excluir audiência");
    res.redirect("/advogado/audiencias");
  }
});

module.exports = router
