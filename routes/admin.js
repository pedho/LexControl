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

router.get("/inicio", eAdmin, async (req, res) => {
  try {
    const data_atual = new Date();
    const data_limite = new Date();
    data_limite.setDate(data_atual.getDate() + 7);

    const Audiencias = await prisma.audiencia.findMany({
      where: {
        data: { gte: data_atual, lte: data_limite }
      },
      orderBy: { data: "asc" },
      include: {
        caso: {
          include: {
            cliente: true,
            advogado_responsavel: true
          }
        }
      }
    });

    const totalAdvogados = await prisma.usuario.count({
      where: { eAdmin: 0 }
    });

    const casosPorStatus = await prisma.caso.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    const concluidosPorAdvogado = await prisma.caso.groupBy({
      by: ['advogado_responsavel_id'],
      where: { status: "CONCLUIDO" },
      _count: { advogado_responsavel_id: true }
    });

    const pendentesPorAdvogado = await prisma.caso.groupBy({
      by: ['advogado_responsavel_id'],
      where: { status: "EM_ANDAMENTO" },
      _count: { advogado_responsavel_id: true }
    });

    const advogados = await prisma.usuario.findMany({
      where: { eAdmin: 0 }
    });

    const advogados_nomes = advogados.map(a => a.nome);

    function mapDadosPorAdvogado(dados) {
      return advogados.map(a => {
        const found = dados.find(d => d.advogado_responsavel_id === a.usuario_id);
        return found ? found._count.advogado_responsavel_id : 0;
      });
    }

    const concluidosArray = mapDadosPorAdvogado(concluidosPorAdvogado);
    const pendentesArray = mapDadosPorAdvogado(pendentesPorAdvogado);

    res.render("admin/index", { 
      Audiencias,
      totalAdvogados,
      casosPorStatus,
      advogados_nomes,
      concluidosArray,
      pendentesArray
    });

  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Erro ao carregar audiências");
    res.redirect("/admin");
  }
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
    req.flash("error_msg", "Erro ao deletar advogado (ele pode ter associados)");
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

router.post("/clientes/deletar", eAdmin, async (req, res) => {
  try {
    const id = Number(req.body.id);

    await prisma.cliente.delete({
      where: { cliente_id: id }
    });

    req.flash("success_msg", "Cliente deletado!");
    res.redirect("/admin/clientes");

  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Erro ao deletar cliente (ele pode ter associados)");
    res.redirect("/admin/clientes");
  }
});

router.get("/casos", eAdmin, async (req, res) => {
  try {
    const search = req.query.search?.trim();

    let whereClause = {};

    if (search && !isNaN(search)) {
      whereClause.caso_id = Number(search);
    }

    const casos = await prisma.caso.findMany({
      where: Object.keys(whereClause).length ? whereClause : undefined,

      orderBy: [
        { status: "asc" },
        { caso_id: "desc" }
      ],

      include: {
        cliente: true,
        advogado_responsavel: true
      }
    });

    res.render("admin/casos", { casos, search });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Erro ao listar casos");
    res.redirect("/admin");
  }
});


router.post("/casos/deletar", eAdmin, async (req, res) => {
  try {
    const id = Number(req.body.id);

    await prisma.caso.delete({
      where: { caso_id: id }
    });

    req.flash("success_msg", "Caso deletado!");
    res.redirect("/admin/casos");
  } catch (err) {
    console.log(err);
    req.flash("error_msg", "Erro ao deletar caso (ele pode ter associados)");
    res.redirect("/admin/casos");
  }
});

router.get("/audiencias", eAdmin, async (req, res) => {
  try {
    const search = req.query.search?.trim();
    const hoje = new Date();

    let whereClause = {};

    if (search && !isNaN(search)) {
      whereClause = {
        caso: {
          caso_id: Number(search)
        }
      };
    }

    const audiencias = await prisma.audiencia.findMany({
      where: Object.keys(whereClause).length ? whereClause : undefined,

      orderBy: {
        data: "asc"
      },

      include: {
        caso: {
          include: {
            cliente: true,
            advogado_responsavel: true
          }
        }
      }
    });

    res.render("admin/audiencias", {
      audiencias,
      search,
      hoje
    });

  } catch (err) {
    console.log(err);
    req.flash("error_msg", "Erro ao listar audiências");
    res.redirect("/admin");
  }
});


router.post("/audiencias/deletar", eAdmin, async (req, res) => {
  try {
    const id = Number(req.body.id);

    await prisma.audiencia.delete({
      where: { audiencia_id: id }
    });

    req.flash("success_msg", "Audiência deletada!");
    res.redirect("/admin/audiencias");

  } catch (err) {
    console.log(err);
    req.flash("error_msg", "Erro ao deletar audiência");
    res.redirect("/admin/audiencias");
  }
});

module.exports = router

