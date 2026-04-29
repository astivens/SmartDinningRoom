import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import routes from './routes';
import { connectDB } from './config/database';
import { startBackupScheduler } from './services/backupService';
import { startCycleAutomationScheduler } from './services/cycleAutomationService';
import { auditHttpEvents } from './middleware/eventAudit';
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

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api', auditHttpEvents);
app.use('/api', routes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const startServer = async () => {
  try {
    await connectDB();
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('Warning: Email credentials not configured. Emails will not be sent.');
    }

    startBackupScheduler();
    startCycleAutomationScheduler();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
