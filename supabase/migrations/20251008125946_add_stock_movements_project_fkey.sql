/*
  # Adicionar foreign key entre stock_movements e projects

  ## Descrição
  Adiciona constraint de foreign key na coluna project_id da tabela stock_movements
  para permitir joins com a tabela projects.

  ## Mudanças
  1. Adiciona foreign key constraint em stock_movements.project_id -> projects.id
  2. Define ON DELETE SET NULL para manter histórico quando projeto for deletado

  ## Segurança
  - Não afeta políticas RLS existentes
  - Mantém integridade referencial
*/

-- Adicionar foreign key se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'stock_movements_project_id_fkey'
    AND table_name = 'stock_movements'
  ) THEN
    ALTER TABLE stock_movements
    ADD CONSTRAINT stock_movements_project_id_fkey
    FOREIGN KEY (project_id)
    REFERENCES projects(id)
    ON DELETE SET NULL;
  END IF;
END $$;