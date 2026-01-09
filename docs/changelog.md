# =====================================================================
# TimeDonto — Regras Globais para o Cursor (Pro+)
# =====================================================================

# ---------------------------------------------------------------------
# 1. Linguagem e Padrões Gerais
# ---------------------------------------------------------------------
language: "typescript"
use_strict_typescript: true

rules:
  - "Sempre utilizar TypeScript com 'strict: true'."
  - "Nunca gerar código em JavaScript."
  - "Seguir Clean Architecture e dividir código em Domain, Application e Infra."
  - "Nunca colocar lógica de negócio dentro de componentes React."
  - "Usar Zod para validar todos os inputs de API e formulários."
  - "Evitar duplicação de código (princípio DRY)."

# ---------------------------------------------------------------------
# 2. Estrutura de Arquivos e Pastas
# ---------------------------------------------------------------------
  - "Nunca criar arquivos fora da pasta /src sem permissão explícita."
  - "Rotas do Next.js devem ficar apenas em /src/app/**/*."
  - "Lógica de domínio deve sempre estar dentro de /src/modules/<feature>/domain."
  - "Casos de uso (application) devem sempre ficar em /src/modules/<feature>/application."
  - "Implementações concretas de Prisma devem ficar em /src/modules/<feature>/infra."
  - "Componentes UI globais sempre vão em /src/components/ui."
  - "Helpers e libs devem ser criados em /src/lib ou /src/config."

# ---------------------------------------------------------------------
# 3. Banco de Dados e Prisma
# ---------------------------------------------------------------------
  - "Toda interação com banco deve usar Prisma."
  - "Nunca acessar Prisma diretamente na UI ou domínio — apenas na camada de infra."
  - "Sempre incluir 'clinicId' em queries multi-tenant."
  - "Nunca retornar dados de outra clínica sem validar clinicId."
  - "Manter o schema.prisma sincronizado com data-model.md."

# ---------------------------------------------------------------------
# 4. Multi-Tenant (Modelo A)
# ---------------------------------------------------------------------
  - "Sempre utilizar session.user.clinicId para filtrar dados sensíveis."
  - "Nunca permitir acesso a dados sem validar que pertencem à mesma clínica."
  - "Qualquer tabela de negócio deve incluir campo clinicId."

# ---------------------------------------------------------------------
# 5. Autenticação e Autorização
# ---------------------------------------------------------------------
  - "Usar Auth.js / NextAuth em todas as rotas protegidas."
  - "Sempre verificar permissões com base no papel do usuário."
  - "Papéis válidos: OWNER, ADMIN, DENTIST, RECEPTIONIST."
  - "Recepcionistas nunca devem acessar prontuário."
  - "Apenas Owner pode gerenciar assinatura (Stripe)."

# ---------------------------------------------------------------------
# 6. APIs (Next.js App Router)
# ---------------------------------------------------------------------
  - "APIs devem ser implementadas em /src/app/api/**."
  - "Sempre validar entrada com Zod antes de chamar use cases."
  - "Retornar erros padronizados com status HTTP adequados."
  - "Usar respostas consistentes: { success: boolean, data?: any, error?: string }."

# ---------------------------------------------------------------------
# 7. Server Actions
# ---------------------------------------------------------------------
  - "Usar Server Actions apenas quando simplificar o fluxo UI → Backend."
  - "Server Actions também devem validar entrada com Zod."
  - "Nunca colocar lógica de negócio diretamente em Server Actions."
  - "Server Actions devem chamar casos de uso em /modules/<feature>/application."

# ---------------------------------------------------------------------
# 8. UI/Frontend
# ---------------------------------------------------------------------
  - "Usar componentes Server sempre que possível (Next.js padrão)."
  - "Usar componentes Client apenas onde necessário (forms, interação)."
  - "Seguir atomic design: components/ui para elementos reutilizáveis."
  - "Seguir boas práticas de acessibilidade (aria-label, semantic HTML)."

# ---------------------------------------------------------------------
# 9. Código Gerado
# ---------------------------------------------------------------------
  - "Antes de modificar arquivos existentes, o Cursor deve explicar a mudança."
  - "Gerar comentários de explicação apenas quando solicitado."
  - "Manter estilo consistente com o restante do código do projeto."
  - "Usar imports relativos curtos, nunca caminhos absolutos longos."

# ---------------------------------------------------------------------
# 10. Documentação e Commit Messages
# ---------------------------------------------------------------------
  - "Sempre incluir comentários mínimos em casos de uso complexos."
  - "Commits devem seguir padrão: feat:, fix:, chore:, refactor:, docs:"

# ---------------------------------------------------------------------
# 11. Stripe e Billing
# ---------------------------------------------------------------------
  - "Webhooks devem ficar em /src/app/api/billing/stripe-webhook/route.ts."
  - "Lógica de assinatura deve ficar em /src/modules/billing/application."
  - "Nunca criar checkout no frontend sem validação server-side."
  - "Apenas Owner pode visualizar e alterar dados de assinatura."

# ---------------------------------------------------------------------
# 12. Logs e Auditoria
# ---------------------------------------------------------------------
  - "Operações sensíveis devem chamar logger em /src/lib/logger."
  - "Acesso ao prontuário deve gerar log obrigatório."

# ---------------------------------------------------------------------
# 13. O que o Cursor NUNCA deve fazer
# ---------------------------------------------------------------------
  - "Nunca criar tabelas sem clinicId."
  - "Nunca ignorar roles ou permissões definidas."
  - "Nunca escrever lógica de negócio em route.ts."
  - "Nunca misturar camadas (ex.: Prisma em domínio, UI chamando DB)."
  - "Nunca criar código em JavaScript."
  - "Nunca remover arquivos sem autorização."

# =====================================================================
# FIM DO ARQUIVO
# =====================================================================
