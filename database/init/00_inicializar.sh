main() (
set -euo pipefail

validar_senha() {
    local nome="$1" valor="${!1:-}"
    if [ "${#valor}" -lt 16 ]; then
        echo "ERRO: $nome precisa ter pelo menos 16 caracteres." >&2
        exit 1
    fi
}
validar_senha DB_OWNER_PASSWORD
validar_senha DB_APP_PASSWORD
validar_senha DB_LEITURA_PASSWORD
if [ "$DB_OWNER_PASSWORD" = "$DB_APP_PASSWORD" ] \
   || [ "$DB_APP_PASSWORD" = "$DB_LEITURA_PASSWORD" ] \
   || [ "$DB_OWNER_PASSWORD" = "$DB_LEITURA_PASSWORD" ]; then
    echo "ERRO: use uma senha diferente para cada usuário do banco." >&2
    exit 1
fi

PSQL=(psql -v ON_ERROR_STOP=1 -q --username "$POSTGRES_USER" --dbname "$POSTGRES_DB")

echo "[sgec] criando usuários do banco..."
"${PSQL[@]}" -v owner_senha="$DB_OWNER_PASSWORD" -v app_senha="$DB_APP_PASSWORD" \
    -v leitura_senha="$DB_LEITURA_PASSWORD" -v banco="$POSTGRES_DB" <<'SQL'
SET password_encryption = 'scram-sha-256';
CREATE ROLE sgec_owner   LOGIN PASSWORD :'owner_senha'   NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 5;
CREATE ROLE sgec_app     LOGIN PASSWORD :'app_senha'     NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 30;
CREATE ROLE sgec_leitura LOGIN PASSWORD :'leitura_senha' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 5;
ALTER ROLE sgec_app     SET statement_timeout = '30s';
ALTER ROLE sgec_app     SET idle_in_transaction_session_timeout = '60s';
ALTER ROLE sgec_app     SET lock_timeout = '10s';
ALTER ROLE sgec_leitura SET statement_timeout = '60s';
ALTER ROLE sgec_leitura SET default_transaction_read_only = on;
ALTER DATABASE :"banco" OWNER TO sgec_owner;
ALTER SCHEMA public OWNER TO sgec_owner;
REVOKE ALL ON DATABASE :"banco" FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT CONNECT ON DATABASE :"banco" TO sgec_app, sgec_leitura;
REVOKE CONNECT ON DATABASE postgres  FROM PUBLIC;
REVOKE CONNECT ON DATABASE template1 FROM PUBLIC;
SQL

echo "[sgec] usuários do banco criados. As tabelas são criadas pelo serviço migrar."
)

main