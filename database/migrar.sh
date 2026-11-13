set -euo pipefail

PASTA=/sgec-database
export PGHOST="${PGHOST:-db}"
export PGPORT="${PGPORT:-5432}"
export PGDATABASE="${DB_NAME:?Defina DB_NAME}"
export PGUSER=sgec_owner
export PGPASSWORD="${DB_OWNER_PASSWORD:?Defina DB_OWNER_PASSWORD}"
export PGOPTIONS="-c client_min_messages=warning"
PSQL=(psql -X -q -v ON_ERROR_STOP=1)

echo "[migrar] aguardando o banco..."
for tentativa in $(seq 1 30); do
    if "${PSQL[@]}" -c 'SELECT 1' >/dev/null 2>&1; then
        break
    fi
    if [ "$tentativa" -eq 30 ]; then
        echo "[migrar] ERRO: não foi possível conectar como sgec_owner." >&2
        exit 1
    fi
    sleep 2
done

"${PSQL[@]}" >/dev/null <<'SQL'
CREATE TABLE IF NOT EXISTS migracoes_aplicadas (
    nome        TEXT        NOT NULL,
    checksum    CHAR(64)    NOT NULL,
    aplicada_em TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT pk_migracoes_aplicadas PRIMARY KEY (nome)
);
SQL

REGISTRO=$(mktemp)
trap 'rm -f "$REGISTRO"' EXIT
echo "INSERT INTO migracoes_aplicadas (nome, checksum) VALUES (:'nome', :'checksum');" > "$REGISTRO"

novas=0
for arquivo in "$PASTA"/migracoes/*.sql; do
    [ -e "$arquivo" ] || continue
    nome=$(basename "$arquivo")
    checksum=$(tr -d '\r' < "$arquivo" | sha256sum | cut -d' ' -f1)
    registrado=$(echo "SELECT checksum FROM migracoes_aplicadas WHERE nome = :'nome';" | "${PSQL[@]}" -tA -v nome="$nome")

    if [ -z "$registrado" ]; then
        echo "[migrar] aplicando $nome"
        "${PSQL[@]}" --single-transaction -v nome="$nome" -v checksum="$checksum" -f "$arquivo" -f "$REGISTRO" >/dev/null
        novas=$((novas + 1))
    elif [ "$registrado" != "$checksum" ]; then
        echo "[migrar] ERRO: $nome já foi aplicada e depois foi alterada." >&2
        echo "[migrar]       Não edite migrações aplicadas: crie um arquivo novo com a mudança." >&2
        exit 1
    fi
done

for arquivo in "$PASTA"/seguranca/*.sql; do
    [ -e "$arquivo" ] || continue
    echo "[migrar] aplicando permissões: $(basename "$arquivo")"
    "${PSQL[@]}" --single-transaction -f "$arquivo" >/dev/null
done

echo "[migrar] concluído: $novas migração(ões) nova(s)."
