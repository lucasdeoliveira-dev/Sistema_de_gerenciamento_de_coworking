CREATE TABLE espacos (
    id             UUID         NOT NULL DEFAULT gen_random_uuid(),
    nome           VARCHAR(120) NOT NULL,
    tipo           VARCHAR(20)  NOT NULL,
    capacidade     INTEGER      NOT NULL,
    ativo          BOOLEAN      NOT NULL DEFAULT true,
    criado_em      TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    atualizado_em  TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    criado_por     UUID,
    atualizado_por UUID,

    CONSTRAINT pk_espacos              PRIMARY KEY (id),
    CONSTRAINT uq_espacos_nome         UNIQUE (nome),
    CONSTRAINT ck_espacos_nome         CHECK (length(btrim(nome)) BETWEEN 2 AND 120),
    CONSTRAINT ck_espacos_tipo         CHECK (tipo IN ('COWORKING', 'LABORATORIO', 'SALA')),
    CONSTRAINT ck_espacos_capacidade   CHECK (capacidade BETWEEN 1 AND 500),
    CONSTRAINT fk_espacos_criado_por   FOREIGN KEY (criado_por) REFERENCES usuarios (id),
    CONSTRAINT fk_espacos_atualizado_por FOREIGN KEY (atualizado_por) REFERENCES usuarios (id)
);

CREATE TRIGGER trg_espacos_controle
    BEFORE INSERT OR UPDATE ON espacos
    FOR EACH ROW EXECUTE FUNCTION fn_set_controle();

CREATE TRIGGER trg_espacos_auditoria
    AFTER INSERT OR UPDATE OR DELETE ON espacos
    FOR EACH ROW EXECUTE FUNCTION auditoria.fn_registrar_alteracao();

CREATE TABLE horarios_funcionamento (
    id             UUID        NOT NULL DEFAULT gen_random_uuid(),
    espaco_id      UUID        NOT NULL,
    dia_semana     SMALLINT    NOT NULL,
    hora_inicio    TIME        NOT NULL,
    hora_fim       TIME        NOT NULL,
    ativo          BOOLEAN     NOT NULL DEFAULT true,
    criado_em      TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    criado_por     UUID,
    atualizado_por UUID,

    CONSTRAINT pk_horarios_funcionamento     PRIMARY KEY (id),
    CONSTRAINT fk_horarios_espaco            FOREIGN KEY (espaco_id) REFERENCES espacos (id),
    CONSTRAINT fk_horarios_criado_por        FOREIGN KEY (criado_por) REFERENCES usuarios (id),
    CONSTRAINT fk_horarios_atualizado_por    FOREIGN KEY (atualizado_por) REFERENCES usuarios (id),
    CONSTRAINT ck_horarios_dia_semana        CHECK (dia_semana BETWEEN 1 AND 7),
    CONSTRAINT ck_horarios_faixa             CHECK (hora_fim > hora_inicio)
);

CREATE UNIQUE INDEX uq_horarios_funcionamento_inicio
    ON horarios_funcionamento (espaco_id, dia_semana, hora_inicio)
    WHERE ativo;

CREATE OR REPLACE FUNCTION fn_horario_sem_sobreposicao()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT NEW.ativo THEN
        RETURN NEW;
    END IF;

    IF EXISTS (
        SELECT 1
          FROM horarios_funcionamento AS h
         WHERE h.espaco_id = NEW.espaco_id
           AND h.dia_semana = NEW.dia_semana
           AND h.ativo
           AND h.id IS DISTINCT FROM NEW.id
           AND h.hora_inicio < NEW.hora_fim
           AND NEW.hora_inicio < h.hora_fim
    ) THEN
        RAISE EXCEPTION 'Este horário sobrepõe outro já cadastrado neste dia.'
            USING ERRCODE = 'SG001';
    END IF;

    RETURN NEW;
END;
$$;

ALTER FUNCTION fn_horario_sem_sobreposicao() SET search_path = public, pg_temp;

CREATE TRIGGER trg_horarios_funcionamento_sobreposicao
    BEFORE INSERT OR UPDATE ON horarios_funcionamento
    FOR EACH ROW EXECUTE FUNCTION fn_horario_sem_sobreposicao();

CREATE TRIGGER trg_horarios_funcionamento_controle
    BEFORE INSERT OR UPDATE ON horarios_funcionamento
    FOR EACH ROW EXECUTE FUNCTION fn_set_controle();

CREATE TRIGGER trg_horarios_funcionamento_auditoria
    AFTER INSERT OR UPDATE OR DELETE ON horarios_funcionamento
    FOR EACH ROW EXECUTE FUNCTION auditoria.fn_registrar_alteracao();
