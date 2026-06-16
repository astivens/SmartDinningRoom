import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import cron from 'node-cron';
import { Op } from 'sequelize';
import routes from './routes';
import { connectDB } from './config/database';
import { startBackupScheduler } from './services/backupService';
import { startCycleAutomationScheduler } from './services/cycleAutomationService';
import { auditHttpEvents } from './middleware/eventAudit';
import { AuthRequest } from './middleware/auth';
import { User, Student } from './models';
import { generateCodigoInterno } from './utils/uidGenerator';
import { CARRERA_ABREVIATURAS } from './constants';
import './models';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const serveProtectedFile = async (req: AuthRequest, res: express.Response) => {
  const filename = req.params.filename;
  if (!filename || filename.includes('/') || filename.includes('..')) {
    return res.status(400).json({ message: 'Nombre de archivo inválido' });
  }

  const token = (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null)
    || (req.query.token as string | undefined);

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET || 'secret');
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }

  const filePath = path.join(__dirname, '../uploads', filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Archivo no encontrado' });
  }
  res.sendFile(filePath);
};

app.get('/uploads/:filename', serveProtectedFile);

app.use('/api', auditHttpEvents);
app.use('/api', routes);

app.get('/api/uploads/:filename', serveProtectedFile);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const startServer = async () => {
  try {
    await connectDB();

    const studentsWithoutCode = await Student.findAll({ where: { codigoInterno: null as any } });
    if (studentsWithoutCode.length > 0) {
      for (const s of studentsWithoutCode) {
        const abrev = CARRERA_ABREVIATURAS[s.carrera] || 'GEN';
        const year = new Date().getFullYear().toString().slice(2);
        const count = await Student.count({
          where: { codigoInterno: { [Op.like]: `${abrev}-${year}-%` } }
        });
        s.codigoInterno = generateCodigoInterno(s.carrera, count + 1);
        await s.save({ hooks: false });
      }
      console.log(`[Backfill] ${studentsWithoutCode.length} estudiantes recibieron código interno`);
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('Warning: Email credentials not configured. Emails will not be sent.');
    }

    startBackupScheduler();
    startCycleAutomationScheduler();

    cron.schedule('0 3 * * *', async () => {
      try {
        const cleaned = await User.update(
          { resetPasswordToken: null, resetPasswordExpires: null },
          { where: { resetPasswordExpires: { [Op.lt]: new Date() } } }
        );
        if (cleaned[0] > 0) {
          console.log(`[TokenCleanup] ${cleaned[0]} tokens expirados limpiados`);
        }
      } catch (err) {
        console.error('[TokenCleanup] Error:', err);
      }
    });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
