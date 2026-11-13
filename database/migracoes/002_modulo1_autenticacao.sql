-- =====================================================================
-- 002 - MÓDULO 1: AUTENTICAÇÃO E SEGURANÇA
-- Responsável: Lucas de Oliveira
-- =====================================================================

-- ---------------------------------------------------------------------
-- USUARIOS
-- Perfis:
--   ADMIN       - administra todo o sistema
--   GESTOR      - gerencia espaços, aprova reservas e vê relatórios
--   RECEPCAO    - aprova reservas e faz check-in/check-out
--   SOLICITANTE - consulta disponibilidade e solicita reservas
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
    id                  UUID          NOT NULL DEFAULT gen_random_uuid(),
    nome                VARCHAR(150)  NOT NULL,
    email               CITEXT        NOT NULL,
    cpf                 VARCHAR(11),                          -- opcional, só números
    telefone            VARCHAR(20),
    senha_hash          TEXT          NOT NULL,               -- nunca a senha em texto puro
    perfil              VARCHAR(20)   NOT NULL DEFAULT 'SOLICITANTE',
    ativo               BOOLEAN       NOT NULL DEFAULT TRUE,  -- desativar em vez de excluir
    email_verificado_em TIMESTAMPTZ,
    ultimo_login_em     TIMESTAMPTZ,
    criado_em           TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    atualizado_em       TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT pk_usuarios        PRIMARY KEY (id),
    CONSTRAINT uq_usuarios_email  UNIQUE (email),
    CONSTRAINT uq_usuarios_cpf    UNIQUE (cpf),
    CONSTRAINT ck_usuarios_email  CHECK (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    CONSTRAINT ck_usuarios_cpf    CHECK (cpf ~ '^[0-9]{11}$'),
    CONSTRAINT ck_usuarios_nome   CHECK (length(btrim(nome)) >= 2),
    CONSTRAINT ck_usuarios_perfil CHECK (perfil IN ('ADMIN', 'GESTOR', 'RECEPCAO', 'SOLICITANTE'))
);

CREATE INDEX ix_usuarios_perfil ON usuarios (perfil) WHERE ativo;

CREATE TRIGGER trg_usuarios_atualizado_em
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();

CREATE TRIGGER trg_usuarios_auditoria
    AFTER INSERT OR UPDATE OR DELETE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION auditoria.fn_registrar_alteracao();

COMMENT ON TABLE  usuarios            IS 'Contas de acesso. Nunca excluir: desativar (ativo = false).';
COMMENT ON COLUMN usuarios.senha_hash IS 'Hash bcrypt. Nunca selecionar fora do módulo de autenticação.';

-- ---------------------------------------------------------------------
-- Regra: o sistema nunca pode ficar sem um ADMIN ativo.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_garantir_admin_ativo()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.perfil = 'ADMIN' AND OLD.ativo
       AND (TG_OP = 'DELETE' OR NEW.perfil <> 'ADMIN' OR NOT NEW.ativo)
       AND NOT EXISTS (SELECT 1 FROM usuarios
                        WHERE perfil = 'ADMIN' AND ativo AND id <> OLD.id) THEN
        RAISE EXCEPTION 'O sistema precisa de pelo menos um administrador ativo.'
            USING ERRCODE = 'SG001';
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_usuarios_garantir_admin
    BEFORE UPDATE OF perfil, ativo OR DELETE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION fn_garantir_admin_ativo();

-- ---------------------------------------------------------------------
-- View para os outros módulos (sem dados sensíveis)
-- ---------------------------------------------------------------------
CREATE VIEW vw_usuarios AS
SELECT id, nome, email, cpf, telefone, perfil, ativo,
       email_verificado_em, ultimo_login_em, criado_em, atualizado_em
  FROM usuarios;

-- ---------------------------------------------------------------------
-- SESSOES DE LOGIN
-- O token fica no cookie do navegador; o banco guarda só o hash (SHA-256).
-- ---------------------------------------------------------------------
CREATE TABLE sessoes (
    id               UUID          NOT NULL DEFAULT gen_random_uuid(),
    usuario_id       UUID          NOT NULL,
    token_hash       CHAR(64)      NOT NULL,
    ip               INET,
    user_agent       VARCHAR(500),
    criada_em        TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    ultimo_acesso_em TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    expira_em        TIMESTAMPTZ   NOT NULL,
    revogada_em      TIMESTAMPTZ,  -- preenchido no logout

    CONSTRAINT pk_sessoes           PRIMARY KEY (id),
    CONSTRAINT fk_sessoes_usuario   FOREIGN KEY (usuario_id)
                                    REFERENCES usuarios (id) ON DELETE CASCADE,
    CONSTRAINT uq_sessoes_token     UNIQUE (token_hash),
    CONSTRAINT ck_sessoes_token     CHECK (token_hash ~ '^[a-f0-9]{64}$'),
    CONSTRAINT ck_sessoes_expiracao CHECK (expira_em > criada_em)
);

CREATE INDEX ix_sessoes_usuario_ativas ON sessoes (usuario_id) WHERE revogada_em IS NULL;
CREATE INDEX ix_sessoes_expira_em      ON sessoes (expira_em);

-- Desativar, trocar o perfil ou trocar a senha derruba as sessões do usuário na hora
CREATE OR REPLACE FUNCTION fn_revogar_sessoes_usuario()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF (OLD.ativo AND NOT NEW.ativo)
       OR OLD.perfil <> NEW.perfil
       OR OLD.senha_hash <> NEW.senha_hash THEN
        UPDATE sessoes
           SET revogada_em = clock_timestamp()
         WHERE usuario_id = NEW.id AND revogada_em IS NULL;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_usuarios_revogar_sessoes
    AFTER UPDATE OF ativo, perfil, senha_hash ON usuarios
    FOR EACH ROW EXECUTE FUNCTION fn_revogar_sessoes_usuario();

-- ---------------------------------------------------------------------
-- RECUPERAÇÃO DE SENHA ("esqueci minha senha")
-- ---------------------------------------------------------------------
CREATE TABLE tokens_recuperacao_senha (
    id             UUID         NOT NULL DEFAULT gen_random_uuid(),
    usuario_id     UUID         NOT NULL,
    token_hash     CHAR(64)     NOT NULL,
    ip_solicitacao INET,
    criado_em      TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    expira_em      TIMESTAMPTZ  NOT NULL,
    usado_em       TIMESTAMPTZ,  -- impede usar o mesmo link duas vezes

    CONSTRAINT pk_tokens_rec           PRIMARY KEY (id),
    CONSTRAINT fk_tokens_rec_usuario   FOREIGN KEY (usuario_id)
                                       REFERENCES usuarios (id) ON DELETE CASCADE,
    CONSTRAINT uq_tokens_rec_hash      UNIQUE (token_hash),
    CONSTRAINT ck_tokens_rec_hash      CHECK (token_hash ~ '^[a-f0-9]{64}$'),
    CONSTRAINT ck_tokens_rec_expiracao CHECK (expira_em > criado_em),
    CONSTRAINT ck_tokens_rec_uso       CHECK (usado_em IS NULL OR usado_em >= criado_em)
);

CREATE INDEX ix_tokens_rec_usuario ON tokens_recuperacao_senha (usuario_id);

-- ---------------------------------------------------------------------
-- TENTATIVAS DE LOGIN (bloqueio de força bruta + auditoria de acesso)
-- Sem FK: registra até e-mails que não existem.
-- ---------------------------------------------------------------------
CREATE TABLE tentativas_login (
    id        BIGINT       GENERATED ALWAYS AS IDENTITY,
    email     CITEXT       NOT NULL,
    ip        INET,
    sucesso   BOOLEAN      NOT NULL,
    motivo    VARCHAR(30),
    criado_em TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT pk_tentativas_login     PRIMARY KEY (id),
    CONSTRAINT ck_tentativas_motivo    CHECK (
        motivo IS NULL OR motivo IN ('SENHA_INVALIDA', 'USUARIO_INEXISTENTE',
                                     'USUARIO_INATIVO', 'BLOQUEADO')
    ),
    CONSTRAINT ck_tentativas_coerencia CHECK (sucesso = (motivo IS NULL))
);

CREATE INDEX ix_tentativas_email_data ON tentativas_login (email, criado_em DESC);
CREATE INDEX ix_tentativas_ip_data    ON tentativas_login (ip, criado_em DESC);

-- ← MOVIDO PARA CÁ: só pode ser criado depois que a tabela tentativas_login existe
CREATE TRIGGER trg_tentativas_login_imutavel
    BEFORE UPDATE ON tentativas_login
    FOR EACH ROW EXECUTE FUNCTION fn_bloquear_alteracao();

-- ---------------------------------------------------------------------
-- Está bloqueado? Conta as falhas desde o último login com sucesso,
-- dentro da janela de tempo. A API chama ANTES de conferir a senha:
--   SELECT fn_login_bloqueado('maria@email.com');
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_login_bloqueado(
    p_email      CITEXT,
    p_max_falhas INTEGER  DEFAULT 5,
    p_janela     INTERVAL DEFAULT INTERVAL '15 minutes'
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT count(*) >= p_max_falhas
      FROM tentativas_login t
     WHERE t.email = p_email
       AND NOT t.sucesso
       AND t.criado_em > GREATEST(
             clock_timestamp() - p_janela,
             COALESCE((SELECT max(s.criado_em) FROM tentativas_login s
                        WHERE s.email = p_email AND s.sucesso), '-infinity')
           );
$$;

-- ---------------------------------------------------------------------
-- Exige que o usuário da operação (app.usuario_id) esteja ativo e tenha
-- um dos perfis informados. Usada pelas funções sensíveis dos módulos:
--   PERFORM fn_exigir_perfil('ADMIN', 'GESTOR');
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_exigir_perfil(VARIADIC p_perfis TEXT[])
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_usuario UUID := fn_usuario_atual();
BEGIN
    IF v_usuario IS NULL THEN
        RAISE EXCEPTION 'Usuário da operação não identificado. Defina app.usuario_id na transação.'
            USING ERRCODE = 'SG000';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM usuarios
                    WHERE id = v_usuario AND ativo AND perfil = ANY (p_perfis)) THEN
        RAISE EXCEPTION 'Seu perfil não tem permissão para esta ação.' USING ERRCODE = 'SG003';
    END IF;

    RETURN v_usuario;
END;
$$;
