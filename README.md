# SGEC — Módulo 1: Autenticação e Segurança

> **Projeto Interdisciplinar — 4ª fase de Ciência da Computação (UNESC) · parceria ABADEUS**
> Sistema de Gestão de Espaços Compartilhados (coworking e laboratórios)
> **Responsável pelo Módulo 1:** Lucas de Oliveira

Este documento fala **somente do Módulo 1**: a base de banco de dados, a segurança e a
autenticação sobre as quais os outros módulos são construídos.

| Módulo | Responsável |
|---|---|
| **1 — Autenticação e Segurança** (este documento) | Lucas de Oliveira |
| 2 — Espaços e disponibilidade | Samuel Gonçalves da Silva |
| 3 — Reservas | Davi Medeiros de Oliveira |
| 4 — Aprovação e acompanhamento | Victor Alexandre Vieira da Luz |
| 5 — Cadastros e relatórios | André Vendruscolo Júnior |

---

## Sumário

1. [O que o Módulo 1 entrega](#1-o-que-o-módulo-1-entrega)
2. [Tecnologias](#2-tecnologias)
3. [Como rodar](#3-como-rodar)
4. [Estrutura de pastas](#4-estrutura-de-pastas)
5. [Banco de dados](#5-banco-de-dados)
6. [API](#6-api)
7. [Arquitetura do back-end (camadas)](#7-arquitetura-do-back-end-camadas)
8. [Como os outros módulos usam o Módulo 1](#8-como-os-outros-módulos-usam-o-módulo-1)
9. [Decisões de segurança](#9-decisões-de-segurança)
10. [Comandos úteis e testes](#10-comandos-úteis-e-testes)
11. [Situação atual](#11-situação-atual)
12. [Prompt para IA (manter o mesmo padrão)](#12-prompt-para-ia-manter-o-mesmo-padrão)

---

## 1. O que o Módulo 1 entrega

- **Infraestrutura:** Docker Compose com PostgreSQL, API Node e proxy Nginx. Tudo é acessado em
  **`http://sgec.localhost`**, sem número de porta.
- **Banco com segurança em camadas:** usuários do banco com o mínimo de permissão, auditoria
  automática e imutável, e regras críticas garantidas por *triggers*.
- **Autenticação completa:**
  - cadastro público e login;
  - sessão em cookie `HttpOnly`;
  - logout e "sair de todos os aparelhos";
  - bloqueio por tentativas erradas;
  - troca de senha e recuperação de senha ("esqueci minha senha").
- **Perfis e permissões:** `ADMIN`, `GESTOR`, `RECEPCAO` e `SOLICITANTE`, com os middlewares
  `autenticar` e `autorizar(...)` prontos para os outros módulos.
- **Gestão de usuários pelo ADMIN:** listar, buscar, criar com perfil, editar, ativar e
  desativar, e redefinir senha.
- **Pessoa física e jurídica:** no cadastro a pessoa escolhe o tipo de conta; a jurídica informa
  CNPJ (inclusive o alfanumérico), razão social e nome fantasia, guardados na tabela `empresas`.
  Uma empresa pode ter várias contas vinculadas (o ADMIN vincula).
- **Documentação da API:** Swagger em `http://sgec.localhost/api/docs` (só em desenvolvimento).
- **Modo escuro** depois do login, lembrado por aparelho.
- **Peças reutilizáveis:** validação (Zod), tratamento de erros padronizado e transações com
  auditoria.
- **Migrações do banco:** cada módulo acrescenta os seus scripts SQL sem apagar dados; o serviço
  `migrar` aplica só o que é novo a cada `docker compose up`.
- **Front-end completo do Módulo 1:** React + Vite + Tailwind organizado por módulos, com cliente
  da API, sessão (`useAuth`), proteção de rotas por perfil, menu por perfil, "Meu perfil"
  (dados, senha, aparelhos conectados) e gestão de usuários.
- **Portabilidade:** *healthchecks* (o proxy só abre quando API e front estão prontos), porta
  configurável, `.env.example` e um script que gera o `.env` com senhas válidas.
- **Dois modos:** desenvolvimento (recarrega sozinho) e produção (front compilado servido pelo
  Nginx, API só com dependências de produção).

---

## 2. Tecnologias

| Camada | Tecnologia |
|---|---|
| Banco | PostgreSQL 16 (Alpine), extensão `citext` |
| API | Node.js 22, Express 5, `pg`, `zod` (v4), `bcryptjs`, `cookie-parser`, `helmet` |
| Front | React 19, Vite 6, Tailwind CSS 4, React Router 7 |
| Infra | Docker Compose, Nginx 1.27 (proxy reverso) |
| Qualidade | ESLint 9 + Prettier (front e API), `package-lock.json` versionado, `.editorconfig`, `.gitattributes` |

---

## 3. Como rodar

### Pré-requisitos

- **Docker Desktop** aberto (a baleia parada na barra de tarefas).
- **Git**.
- Windows: os comandos deste documento são para **PowerShell**. Em Mac/Linux os comandos `docker`
  são os mesmos; os scripts `.ps1` rodam com `pwsh` (PowerShell 7) ou o `.env` pode ser feito à mão.

### Primeira vez numa máquina

```powershell
git clone <url-do-repositorio> sgec
cd sgec
powershell -ExecutionPolicy Bypass -File scripts\gerar-env.ps1
docker compose up -d --build
```

1. O `gerar-env.ps1` cria o `.env` a partir do `.env.example`, com **senhas aleatórias** que já
   seguem as regras, e mostra o e-mail e a senha do administrador. Se já existir um `.env`, ele
   não mexe em nada.
2. A primeira subida demora alguns minutos (baixa as imagens, instala as dependências e cria o
   banco). Quando o `up` termina, **o sistema já está pronto**.
3. Abra **http://sgec.localhost** e entre com o administrador mostrado pelo script.

### Arquivo `.env` (na raiz; **nunca** vai para o Git)

O modelo é o `.env.example` (esse vai para o Git, sem senhas):

```ini
DB_NAME=sgec
DB_PORT_HOST=15432
DB_SUPERUSER=sgec_admin
DB_SUPERUSER_PASSWORD=
DB_OWNER_PASSWORD=
DB_APP_PASSWORD=
DB_LEITURA_PASSWORD=
NODE_ENV=development
SGEC_PORTA=80
SGEC_URL=http://sgec.localhost
ADMIN_NOME=Administrador
ADMIN_EMAIL=admin@sgec.local
ADMIN_SENHA=
```

Regras (o `gerar-env.ps1` já cumpre todas):

- **Somente letras e números.** O `$` é interpretado pelo Docker Compose e quebra a senha.
- As senhas do banco precisam ter **16 ou mais caracteres** e ser **todas diferentes**. O script
  de inicialização recusa senhas fora disso.
- `ADMIN_SENHA` precisa ter **12 ou mais caracteres**, misturar letras e números e não conter
  `admin`, `senha`, `troque` nem `123456`.
- As senhas do banco e o `ADMIN_*` só valem **na criação do banco**. Depois disso, mudar o `.env`
  não altera nada (e trocar as senhas do banco no `.env` faz a API não conseguir conectar).
- **Porta ocupada?** Se a porta 80 já estiver em uso no PC, use por exemplo `SGEC_PORTA=8080` e
  `SGEC_URL=http://sgec.localhost:8080`, e acesse por esse endereço.

### Subir (dia a dia)

```powershell
docker compose up -d --build
docker compose ps
```

| Container | Porta no PC | Função |
|---|---|---|
| `sgec-proxy` | `127.0.0.1:80` (ou `SGEC_PORTA`) | porta de entrada única (`http://sgec.localhost`) |
| `sgec-web` | **nenhuma** | front; só o proxy alcança |
| `sgec-api` | **nenhuma** | API; só o proxy alcança |
| `sgec-migrar` | — | roda as migrações e **termina** (`Exited (0)` é o normal) |
| `sgec-db` | `127.0.0.1:15432` | PostgreSQL (para DBeaver/psql locais) |

Ordem de subida: `db` (saudável) → `migrar` (terminou sem erro) → `api` (saudável) e `web`
(saudável) → `proxy`. "Saudável" é o *healthcheck*: o Docker testa `/api/saude` (que consulta o
banco) e a página do front a cada 5 s. Por isso o proxy nunca abre com o sistema pela metade.
Se uma migração falhar, a API **não sobe**: veja `docker compose logs migrar`.

Teste: `http://sgec.localhost` abre a tela de login e `http://sgec.localhost/api/saude` responde
`{"status":"ok","usuario_banco":"sgec_app",...}`.

### Modo produção

O padrão é o **desenvolvimento**: o código do PC é montado nos containers, a API roda com
`--watch` e o front com o Vite, e tudo recarrega sozinho ao salvar.

O **modo produção** é para a apresentação ou um servidor:

```powershell
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose logs api --tail 1          # deve mostrar (production)
```

| | Desenvolvimento | Produção |
|---|---|---|
| Front | Vite (servidor de desenvolvimento) | `vite build` servido por Nginx, com cache em `/assets/` |
| API | `npm run dev` (`node --watch`), todas as dependências | `npm start`, só dependências de produção |
| Código | pastas do PC montadas no container | só o que está **dentro da imagem** |
| Cookie | sem `Secure` | `Secure` (o Chrome/Edge aceitam em `*.localhost` sem HTTPS) |
| Link de recuperação | aparece no log da API | **não** aparece (precisa de envio de e-mail real) |

Os Dockerfiles têm **estágios** (`desenvolvimento`, `compilacao`, `producao`); o
`docker-compose.yml` usa `target: desenvolvimento` e o `docker-compose.prod.yml` troca para
`target: producao` e remove as pastas montadas (`volumes: !reset []`). Para voltar ao
desenvolvimento: `docker compose up -d --build`. O banco é o mesmo nos dois modos.

### Mudanças no banco (migrações)

Basta criar o arquivo em `database/migracoes/` e rodar `docker compose up -d`. Nada é apagado.

```powershell
docker compose up -d
docker compose logs migrar --tail 5
docker compose exec db psql -U sgec_admin -d sgec -c "SELECT nome, aplicada_em FROM migracoes_aplicadas;"
```

### Recriar o banco do zero (só em desenvolvimento)

```powershell
docker compose down -v      # ATENÇÃO: apaga TODOS os dados do banco
docker compose up -d --build
```

O `database/init/00_inicializar.sh` (que cria os usuários do banco) só roda com o volume vazio.

### Se algo não subir

| Sintoma | Causa | Solução |
|---|---|---|
| `error during connect` / `dockerDesktopLinuxEngine` | Docker Desktop fechado | abra o Docker Desktop e espere ele iniciar |
| `Defina DB_NAME no .env` (ou outra variável) | falta o `.env` | `powershell -ExecutionPolicy Bypass -File scripts\gerar-env.ps1` |
| `ports are not available` / `address already in use` | porta 80 (ou 15432) ocupada | `SGEC_PORTA=8080` e `SGEC_URL=http://sgec.localhost:8080` (ou `DB_PORT_HOST=15433`) no `.env` |
| `password authentication failed for user "sgec_app"` | senhas do `.env` diferentes das usadas na criação do banco | volte as senhas antigas; numa máquina **sem dados importantes**, `docker compose down -v` e suba de novo |
| log do `db` recusando senha (curta, repetida, com símbolo) | `.env` fora das regras | corrija o `.env`, `docker compose down -v` e suba de novo (só na primeira vez) |
| `migração aplicada foi alterada` | alguém editou uma migração já aplicada (o fim de linha CRLF/LF **não** conta) | desfaça a edição (`git checkout -- database/migracoes/<arquivo>`) e crie uma migração nova |
| `$'\r': command not found` / `bad interpreter` | script `.sh` com fim de linha CRLF | `git add --renormalize .` ou, no VS Code, troque `CRLF` → `LF` no canto inferior direito |
| página em branco ou `502` | front ou API não saudável | `docker compose ps` e `docker compose logs web --tail 30` / `logs api --tail 30` |
| `Cannot find module ...` depois de mudar o `package.json` | `node_modules` antigo no volume | `docker compose up -d --build -V` |
| `a execução de scripts foi desabilitada` | política do PowerShell | rode antes `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` (vale só para aquele terminal) |
| login "não fica" (volta para a tela de login) | endereço errado ou navegador recusando cookie | use sempre `http://sgec.localhost` (ou o `SGEC_URL`); em produção, use Chrome ou Edge |

---

## 4. Estrutura de pastas

```
sgec/
├── .env                      # segredos (fora do Git)
├── .env.example              # modelo do .env (vai para o Git, sem senhas)
├── .gitignore                # .env, node_modules/, dist/
├── .gitattributes            # todo arquivo de texto com fim de linha LF
├── .editorconfig             # LF, UTF-8 e 2 espaços em qualquer editor (.ps1 com BOM)
├── docker-compose.yml        # modo desenvolvimento (padrão)
├── docker-compose.prod.yml   # o que muda no modo produção
├── scripts/
│   ├── gerar-env.ps1         # cria o .env com senhas aleatórias
│   └── testes.ps1            # funções Chamar e Entrar para testar a API
├── proxy/
│   └── nginx.conf            # / → front · /api/ → API
├── database/
│   ├── init/00_inicializar.sh        # 1ª subida: cria os usuários do banco
│   ├── migrar.sh                     # aplica as migrações novas (serviço "migrar")
│   ├── migracoes/
│   │   ├── 001_base.sql              # funções comuns + auditoria
│   │   ├── 002_modulo1_autenticacao.sql
│   │   └── 003_modulo1_empresas.sql  # pessoa jurídica (tabela empresas)
│   └── seguranca/990_permissoes.sql  # GRANTs (reaplicado a cada migrar)
├── backend/
│   ├── Dockerfile · .dockerignore · package.json · package-lock.json
│   ├── eslint.config.js · .prettierrc · .prettierignore
│   └── src/
│       ├── server.js · app.js · routes.js
│       ├── config/       env.js · sessao.js · perfis.js
│       ├── database/     pool.js · adminInicial.js
│       ├── middlewares/  contexto · validar · autenticar · autorizar · tratarErros
│       ├── utils/        AppError · cpf · cnpj · tokens · email
│       ├── docs/         openapi.yaml (documentação) · swagger.js (página /api/docs)
│       └── modules/
│           ├── auth/       auth.{schemas,service,controller,routes}.js
│           │               sessoes · tentativas · recuperacao .repository.js
│           ├── empresas/   empresas.repository.js (base para o Módulo 5)
│           └── usuarios/   usuarios.{schemas,service,controller,routes,repository}.js
└── frontend/
    ├── Dockerfile · .dockerignore · nginx.conf (produção) · package.json · package-lock.json
    ├── vite.config.js · jsconfig.json · eslint.config.js · .prettierrc · .prettierignore
    ├── index.html · public/ (logo-abadeus, simbolo-abadeus e simbolo-abadeus-clara .png)
    └── src/
        ├── main.jsx · App.jsx · index.css
        ├── compartilhado/            # usado por TODOS os módulos (mudanças combinadas com o Lucas)
        │   ├── api/cliente.js
        │   ├── componentes/  Alerta · Botao · BotaoTema · Campo · CampoSenha · CampoSelecao · Modal
        │   │                 Paginacao · EstadoVazio · CabecalhoPagina · Secao · SeloPerfil
        │   │                 TelaCarregando · SeletorTipoPessoa · CamposEmpresa
        │   ├── config/       perfis.js · tiposPessoa.js · navegacao.js (itens do menu)
        │   ├── hooks/        useValorAtrasado.js · useTema.js (modo escuro)
        │   ├── layouts/      LayoutAcesso · LayoutApp
        │   ├── paginas/      Inicio · NaoEncontrado · AcessoNegado
        │   ├── rotas/        protecao.jsx
        │   └── utils/        formatos.js · empresa.js · destinoSeguro.js
        └── modulos/
            ├── auth/         api.js · AuthContext.jsx
            │                 paginas/ (Entrar, Cadastro, EsqueciSenha, RedefinirSenha, MeuPerfil)
            │                 componentes/ (SecaoDadosPessoais, SecaoTrocarSenha, SecaoAparelhos)
            └── usuarios/     api.js · validacao.js · paginas/Usuarios.jsx
                              componentes/ (FiltrosUsuarios, TabelaUsuarios, SeletorPerfil,
                              ModalNovoUsuario, ModalEditarUsuario, FormRedefinirSenha)
```

Regra de organização: **"é de um módulo ou serve para todos?"** Se é de um módulo, vai em
`modulos/<módulo>/` (front) ou `src/modules/<módulo>/` (API). Se serve para todos, vai em
`compartilhado/`, e só se mexe ali combinando com o responsável pelo Módulo 1.

> **Fim de linha LF.** O `.gitattributes` e o `.editorconfig` garantem LF. Com CRLF, os scripts
> `.sh` quebram dentro do container Linux, e o checksum das migrações muda.

---

## 5. Banco de dados

### 5.1 Usuários do banco (menor privilégio)

| Usuário | Para quê | Pode |
|---|---|---|
| `sgec_admin` | superusuário, só manutenção | tudo |
| `sgec_owner` | **dono** de todas as tabelas e funções | criar e alterar estrutura (os scripts rodam com `SET ROLE sgec_owner`) |
| `sgec_app` | **a API** | `SELECT/INSERT/UPDATE` no necessário. **Não** apaga, **não** lê a auditoria, **não** altera estrutura |
| `sgec_leitura` | relatórios / DBeaver | só leitura e **sem** acesso a hashes (usa a `vw_usuarios`) |

Outras proteções:

- o acesso público ao banco e ao schema `public` foi revogado;
- autenticação `scram-sha-256`;
- `statement_timeout` e `lock_timeout` no `sgec_app`;
- as portas ficam presas ao `127.0.0.1`, ou seja, acessíveis só do próprio PC.

### 5.2 Convenções

| Item | Padrão | Exemplo |
|---|---|---|
| Tabelas | plural, `snake_case` | `usuarios`, `sessoes` |
| Chave primária | `id UUID DEFAULT gen_random_uuid()` | |
| Datas | `TIMESTAMPTZ` com `clock_timestamp()` | `criado_em`, `atualizado_em` |
| Constraints | sempre com nome | `pk_usuarios`, `fk_sessoes_usuario`, `uq_usuarios_email`, `ck_usuarios_cpf` |
| Índices | `ix_<tabela>_<colunas>` | `ix_sessoes_usuario_ativas` |
| Triggers / funções | `trg_<tabela>_<acao>` / `fn_<acao>` | `trg_usuarios_auditoria`, `fn_login_bloqueado` |
| Exclusão | **lógica** (`ativo = false`, `revogada_em`) | nunca `DELETE` pela API |

Os nomes das constraints importam: a API usa esses nomes para devolver mensagens claras,
como `uq_usuarios_email` → `EMAIL_EM_USO`.

### 5.3 Objetos do Módulo 1

**`001_base.sql`**, comum a todos os módulos:

| Objeto | Função |
|---|---|
| extensão `citext` | texto que ignora maiúsculas/minúsculas (e-mails) |
| `fn_usuario_atual()` | lê `app.usuario_id`, ou seja, quem está agindo, informado pela API em cada transação |
| `fn_set_atualizado_em()` | trigger que atualiza `atualizado_em` |
| `fn_set_controle()` | trigger para tabelas com `criado_por/atualizado_por`; preenche quem e quando. Erro `SG000` se ninguém estiver identificado |
| `auditoria.alteracoes` | histórico de INSERT/UPDATE/DELETE com `antes/depois` em JSONB, sem `senha_hash`/`token_hash`; **imutável** (`SG002`) |
| `auditoria.fn_registrar_alteracao()` | trigger de auditoria (`SECURITY DEFINER`: a API grava o histórico sem poder lê-lo) |
| `fn_bloquear_alteracao()` | trigger que impede UPDATE/DELETE em tabelas de histórico |

**`002_modulo1_autenticacao.sql`**:

| Objeto | Função |
|---|---|
| `usuarios` | e-mail `CITEXT` único, CPF (11 dígitos) único, `senha_hash` bcrypt, perfil, `ativo` |
| `vw_usuarios` | usuários **sem** `senha_hash` (o que a API devolve) |
| `fn_garantir_admin_ativo()` | o sistema **nunca** fica sem um ADMIN ativo (`SG001`), nem pelo psql |
| `sessoes` | logins ativos; guarda **só o SHA-256** do token; expiração, último acesso, revogação |
| `fn_revogar_sessoes_usuario()` | mudou `ativo`, `perfil` ou `senha_hash` → derruba **todas** as sessões do usuário |
| `tokens_recuperacao_senha` | links de "esqueci minha senha": hash, expiração e uso único |
| `tentativas_login` | log de logins (sucesso e motivo da falha); imutável |
| `fn_login_bloqueado(email)` | 5 falhas em 15 min (desde o último acerto) → bloqueado |
| `fn_exigir_perfil(VARIADIC perfis)` | para funções SQL sensíveis dos módulos: exige usuário ativo com um dos perfis (`SG003`) |

**`003_modulo1_empresas.sql`**:

| Objeto | Função |
|---|---|
| `empresas` | CNPJ (`CHAR(14)`, aceita o formato alfanumérico) único, razão social, nome fantasia, `ativo` |
| `usuarios.empresa_id` | conta de pessoa jurídica (vazio = pessoa física); várias contas podem apontar para a mesma empresa |
| `vw_usuarios` | ganhou a coluna `empresa_id` |

A API devolve `tipo_pessoa` (`FISICA`/`JURIDICA`) e `empresa` (`{ id, cnpj, razao_social,
nome_fantasia }` ou `null`) em todo usuário. **Módulo 5 (André):** o cadastro de empresas continua
a partir da tabela `empresas` e de `backend/src/modules/empresas/`.

### 5.4 Códigos de erro próprios

| Código | Significado | Resposta da API |
|---|---|---|
| `SG000` | usuário da operação não identificado | 500 (erro de programação) |
| `SG001` | regra de negócio violada (mensagem já é para o usuário) | 422 `REGRA_DE_NEGOCIO` |
| `SG002` | tentativa de alterar histórico imutável | 409 `HISTORICO_IMUTAVEL` |
| `SG003` | perfil sem permissão | 403 `ACESSO_NEGADO` |

---

## 6. API

Base: **`http://sgec.localhost/api`**

### 6.1 Rotas

| Método e rota | Acesso | Descrição |
|---|---|---|
| `GET /saude` | público | API e banco no ar |
| `POST /auth/registro` | público | cadastro (sempre como `SOLICITANTE`); `tipoPessoa` + `empresa` para PJ. CNPJ já cadastrado é recusado |
| `POST /auth/login` | público | login, grava o cookie `sgec_sessao` |
| `POST /auth/logout` | público | encerra a sessão deste aparelho |
| `POST /auth/recuperar-senha` | público | gera o link (resposta sempre igual) |
| `POST /auth/redefinir-senha` | público | usa o link: `{ token, novaSenha }` |
| `GET /auth/eu` | logado | meus dados |
| `PATCH /auth/eu` | logado | edita nome, CPF, telefone e, se for PJ, razão social e nome fantasia |
| `PUT /auth/eu/senha` | logado | `{ senhaAtual, novaSenha }`; derruba as outras sessões |
| `GET /auth/eu/sessoes` | logado | aparelhos conectados (`atual: true` no aparelho em uso) |
| `POST /auth/logout-todos` | logado | encerra todas as minhas sessões |
| `GET /usuarios` | ADMIN | `?busca=&perfil=&tipoPessoa=&ativo=&pagina=&porPagina=` → `{ itens, total, pagina, porPagina }` |
| `POST /usuarios` | ADMIN | cria escolhendo o perfil; com CNPJ já cadastrado, **vincula** à empresa existente |
| `GET /usuarios/:id` | ADMIN | um usuário |
| `PATCH /usuarios/:id` | ADMIN | dados, perfil, `ativo` (não na própria conta) e dados da empresa |
| `PUT /usuarios/:id/senha` | ADMIN | define uma senha nova para alguém |

### 6.2 Formato de erro (todas as rotas)

```json
{
  "erro": {
    "codigo": "DADOS_INVALIDOS",
    "mensagem": "Verifique os dados enviados.",
    "detalhes": [{ "local": "body", "campo": "email", "mensagem": "E-mail inválido" }]
  }
}
```

Códigos usados até agora:

| Grupo | Códigos |
|---|---|
| Rotas e dados | `ROTA_NAO_ENCONTRADA`, `DADOS_INVALIDOS`, `JSON_INVALIDO` |
| Login e sessão | `CREDENCIAIS_INVALIDAS`, `LOGIN_BLOQUEADO`, `CONTA_DESATIVADA`, `NAO_AUTENTICADO`, `SESSAO_EXPIRADA`, `ACESSO_NEGADO` |
| Duplicidade | `EMAIL_EM_USO`, `CPF_EM_USO`, `CNPJ_EM_USO` |
| Senhas | `SENHA_ATUAL_INCORRETA`, `LINK_INVALIDO` |
| Usuários | `USUARIO_NAO_ENCONTRADO`, `OPERACAO_NA_PROPRIA_CONTA`, `SEM_EMPRESA` |
| Inesperado | `ERRO_INTERNO` |

### 6.3 Sessão

- Cookie **`sgec_sessao`**: `HttpOnly`, `SameSite=Strict`, `Path=/api`, `Secure` em produção.
- O token **nunca** vai no corpo da resposta, e o banco guarda **só o hash** dele.
- **Duração:** 8 h (`SESSAO_DURACAO_HORAS`). **Inatividade:** 2 h (`SESSAO_INATIVIDADE_MINUTOS`).
- O **perfil é lido do banco a cada requisição**, então mudanças valem na hora.

### 6.4 Documentação (Swagger)

- **http://sgec.localhost/api/docs**, só em desenvolvimento (em produção a rota não existe).
- O conteúdo fica em `backend/src/docs/openapi.yaml`. Para testar rotas protegidas, execute
  `POST /auth/login` ali mesmo: o navegador guarda o cookie e o envia nas outras rotas.
- Cada módulo documenta as **suas** rotas no mesmo arquivo, com uma `tag` própria (ex.:
  `Espaços` com a descrição `Módulo 2 — Samuel`), reaproveitando `components` (`Erro`,
  `Usuario`, as respostas de erro e o `security: [{ sessao: [] }]`).

---

## 7. Arquitetura do back-end (camadas)

```
requisição → contexto → helmet → express.json → cookieParser
           → routes.js → [autenticar] → [autorizar] → validar (Zod)
           → controller → service → repository → PostgreSQL
                                   ↓ qualquer erro
                             tratarErros → JSON padronizado
```

| Camada | Faz | Nunca faz |
|---|---|---|
| `*.schemas.js` + `validar` | confere e limpa os dados; o resultado fica em `req.validado` | acessa o banco |
| `*.controller.js` | lê `req`, chama o service, responde com `res` | regra de negócio, SQL |
| `*.service.js` | regras de negócio, hash de senha, `transacao(ctx, ...)` | conhece `req`/`res` |
| `*.repository.js` | **único lugar com SQL**, sempre com `$1, $2...` | decide regras |

Padrões fixos:

- **Express 5:** erros assíncronos vão sozinhos para o `tratarErros`, então os controllers **não**
  têm `try/catch`.
- Erro esperado: `throw new AppError(status, 'CODIGO_EM_MAIUSCULAS', 'Mensagem para o usuário.')`.
- **Toda escrita** passa por `transacao(req.ctx, async (db) => { ... })`. Ela informa ao banco quem
  está agindo (`app.usuario_id`) e o id da requisição (`app.requisicao_id`), e é isso que
  alimenta a auditoria.
- Funções de repository que **gravam** recebem `db` (o cliente da transação) como **1º parâmetro**.
- A API **nunca** repassa o `detail` dos erros do PostgreSQL, porque ele pode conter a linha
  inteira, com hash.
- Arquivos dos módulos seguem o padrão `<módulo>.<camada>.js`.

---

## 8. Como os outros módulos usam o Módulo 1

### 8.1 Banco: criar as tabelas do seu módulo

1. Crie a migração em `database/migracoes/`. Os números iniciais já estão reservados, na ordem
   de dependência entre os módulos:

   | Módulo | Arquivo |
   |---|---|
   | 2 — Espaços (Samuel) | `004_modulo2_espacos.sql` |
   | 3 — Reservas (Davi) | `005_modulo3_reservas.sql` |
   | 4 — Aprovação (Victor) | `006_modulo4_aprovacao.sql` |
   | 5 — Cadastros e relatórios (André) | `007_modulo5_cadastros.sql` |

   O `003` é do Módulo 1 (`empresas`). Mudanças posteriores usam o **próximo número livre**
   (`008_...`, `009_...`). Antes de criar,
   puxe o repositório atualizado (`git pull`) para não repetir um número de outra pessoa.
   As migrações rodam **em ordem numérica**, como `sgec_owner`, cada uma numa transação.
2. Siga as convenções da seção 5.2. Modelo de tabela:

```sql
CREATE TABLE espacos (
    id             UUID         NOT NULL DEFAULT gen_random_uuid(),
    nome           VARCHAR(120) NOT NULL,
    ativo          BOOLEAN      NOT NULL DEFAULT true,
    criado_em      TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    atualizado_em  TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    criado_por     UUID,
    atualizado_por UUID,

    CONSTRAINT pk_espacos              PRIMARY KEY (id),
    CONSTRAINT uq_espacos_nome         UNIQUE (nome),
    CONSTRAINT fk_espacos_criado_por   FOREIGN KEY (criado_por)     REFERENCES usuarios (id),
    CONSTRAINT fk_espacos_atualizado_por FOREIGN KEY (atualizado_por) REFERENCES usuarios (id)
);

CREATE TRIGGER trg_espacos_controle
    BEFORE INSERT OR UPDATE ON espacos
    FOR EACH ROW EXECUTE FUNCTION fn_set_controle();

CREATE TRIGGER trg_espacos_auditoria
    AFTER INSERT OR UPDATE OR DELETE ON espacos
    FOR EACH ROW EXECUTE FUNCTION auditoria.fn_registrar_alteracao();
```

   O `trg_espacos_controle` preenche quem criou/alterou e quando (por isso exige
   `transacao(req.ctx, ...)` na API); o `trg_espacos_auditoria` grava o histórico.

3. **Permissões:** acrescente os `GRANT` das suas tabelas em
   `database/seguranca/990_permissoes.sql`, logo depois dos outros `GRANT ... TO sgec_app`
   (depois de `GRANT SELECT ON vw_usuarios TO sgec_app;`). Exemplo:
   `GRANT SELECT, INSERT, UPDATE ON espacos TO sgec_app;`
   Libere `DELETE` só se for realmente necessário. **Nenhuma tabela recebe permissão automática**
   (assim o resultado é igual em qualquer máquina); sem o `GRANT`, a API recebe `permission denied`.
4. Aplique: `docker compose up -d` e confira `docker compose logs migrar --tail 5`.

**Regras das migrações (obrigatórias):**

- **Nunca edite uma migração que já foi aplicada** (inclusive na máquina de outra pessoa). Para
  corrigir ou mudar algo, crie uma migração nova (`ALTER TABLE ...`). O `migrar` compara o
  checksum de cada arquivo e **para com erro** se um arquivo aplicado for alterado.
- Uma migração com erro é desfeita inteira e a API não sobe; corrija o arquivo (ele ainda não foi
  registrado) e rode `docker compose up -d` de novo.
- O `990_permissoes.sql` é a exceção: ele é reaplicado a cada execução, por isso pode (e deve) ser
  editado para acrescentar `GRANT`s.

### 8.2 API: criar as rotas do seu módulo

1. Crie `backend/src/modules/<modulo>/` com `<modulo>.schemas.js`, `.repository.js`,
   `.service.js`, `.controller.js` e `.routes.js` (use `modules/usuarios` como modelo).
2. Registre o módulo em `src/routes.js`:

```js
router.use('/espacos', require('./modules/espacos/espacos.routes'));
```

3. Proteja as rotas:

```js
const autenticar = require('../../middlewares/autenticar');
const autorizar = require('../../middlewares/autorizar');
const validar = require('../../middlewares/validar');
const { PERFIS, EQUIPE, GESTAO } = require('../../config/perfis');

router.get('/', autenticar, validar({ query: s.listarQuery }), controller.listar);
router.post('/', autenticar, autorizar(...GESTAO), validar({ body: s.criarSchema }), controller.criar);
router.delete('/:id', autenticar, autorizar(PERFIS.ADMIN), validar({ params: s.idParams }), controller.desativar);
```

| Grupo | Perfis |
|---|---|
| `EQUIPE` | ADMIN, GESTOR, RECEPCAO |
| `GESTAO` | ADMIN, GESTOR |

4. No controller, use `req.usuario` (`{ id, nome, email, perfil }`), `req.validado.body/query/params`
   e `req.ctx`.
5. Grave sempre com `transacao(req.ctx, (db) => repo.criar(db, dados))`.
6. Reaproveite os campos validados do Módulo 1:
   `const { campos } = require('../auth/auth.schemas')`, que traz `nome`, `email`, `cpf`,
   `telefone` e `senhaForte`.
7. Se a sua tabela tiver constraints que merecem mensagem própria, acrescente-as em
   `CONSTRAINTS` no `middlewares/tratarErros.js`:
   `uq_espacos_nome: [409, 'ESPACO_DUPLICADO', 'Já existe um espaço com esse nome.'],`
8. Mensagens do Zod 4: use `{ error: '...' }` (não existe mais `required_error`,
   `invalid_type_error` nem `errorMap`):
   `z.string({ error: 'Nome é obrigatório' }).trim().min(2, 'Nome muito curto')`.
   Todo `z.array()` precisa de `.max()`.
9. Documente as rotas novas em `backend/src/docs/openapi.yaml` (seção 6.4).
10. A API reinicia sozinha ao salvar (nodemon com polling, funciona no Windows).
11. Antes de mandar para o Git: `docker compose exec api npm run formatar` e
   `docker compose exec api npm run verificar` (sem erros).

### 8.3 Front: criar as telas do seu módulo

1. Crie `frontend/src/modulos/<modulo>/` com `api.js` (uma função por rota da sua API) e
   `paginas/` (as telas). Use `modulos/auth` como modelo.
2. Chame a API **sempre** pelo cliente comum:

```js
import { api } from '@/compartilhado/api/cliente';

export const listarEspacos = (filtros) => api('/espacos', { consulta: filtros });
export const criarEspaco = (dados) => api('/espacos', { metodo: 'POST', corpo: dados });
```

3. Registre as telas em `src/App.jsx`, dentro da área logada, protegendo por perfil quando precisar:

```jsx
<Route path="espacos" element={<Espacos />} />
<Route element={<RotaProtegida perfis={GESTAO} />}>
  <Route path="espacos/novo" element={<NovoEspaco />} />
</Route>
```

4. Para a tela aparecer no menu e no início, acrescente o item no `MENU` de
   `compartilhado/config/navegacao.js` (`rotulo`, `para`, `perfis` — `null` = todos — e
   `descricao`) e tire o seu módulo de `AREAS_EM_CONSTRUCAO`, no mesmo arquivo.
5. Nas telas, use `useAuth()` para saber quem está logado (`usuario.perfil`), os componentes de
   `compartilhado/componentes` e as cores da marca (`bg-marca`, `text-erro`...). Não use cores
   soltas como `#1f4466`, nem `bg-white`/`text-white`: use **`bg-superficie`** (fundo de cartões e
   campos) e **`text-contraste`** (texto sobre botões coloridos). Assim a tela fica certa no
   **modo escuro** automaticamente, sem nenhum código a mais.
6. Imports sempre com `@/` (ex.: `import Botao from '@/compartilhado/componentes/Botao'`).
7. Antes de mandar para o Git: `docker compose exec web npm run formatar` e
   `docker compose exec web npm run verificar` (sem erros).

> A proteção no front é só para a experiência do usuário. A segurança de verdade está na API
> (`autenticar`/`autorizar`) e no banco.

---

## 9. Decisões de segurança

| Ameaça | Defesa |
|---|---|
| Vazamento de senhas | bcrypt custo 12; nenhuma consulta devolve `senha_hash` (a API usa a `vw_usuarios`) |
| Vazamento de sessões e tokens | o banco guarda só o SHA-256; os tokens têm 256 bits aleatórios |
| Roubo de sessão por XSS | cookie `HttpOnly` (o JavaScript não lê) |
| CSRF | `SameSite=Strict` + front e API na mesma origem |
| Força bruta / spray | 5 falhas por e-mail ou 30 por IP em 15 min → `429`; a senha certa também é barrada durante o bloqueio |
| Descobrir quem tem conta | mesma mensagem e mesmo tempo de resposta (hash falso) no login; resposta única no "esqueci a senha" |
| Mass assignment (virar ADMIN) | Zod descarta campos fora do schema; o service escolhe os campos; o cadastro público fixa `SOLICITANTE` |
| SQL injection | só consultas parametrizadas; nomes de coluna dinâmicos vêm de lista fixa |
| Uso duplo de link de recuperação | `FOR UPDATE` + `usado_em`; expira em 30 min; só o último link vale |
| Conta comprometida | trocar a senha, desativar ou mudar o perfil derruba todas as sessões (trigger) |
| Sistema sem administrador | o service impede o admin de se desativar; o trigger impede zero admins ativos |
| API comprometida | `sgec_app` não apaga dados, não lê a auditoria e não altera estrutura |
| Falsificação de IP | a API não tem porta exposta; o Nginx **sobrescreve** `X-Forwarded-For`; `trust proxy = 1` |
| Exposição na rede | todas as portas presas ao `127.0.0.1`; só o proxy é publicado |
| Erros reveladores | o `detail` do PostgreSQL nunca é repassado; em produção não há mensagem técnica |
| Redirecionamento aberto (`?voltar=`) | `destinoSeguro` resolve o endereço com `new URL` e só aceita o mesmo site |
| Banco alterado "pela metade" | cada migração roda numa transação; checksum impede editar migração aplicada |
| Entrar na empresa dos outros | o cadastro público **recusa** CNPJ já cadastrado (`CNPJ_EM_USO`); só o ADMIN vincula uma conta a uma empresa existente |
| Mapa da API exposto | o Swagger só existe em desenvolvimento; a imagem de produção nem instala as bibliotecas dele |
| Lista gigante no corpo (Zod) | limite de 100 kb no corpo; **todo `z.array()` precisa de `.max()`**; Zod 4 sem vulnerabilidade conhecida |
| Dependências vulneráveis | `npm audit` com 0 vulnerabilidades no front e na API; versões travadas pelo `package-lock.json` (`npm ci`) |
| Código de desenvolvimento em produção | imagem de produção sem ESLint/Prettier/Vite; front servido como arquivos estáticos |

---

## 10. Comandos úteis e testes

```powershell
docker compose ps                             # estado dos containers (api e web devem estar "healthy")
docker compose logs api --tail 20             # log da API (o link de recuperação aparece aqui)
docker compose restart api                    # se a API não recarregar sozinha
docker compose up -d --build -V               # depois de mudar o package.json
docker compose exec proxy nginx -t            # conferir o nginx.conf
docker compose exec db psql -U sgec_admin -d sgec   # entrar no banco
docker compose exec api npm run verificar     # Prettier + ESLint da API
docker compose exec web npm run verificar     # Prettier + ESLint do front
```

Documentação interativa da API: **http://sgec.localhost/api/docs**.

Funções de teste para o PowerShell (o endereço vem do `SGEC_URL` do `.env`):

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
. .\scripts\testes.ps1
Chamar GET /saude
$admin = Entrar admin@sgec.local              # pede a senha sem mostrar na tela
Chamar GET '/usuarios?porPagina=5' $admin
Chamar POST /auth/registro $null @{}          # deve listar os campos obrigatórios
```

No `Entrar`, cole a senha com o **botão direito** (o Ctrl+V não funciona na senha escondida do
PowerShell 5).

Desbloquear um e-mail durante os testes (**só em desenvolvimento**):

```powershell
docker compose exec db psql -U sgec_admin -d sgec -c "DELETE FROM tentativas_login WHERE email = 'fulano@email.com';"
```

---

## 11. Situação atual

| Etapa | Situação |
|---|---|
| Docker, banco, usuários do banco, auditoria, permissões | ✅ |
| Cadastro, login, sessão, logout | ✅ |
| Perfis e proteção de rotas | ✅ |
| Editar perfil, trocar senha, recuperação de senha | ✅ |
| Gestão de usuários pelo ADMIN | ✅ |
| Proxy `http://sgec.localhost` | ✅ |
| Migrações do banco (serviço `migrar`) | ✅ |
| Front completo do Módulo 1 (acesso, menu, meu perfil, usuários) | ✅ |
| Back-end sem comentários, ESLint/Prettier, Zod 4 | ✅ |
| Portabilidade (healthchecks, porta configurável, `gerar-env.ps1`) | ✅ |
| Modo produção | ✅ |
| Pessoa física e jurídica (CNPJ alfanumérico) | ✅ |
| Swagger (`/api/docs`) | ✅ |
| Modo escuro | ✅ |
| Revisão final (testes de API e navegador) | ✅ |
| Teste do zero em outra máquina | ⏳ |

**Pendências conhecidas (para depois da entrega do Módulo 1):**

- **Envio de e-mail real.** Hoje o link de recuperação aparece no **log** da API (só em
  desenvolvimento). Para produção, implemente o envio em `src/utils/email.js`; o resto do sistema
  não muda.
- **HTTPS num servidor de verdade.** No `sgec.localhost` o navegador aceita o cookie `Secure` sem
  HTTPS; num domínio real, o Nginx precisa de certificado (ex.: Let's Encrypt).

---

## 12. Prompt para IA (manter o mesmo padrão)

Ao pedir ajuda a uma IA para **acrescentar ou alterar** algo no projeto, cole o prompt abaixo
**antes** do pedido, junto com os arquivos envolvidos. Ele mantém o código igual ao que já
existe e evita reescritas desnecessárias.

````text
Você vai me ajudar no projeto SGEC (Sistema de Gestão de Espaços Compartilhados — coworking e
laboratórios), um projeto interdisciplinar da UNESC com a ABADEUS. Stack: PostgreSQL 16 +
Node.js 22/Express 5 + React 19/Vite 6, tudo em Docker Compose, acessado por http://sgec.localhost
(Nginx: "/" → front, "/api/" → API). Eu uso Windows com PowerShell 5.1.
Há dois modos: desenvolvimento (docker-compose.yml, padrão) e produção
(-f docker-compose.yml -f docker-compose.prod.yml). Os Dockerfiles têm estágios
(desenvolvimento/producao) e os serviços api e web têm healthcheck: não remova nada disso.

## COMO VOCÊ DEVE ME AJUDAR
1. Responda em português do Brasil. Sou estudante: explique o PORQUÊ de cada decisão, de forma
   direta, ligando ao que já existe no projeto ("isso usa o trigger X da etapa Y").
2. Eu escrevo o código. Mostre os arquivos e eu digito. Quando um arquivo mudar em mais de um
   lugar, mande o ARQUIVO COMPLETO para eu substituir; para mudanças pequenas, diga exatamente
   onde colar ("logo abaixo da linha X").
3. Diga sempre o caminho completo do arquivo (ex.: backend/src/modules/espacos/espacos.service.js)
   e se ele é novo, se é para substituir ou se é para acrescentar.
4. Faça MUDANÇAS MÍNIMAS. Não renomeie funções, arquivos, variáveis ou rotas existentes; não
   reorganize pastas; não troque bibliotecas; não "melhore" código que eu não pedi para mudar.
   Se achar que algo deveria mudar, SUGIRA e espere eu concordar.
5. Antes de escrever código, leia os arquivos que eu mandar e SIGA O PADRÃO DELES (nomes, ordem,
   formato de erro). Se precisar de um arquivo que não mandei, PEÇA — não invente
   o conteúdo.
6. Depois do código, dê os comandos PowerShell para subir e testar, os resultados esperados e
   algumas perguntas de previsão ("o que você acha que este teste devolve?").
7. Nunca peça minhas senhas e nunca coloque segredos no código; eles ficam no .env (fora do Git).
   No .env, senhas só com letras e números (o "$" quebra no Docker Compose).

## PADRÕES DO BANCO (PostgreSQL)
- Migrações em database/migracoes/00N_<descricao>.sql, aplicadas em ordem pelo serviço "migrar"
  (database/migrar.sh), como sgec_owner, cada uma numa transação, a cada "docker compose up -d".
  NUNCA edite uma migração já aplicada: crie uma nova (ALTER TABLE...). Permissões SÓ em
  database/seguranca/990_permissoes.sql, reaplicado a cada execução: toda tabela nova precisa
  de GRANT explícito ali (não há permissão automática). Números: 003 é do Módulo 1; os módulos
  2 a 5 usam 004 a 007; depois, o próximo número livre. Nunca sugira "docker compose down -v"
  como solução (apaga os dados).
- Tabelas no plural, snake_case; id UUID DEFAULT gen_random_uuid(); datas TIMESTAMPTZ com
  clock_timestamp(); colunas criado_em/atualizado_em (e criado_por/atualizado_por quando fizer
  sentido).
- Constraints SEMPRE nomeadas: pk_<tabela>, fk_<tabela>_<ref>, uq_<tabela>_<coluna>,
  ck_<tabela>_<regra>; índices ix_<tabela>_<colunas>; triggers trg_<tabela>_<acao>;
  funções fn_<acao>.
- Toda tabela de negócio tem: trigger trg_<tabela>_controle (fn_set_controle) ou
  trg_<tabela>_atualizado_em (fn_set_atualizado_em), e trg_<tabela>_auditoria
  (auditoria.fn_registrar_alteracao).
- Exclusão lógica (ativo = false). A API (sgec_app) não tem DELETE por padrão.
- Erros próprios via RAISE ... USING ERRCODE: SG000 (usuário não identificado), SG001 (regra
  de negócio, mensagem para o usuário), SG002 (histórico imutável), SG003 (perfil sem permissão).
  Para exigir perfil dentro do SQL: PERFORM fn_exigir_perfil('ADMIN', 'GESTOR');
- Usuários: nunca leia/devolva senha_hash; use a view vw_usuarios.
- Arquivos .sh e .sql com fim de linha LF.
- Todo z.array() nos schemas tem .max() (limite de itens).

## PADRÕES DA API (Node/Express 5, CommonJS com require)
- Nomes em português (camelCase no JS, snake_case no banco).
- Cada módulo em backend/src/modules/<modulo>/ com: <modulo>.schemas.js (Zod),
  <modulo>.repository.js (ÚNICO lugar com SQL, sempre parametrizado $1, $2...),
  <modulo>.service.js (regras; não conhece req/res), <modulo>.controller.js (só HTTP),
  <modulo>.routes.js. Registrar em backend/src/routes.js com router.use('/<recurso>', ...).
- Rotas: autenticar → autorizar(...perfis) → validar({ params, query, body }) → controller.
  Perfis em config/perfis.js: PERFIS.ADMIN/GESTOR/RECEPCAO/SOLICITANTE, grupos EQUIPE e GESTAO.
  401 = não sei quem é; 403 = sei, mas não pode.
- Controllers usam req.validado.*, req.usuario ({ id, nome, email, perfil }) e req.ctx.
  Express 5: SEM try/catch nos controllers (o erro vai sozinho para o tratarErros).
- Erros esperados: throw new AppError(status, 'CODIGO_EM_MAIUSCULAS', 'Mensagem para o usuário.').
  Formato de resposta de erro: { erro: { codigo, mensagem, detalhes? } }. Constraints com
  mensagem própria entram no mapa CONSTRAINTS do middlewares/tratarErros.js.
- TODA escrita: transacao(req.ctx, async (db) => { ... }) de database/pool.js (alimenta a
  auditoria). Funções de repository que gravam recebem db como 1º parâmetro.
- Reaproveitar validações: const { campos } = require('../auth/auth.schemas')
  (nome, email, cpf, telefone, senhaForte, tipoPessoa, empresaEditavel).
- Empresas (pessoa jurídica) ficam na tabela empresas; o usuário aponta por usuarios.empresa_id.
- Toda rota nova é documentada em backend/src/docs/openapi.yaml, com a tag do módulo.
- Zod 4: mensagens com { error: '...' } (ex.: z.string({ error: 'Nome é obrigatório' }),
  z.enum(LISTA, { error: '...' }), .refine(fn, { error: '...', path: [...] })). Não use
  required_error, invalid_type_error nem errorMap (são do Zod 3).
- Status: 201 ao criar, 204 sem corpo, 400 dados inválidos, 404 não encontrado,
  409 conflito/duplicado, 422 regra de negócio.
- Respostas de listagem: { itens, total, pagina, porPagina }.
- Segurança: nunca repassar o "detail" de erros do PostgreSQL; nunca devolver hashes/tokens;
  mensagens que não revelem se um e-mail existe; IDs validados como UUID no schema.
- Código SEM comentários (JS, SQL, configs): nomes claros de funções e variáveis; a explicação
  fica na conversa e no README.
- Antes de concluir: "docker compose exec api npm run formatar" e "npm run verificar" sem erros.

## PADRÕES DO FRONT (React 19 + Vite + Tailwind 4 + React Router 7)
- Código por módulo em frontend/src/modulos/<modulo>/ (api.js + paginas/); o que é comum fica em
  frontend/src/compartilhado/ (não altere sem combinar). Imports sempre com "@/".
- Chamadas à API só pelo cliente comum: import { api } from '@/compartilhado/api/cliente';
  erros chegam como ApiError (falha.codigo, falha.message, errosPorCampo(falha)).
- Sessão: useAuth() de '@/modulos/auth/AuthContext' (usuario, entrar, sair...). O front nunca
  guarda token; a sessão é um cookie httpOnly.
- Telas registradas em src/App.jsx; telas restritas dentro de <RotaProtegida perfis={...}>.
  Itens do menu em compartilhado/config/navegacao.js (MENU, com os perfis que podem ver).
- Componentes de compartilhado/componentes (Botao, Campo, CampoSenha, Alerta...). Estilo só com
  classes Tailwind e as cores do tema (bg-marca, text-suave, text-erro...), nunca cores soltas.
  Fundo de cartões/campos: bg-superficie (nunca bg-white); texto sobre cor forte: text-contraste
  (nunca text-white). É isso que faz o modo escuro funcionar sozinho.
- Formulários controlados (useState), noValidate, validação rápida no front com as mesmas regras
  da API, e erros da API mostrados embaixo de cada campo.
- Antes de concluir: "docker compose exec web npm run formatar" e "npm run verificar" sem erros.

## O QUE EU QUERO AGORA
(descreva aqui o que precisa e cole os arquivos envolvidos)
````
