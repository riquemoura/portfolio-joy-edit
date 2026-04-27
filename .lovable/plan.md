## Objetivo
Adicionar um botão no modo "Editar Ordem" que remove todas as quebras de página de uma só vez do catálogo atual.

## Mudanças

### 1. `src/components/CatalogHeader.tsx`
- Adicionar nova prop opcional `onRemoveAllPageBreaks: () => void` e `pageBreaksCount: number`.
- Quando `isEditingOrder` for `true` E `pageBreaksCount > 0`, exibir um botão ao lado de "Quebra de Página":
  - Texto: "Remover Quebras"
  - Ícone: `Trash2` (lucide-react)
  - Estilo destrutivo discreto (variant outline com cor vermelha, igual ao padrão amber existente).
  - Ao clicar, abre um `AlertDialog` de confirmação ("Remover todas as N quebras de página?") antes de executar.

### 2. `src/hooks/useProducts.ts`
- Adicionar nova função `removeAllPageBreaks()`:
  ```ts
  const removeAllPageBreaks = useCallback(() => {
    setProducts(prev => prev.filter(p => !p.isPageBreak));
  }, []);
  ```
- Exportá-la no retorno do hook.
- O auto-save existente (debounce 1.5s) cuidará da persistência automaticamente via RPC `replace_catalog_products`.

### 3. `src/pages/Index.tsx`
- Pegar `removeAllPageBreaks` do `useProducts`.
- Calcular `pageBreaksCount = products.filter(p => p.isPageBreak).length`.
- Passar `onRemoveAllPageBreaks` e `pageBreaksCount` ao `CatalogHeader`.
- Após remoção, mostrar `toast` de confirmação: "N quebras de página removidas".

## Segurança de dados
- A operação é apenas em memória + auto-save. Backups existentes (`products_backup_*`) já cobrem o estado anterior.
- Não há necessidade de migração de schema nem nova tabela de backup, pois nenhuma estrutura é alterada.
- A confirmação via AlertDialog evita cliques acidentais.

## Arquivos modificados
- `src/components/CatalogHeader.tsx`
- `src/hooks/useProducts.ts`
- `src/pages/Index.tsx`
