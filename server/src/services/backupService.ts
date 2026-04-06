import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import cron from 'node-cron';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

const ensureBackupDir = () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
};

const pruneOldBackups = (retentionDays = 30) => {
  const files = fs.readdirSync(BACKUP_DIR);
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

  for (const file of files) {
    const filePath = path.join(BACKUP_DIR, file);
    const stat = fs.statSync(filePath);
    if (stat.mtimeMs < cutoff) {
      fs.unlinkSync(filePath);
      console.log(`[Backup] Eliminado backup antiguo: ${file}`);
    }
  }
};

export const runBackup = (): void => {
  ensureBackupDir();

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn('[Backup] DATABASE_URL no configurado. Backup omitido.');
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup_${timestamp}.sql.gz`;
  const outputPath = path.join(BACKUP_DIR, filename);

  try {
    execSync(`pg_dump "${dbUrl}" | gzip > "${outputPath}"`, { stdio: 'pipe' });
    console.log(`[Backup] Backup creado: ${outputPath}`);
    pruneOldBackups();
  } catch (error) {
    console.error('[Backup] Error al crear backup:', (error as Error).message);
  }
};

export const startBackupScheduler = (): void => {
  // Ejecuta todos los días a las 2:00 AM
  cron.schedule('0 2 * * *', () => {
    console.log('[Backup] Iniciando backup programado...');
    runBackup();
  });

  console.log('[Backup] Programador de backups iniciado (diario a las 02:00).');
};
