CREATE TABLE empresas (
    id            UUID          NOT NULL DEFAULT gen_random_uuid(),
    cnpj          CHAR(14)      NOT NULL,
    razao_social  VARCHAR(150)  NOT NULL,
    nome_fantasia VARCHAR(150),
    ativo         BOOLEAN       NOT NULL DEFAULT TRUE,
    criado_em     TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
    atualizado_em TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT pk_empresas               PRIMARY KEY (id),
    CONSTRAINT uq_empresas_cnpj          UNIQUE (cnpj),
    CONSTRAINT ck_empresas_cnpj          CHECK (cnpj ~ '^[0-9A-Z]{12}[0-9]{2}$'),
    CONSTRAINT ck_empresas_razao_social  CHECK (length(btrim(razao_social)) >= 2),
    CONSTRAINT ck_empresas_nome_fantasia CHECK (nome_fantasia IS NULL OR length(btrim(nome_fantasia)) >= 2)
);

CREATE TRIGGER trg_empresas_atualizado_em
    BEFORE UPDATE ON empresas
    FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();

CREATE TRIGGER trg_empresas_auditoria
    AFTER INSERT OR UPDATE OR DELETE ON empresas
    FOR EACH ROW EXECUTE FUNCTION auditoria.fn_registrar_alteracao();

ALTER TABLE usuarios
    ADD COLUMN empresa_id UUID,
    ADD CONSTRAINT fk_usuarios_empresa FOREIGN KEY (empresa_id) REFERENCES empresas (id);

CREATE INDEX ix_usuarios_empresa ON usuarios (empresa_id) WHERE empresa_id IS NOT NULL;

CREATE OR REPLACE VIEW vw_usuarios AS
SELECT id, nome, email, cpf, telefone, perfil, ativo,
       email_verificado_em, ultimo_login_em, criado_em, atualizado_em, empresa_id
  FROM usuarios;
