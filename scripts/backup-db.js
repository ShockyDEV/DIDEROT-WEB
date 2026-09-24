/**
 * Volcado de seguridad de la base de datos a backups/ (fuera de git).
 *
 *   npm run db:backup
 *
 * Las ediciones hechas desde el panel viven únicamente en la BD: este
 * volcado es su red de seguridad. Ejecutar antes de tocar Docker y después de
 * sesiones largas de edición. Se conservan los 14 más recientes.
 *
 * En producción el contenedor es diderot-web-db (ver docker-compose.prod.yml):
 *   DB_CONTAINER=diderot-web-db npm run db:backup
 * (o, sin Node en el host, scripts/backup-prod.sh).
 */
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const CONTAINER = process.env.DB_CONTAINER ?? "diderot-web-postgres";
const DB_USER = process.env.DB_USER ?? "diderot";
const DB_NAME = process.env.DB_NAME ?? "diderot_web";
const KEEP = 14;

const dir = path.join(__dirname, "..", "backups");
fs.mkdirSync(dir, { recursive: true });

const stamp = new Date()
  .toISOString()
  .slice(0, 16)
  .replace(/[-:]/g, "")
  .replace("T", "-");
const file = path.join(dir, `${DB_NAME}-${stamp}.sql`);

const sql = execSync(
  `docker exec ${CONTAINER} pg_dump -U ${DB_USER} -d ${DB_NAME}`,
  { maxBuffer: 256 * 1024 * 1024 },
);
fs.writeFileSync(file, sql);
console.log(`✓ ${path.relative(process.cwd(), file)} (${Math.round(sql.length / 1024)} KB)`);

// retención: se borran los volcados más antiguos a partir del nº KEEP
const dumps = fs
  .readdirSync(dir)
  .filter((f) => f.startsWith(`${DB_NAME}-`) && f.endsWith(".sql"))
  .sort()
  .reverse();
for (const old of dumps.slice(KEEP)) {
  fs.unlinkSync(path.join(dir, old));
  console.log(`  − retirado ${old}`);
}
console.log(`(${Math.min(dumps.length, KEEP)} volcado(s) conservados; restaurar con:`);
console.log(` docker exec -i ${CONTAINER} psql -U ${DB_USER} -d ${DB_NAME} < backups/<fichero>.sql)`);
