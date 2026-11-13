CREATE EXTENSION IF NOT EXISTS citext;

CREATE OR REPLACE FUNCTION fn_set_atualizado_em()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.atualizado_em := clock_timestamp();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION fn_usuario_atual()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
    SELECT NULLIF(current_setting('app.usuario_id', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION fn_set_controle()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.criado_em      := clock_timestamp();
        NEW.atualizado_em  := NEW.criado_em;
        NEW.criado_por     := COALESCE(NEW.criado_por, fn_usuario_atual());
        NEW.atualizado_por := COALESCE(NEW.atualizado_por, NEW.criado_por);
    ELSE
        NEW.criado_em      := OLD.criado_em;
        NEW.criado_por     := OLD.criado_por;
        NEW.atualizado_em  := clock_timestamp();
        NEW.atualizado_por := COALESCE(
            fn_usuario_atual(),
            CASE WHEN NEW.atualizado_por IS DISTINCT FROM OLD.atualizado_por
                 THEN NEW.atualizado_por END
        );
    END IF;

    IF NEW.criado_por IS NULL OR NEW.atualizado_por IS NULL THEN
        RAISE EXCEPTION 'Usuário da operação não identificado em %. Defina app.usuario_id na transação.', TG_TABLE_NAME
            USING ERRCODE = 'SG000';
    END IF;

    RETURN NEW;
END;
$$;

CREATE SCHEMA IF NOT EXISTS auditoria;

CREATE TABLE auditoria.alteracoes (
    id             BIGINT       GENERATED ALWAYS AS IDENTITY,
    criado_em      TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    esquema        TEXT         NOT NULL,
    tabela         TEXT         NOT NULL,
    registro_id    TEXT         NOT NULL,
    operacao       VARCHAR(6)   NOT NULL,
    usuario_id     UUID,                       
    usuario_banco  TEXT         NOT NULL DEFAULT current_user,
    transacao      BIGINT       NOT NULL DEFAULT txid_current(),
    requisicao_id  TEXT,                       
    antes          JSONB,
    depois         JSONB,

    CONSTRAINT pk_alteracoes          PRIMARY KEY (id),
    CONSTRAINT ck_alteracoes_operacao CHECK (operacao IN ('INSERT', 'UPDATE', 'DELETE'))
);

CREATE INDEX ix_alteracoes_registro ON auditoria.alteracoes (tabela, registro_id, criado_em);
CREATE INDEX ix_alteracoes_usuario  ON auditoria.alteracoes (usuario_id, criado_em DESC);

CREATE OR REPLACE FUNCTION auditoria.fn_registrar_alteracao()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_antes  JSONB;
    v_depois JSONB;
BEGIN
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        v_antes := to_jsonb(OLD) - 'senha_hash' - 'token_hash';
    END IF;
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        v_depois := to_jsonb(NEW) - 'senha_hash' - 'token_hash';
    END IF;

    IF TG_OP = 'UPDATE'
       AND (v_antes - 'atualizado_em' - 'atualizado_por') = (v_depois - 'atualizado_em' - 'atualizado_por') THEN
        RETURN NULL;
    END IF;

    INSERT INTO auditoria.alteracoes
        (esquema, tabela, registro_id, operacao, usuario_id, requisicao_id, antes, depois)
    VALUES
        (TG_TABLE_SCHEMA, TG_TABLE_NAME, COALESCE(v_depois, v_antes) ->> 'id', TG_OP,
         fn_usuario_atual(), NULLIF(current_setting('app.requisicao_id', true), ''),
         v_antes, v_depois);

    RETURN NULL;  
END;
$$;

CREATE OR REPLACE FUNCTION fn_bloquear_alteracao()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'A tabela % aceita somente inclusões (histórico imutável).', TG_TABLE_NAME
        USING ERRCODE = 'SG002';
END;
$$;

CREATE TRIGGER trg_alteracoes_imutavel
    BEFORE UPDATE OR DELETE ON auditoria.alteracoes
    FOR EACH ROW EXECUTE FUNCTION fn_bloquear_alteracao();
