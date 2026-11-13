ALTER FUNCTION auditoria.fn_registrar_alteracao()
    SECURITY DEFINER SET search_path = public, pg_temp;

ALTER FUNCTION fn_usuario_atual()                              SET search_path = public, pg_temp;
ALTER FUNCTION fn_exigir_perfil(TEXT[])                        SET search_path = public, pg_temp;
ALTER FUNCTION fn_login_bloqueado(CITEXT, INTEGER, INTERVAL)   SET search_path = public, pg_temp;

REVOKE ALL ON SCHEMA auditoria FROM PUBLIC;

CREATE OR REPLACE FUNCTION pg_temp.conceder_funcoes(p_comando TEXT, p_destino TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $f$
DECLARE
    v_funcao REGPROCEDURE;
BEGIN
    FOR v_funcao IN
        SELECT p.oid::regprocedure
          FROM pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname IN ('public', 'auditoria')
           AND NOT EXISTS (SELECT 1 FROM pg_depend d
                            WHERE d.objid = p.oid AND d.deptype = 'e')
    LOOP
        EXECUTE format('%s EXECUTE ON FUNCTION %s %s %s', p_comando, v_funcao,
                       CASE WHEN p_comando = 'GRANT' THEN 'TO' ELSE 'FROM' END, p_destino);
    END LOOP;
END;
$f$;

SELECT pg_temp.conceder_funcoes('REVOKE', 'PUBLIC');

GRANT USAGE ON SCHEMA public TO sgec_app;
SELECT pg_temp.conceder_funcoes('GRANT', 'sgec_app');
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO sgec_app;

GRANT SELECT, INSERT, UPDATE ON usuarios, sessoes, tokens_recuperacao_senha TO sgec_app;

GRANT SELECT, INSERT ON tentativas_login TO sgec_app;

GRANT SELECT ON vw_usuarios TO sgec_app;

GRANT SELECT, INSERT, UPDATE ON empresas TO sgec_app;

GRANT USAGE ON SCHEMA public, auditoria TO sgec_leitura;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO sgec_leitura;
GRANT SELECT ON auditoria.alteracoes TO sgec_leitura;
SELECT pg_temp.conceder_funcoes('GRANT', 'sgec_leitura');

REVOKE SELECT ON usuarios, sessoes, tokens_recuperacao_senha FROM sgec_leitura;

ALTER DEFAULT PRIVILEGES FOR ROLE sgec_owner
    REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
