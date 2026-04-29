import cron from 'node-cron';
import { Op } from 'sequelize';
import { Cycle, Student, User } from '../models';
import * as emailService from './emailService';

export const runCycleAutomation = async () => {
  console.log('[CycleAutomation] Iniciando proceso de cierre de ciclo...');
  const now = new Date();

  try {
    // 1. Find cycles that have ended but are still 'Activo'
    const expiredCycles = await Cycle.findAll({
      where: {
        status: 'Activo',
        endDate: {
          [Op.lt]: now
        }
      }
    });

    for (const cycle of expiredCycles) {
      console.log(`[CycleAutomation] Cerrando ciclo: ${cycle.name}`);

      // 2. Close the cycle
      cycle.status = 'Cerrado';
      await cycle.save();

      // 3. Find all active students in this cycle
      const studentsToDisable = await Student.findAll({
        where: {
          currentCycle: cycle.name,
        },
        include: [{
          model: User,
          as: 'user',
          where: { isActive: true }
        }]
      });

      for (const student of studentsToDisable) {
        console.log(`[CycleAutomation] Deshabilitando estudiante: ${student.cedula} (User: ${student.userId})`);

        // 4. Disable the user
        const user = student.user;
        if (user) {
          user.isActive = false;
          await user.save();
        }

        // 5. Update student cycle info
        student.cycleDisabledAt = now;
        await student.save();

        // 6. Send notification (if email service is available and configured)
        try {
          await emailService.sendRevalidationEmail(user.email, cycle.name);
        } catch (emailError) {
          console.warn(`[CycleAutomation] No se pudo enviar email a ${user.email}:`, emailError);
        }
      }

      console.log(`[CycleAutomation] Ciclo ${cycle.name} cerrado y ${studentsToDisable.length} estudiantes procesados.`);
    }

    console.log('[CycleAutomation] Proceso completado.');
  } catch (error) {
    console.error('[CycleAutomation] Error durante la automatización:', error);
  }
};

export const startCycleAutomationScheduler = () => {
  // Ejecuta todos los días a la 1:00 AM
  cron.schedule('0 1 * * *', () => {
    runCycleAutomation();
  });

  console.log('[CycleAutomation] Programador de automatización de ciclos iniciado (diario a las 01:00).');
};
