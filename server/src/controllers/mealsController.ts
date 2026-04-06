import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Student, User, Payment, MealAttendance, SupervisorLog } from '../models';
import { Op } from 'sequelize';
import { sendMealConfirmation } from '../services/emailService';

export const registerMeal = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId } = req.body;
    const supervisorId = req.user?.id;

    if (!supervisorId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }

    const user = await User.findByPk(student.userId);
    if (!user || !user.isActive) {
      return res.status(400).json({ message: 'Estudiante inactivo' });
    }

    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
    const spanishDays: Record<string, string> = {
      Monday: 'Lunes',
      Tuesday: 'Martes',
      Wednesday: 'Miércoles',
      Thursday: 'Jueves',
      Friday: 'Viernes'
    };
    const spanishDay = spanishDays[dayOfWeek] || dayOfWeek;

    if (!student.diasComedor.includes(spanishDay)) {
      return res.status(400).json({ message: 'El estudiante no tiene autorización para este día' });
    }

    const existingAttendance = await MealAttendance.findOne({
      where: {
        studentId,
        date: today.toISOString().split('T')[0]
      }
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'El estudiante ya usó el comedor hoy' });
    }

    const payments = await Payment.findAll({
      where: { studentId, isVerified: true }
    });

    const totalMeals = payments.reduce((sum, p) => sum + p.mealsIncluded, 0);
    const usedMeals = payments.reduce((sum, p) => sum + p.mealsUsed, 0);
    const availableMeals = totalMeals - usedMeals;

    if (availableMeals <= 0) {
      return res.status(400).json({ message: 'El estudiante no tiene almuerzos disponibles' });
    }

    const hora = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

    const attendance = await MealAttendance.create({
      studentId,
      supervisorId,
      date: today,
      hora
    });

    const latestPayment = payments[payments.length - 1];
    if (latestPayment) {
      await latestPayment.update({
        mealsUsed: latestPayment.mealsUsed + 1
      });
    }

    await SupervisorLog.create({
      supervisorId,
      studentId,
      action: 'Registro de almuerzo',
      hora
    });

    try {
      await sendMealConfirmation(user, student, today);
    } catch (emailError) {
      console.error('Error sending email:', emailError);
    }

    res.json({
      message: 'Almuerzo registrado exitosamente',
      attendance,
      mealsRemaining: availableMeals - 1
    });
  } catch (error) {
    console.error('Register meal error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const getMealHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, startDate, endDate } = req.query;

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (startDate && endDate) {
      where.date = {
        [Op.between]: [startDate, endDate]
      };
    }

    const attendances = await MealAttendance.findAll({
      where,
      include: [
        { model: Student, as: 'student', include: [{ model: User, as: 'user' }] },
        { model: User, as: 'supervisor', attributes: ['name', 'lastName'] }
      ],
      order: [['date', 'DESC'], ['hora', 'DESC']]
    });

    res.json(attendances);
  } catch (error) {
    console.error('Get meal history error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const getTodayAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const attendances = await MealAttendance.findAll({
      where: { date: today },
      include: [
        { model: Student, as: 'student', include: [{ model: User, as: 'user' }] },
        { model: User, as: 'supervisor', attributes: ['name', 'lastName'] }
      ]
    });

    res.json(attendances);
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};
