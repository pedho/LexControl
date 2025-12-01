-- CreateEnum
CREATE TYPE "Status" AS ENUM ('EM_ANDAMENTO', 'CONCLUIDO', 'ARQUIVADO', 'SUSPENSO');

-- CreateTable
CREATE TABLE "Usuario" (
    "usuario_id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "eAdmin" INTEGER NOT NULL DEFAULT 0,
    "senha" TEXT NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("usuario_id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "cliente_id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf_cnpj" TEXT NOT NULL,
    "advogado_responsavel_id" INTEGER NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("cliente_id")
);

-- CreateTable
CREATE TABLE "Caso" (
    "caso_id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "prazo_final" TIMESTAMP(3),
    "cliente_id" INTEGER NOT NULL,
    "advogado_responsavel_id" INTEGER NOT NULL,

    CONSTRAINT "Caso_pkey" PRIMARY KEY ("caso_id")
);

-- CreateTable
CREATE TABLE "Audiencia" (
    "audiencia_id" SERIAL NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "local" TEXT NOT NULL,
    "caso_id" INTEGER NOT NULL,

    CONSTRAINT "Audiencia_pkey" PRIMARY KEY ("audiencia_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_email_key" ON "Cliente"("email");

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_advogado_responsavel_id_fkey" FOREIGN KEY ("advogado_responsavel_id") REFERENCES "Usuario"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caso" ADD CONSTRAINT "Caso_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "Cliente"("cliente_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caso" ADD CONSTRAINT "Caso_advogado_responsavel_id_fkey" FOREIGN KEY ("advogado_responsavel_id") REFERENCES "Usuario"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audiencia" ADD CONSTRAINT "Audiencia_caso_id_fkey" FOREIGN KEY ("caso_id") REFERENCES "Caso"("caso_id") ON DELETE RESTRICT ON UPDATE CASCADE;
