-- =====================================================
-- CARDÁPIO DIGITAL — Script de criação do banco
-- Execute este arquivo no SQL Editor do Supabase:
-- Dashboard → SQL Editor → New Query → Cole e clique em Run
-- =====================================================

-- 1. TABELA DE PRODUTOS (itens do cardápio)
CREATE TABLE IF NOT EXISTS produtos (
  id       BIGSERIAL PRIMARY KEY,
  nome     TEXT          NOT NULL,
  categoria TEXT         NOT NULL CHECK (categoria IN ('tamanho','feijao','massa','legumes','outros','salada','proteina')),
  preco    NUMERIC(10,2) NOT NULL DEFAULT 0.00
);

-- 2. TABELA DE PEDIDOS
CREATE TABLE IF NOT EXISTS pedidos (
  id               BIGSERIAL PRIMARY KEY,
  codigo           TEXT          UNIQUE,
  cliente_name     TEXT,
  cliente_telefone TEXT,
  itens            JSONB,
  total            NUMERIC(10,2),
  status           TEXT          NOT NULL DEFAULT 'Novo',
  criado_em        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- =====================================================
-- POLÍTICAS DE ACESSO (RLS)
-- O Supabase bloqueia tudo por padrão — precisamos
-- liberar os acessos necessários para a chave anon.
-- =====================================================

-- Produtos: leitura pública (cliente vê o cardápio)
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura pública de produtos" ON produtos;
CREATE POLICY "Leitura pública de produtos"
  ON produtos FOR SELECT USING (true);

-- Produtos: escrita pelo admin (chave anon — painel admin)
DROP POLICY IF EXISTS "Admin pode gerenciar produtos" ON produtos;
CREATE POLICY "Admin pode gerenciar produtos"
  ON produtos FOR ALL USING (true);

-- Pedidos: cliente pode inserir
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cliente pode inserir pedido" ON pedidos;
CREATE POLICY "Cliente pode inserir pedido"
  ON pedidos FOR INSERT WITH CHECK (true);

-- Pedidos: admin pode ler e atualizar
DROP POLICY IF EXISTS "Admin pode ler pedidos" ON pedidos;
CREATE POLICY "Admin pode ler pedidos"
  ON pedidos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin pode atualizar pedidos" ON pedidos;
CREATE POLICY "Admin pode atualizar pedidos"
  ON pedidos FOR UPDATE USING (true);

-- =====================================================
-- DADOS DE EXEMPLO — remova ou edite à vontade
-- =====================================================
INSERT INTO produtos (nome, categoria, preco) VALUES
  -- Tamanhos
  ('Marmitex P',  'tamanho', 15.00),
  ('Marmitex M',  'tamanho', 18.00),
  ('Marmitex G',  'tamanho', 22.00),
  -- Feijão
  ('Feijão Carioca',   'feijao', 0.00),
  ('Feijão Tropeiro',  'feijao', 0.00),
  ('Feijão Preto',     'feijao', 0.00),
  -- Massa
  ('Macarrão',         'massa',  0.00),
  ('Sem Massa',        'massa',  0.00),
  -- Legumes
  ('Chuchu Refogado',  'legumes', 0.00),
  ('Abobrinha',        'legumes', 0.00),
  ('Cenoura',          'legumes', 0.00),
  ('Sem Legume',       'legumes', 0.00),
  -- Outros
  ('Torresmo',         'outros',  3.00),
  ('Batata Frita',     'outros',  3.00),
  ('Ovo Frito',        'outros',  2.00),
  -- Salada
  ('Alface',           'salada',  0.00),
  ('Tomate',           'salada',  0.00),
  ('Vinagrete',        'salada',  0.00),
  -- Proteína
  ('Frango Grelhado',  'proteina', 0.00),
  ('Carne Moída',      'proteina', 0.00),
  ('Bife Acebolado',   'proteina', 5.00),
  ('Costelinha',       'proteina', 5.00)
ON CONFLICT DO NOTHING;
