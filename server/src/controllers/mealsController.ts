import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Student, User, UserRole, Payment, MealAttendance, SupervisorLog, Rating } from '../models';
import { Op, fn, col, literal } from 'sequelize';
import { sendMealConfirmation } from '../services/emailService';
import { logAction } from '../services/auditService';

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
    if (req.user) {
      logAction(req.user.id, req.user.email, 'REGISTER_MEAL', `StudentId: ${studentId}`, req).catch(() => {});
    }
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

export const getDashboardAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const daysParam = Number(req.query.days);
    const days = Number.isFinite(daysParam) && daysParam > 0 ? Math.min(daysParam, 180) : 30;
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (days - 1));

    const [attendanceTrendRows, attendanceByCareerRows, sisbenRows, semesterRows, paymentRows, remainingMealsRows, ratingRows] = await Promise.all([
      MealAttendance.findAll({
        attributes: [
          [fn('DATE', col('date')), 'date'],
          [fn('COUNT', col('MealAttendance.id')), 'count'],
        ],
        where: {
          date: { [Op.gte]: startDate },
        },
        group: [fn('DATE', col('date'))],
        order: [[literal('date'), 'ASC']],
        raw: true,
      }),
      MealAttendance.findAll({
        attributes: [
          [col('student.carrera'), 'career'],
          [fn('COUNT', col('MealAttendance.id')), 'count'],
        ],
        include: [{ model: Student, as: 'student', attributes: [] }],
        where: {
          date: { [Op.gte]: startDate },
        },
        group: [col('student.carrera')],
        order: [[literal('count'), 'DESC']],
        raw: true,
      }),
      Student.findAll({
        attributes: [
          [col('is_validated_sisben'), 'validated'],
          [fn('COUNT', col('id')), 'count'],
        ],
        group: ['is_validated_sisben'],
        raw: true,
      }),
      Student.findAll({
        attributes: [
          ['semestre', 'semester'],
          [fn('COUNT', col('id')), 'count'],
        ],
        group: ['semestre'],
        order: [['semestre', 'ASC']],
        raw: true,
      }),
      Payment.findAll({
        attributes: [[fn('SUM', col('amount')), 'totalAmount']],
        where: {
          isVerified: true,
          createdAt: { [Op.gte]: startDate },
        },
        raw: true,
      }),
      Payment.findAll({
        attributes: [[fn('SUM', literal('"meals_included" - "meals_used"')), 'remainingMeals']],
        where: { isVerified: true },
        raw: true,
      }),
      Rating.findAll({
        attributes: [
          ['stars', 'stars'],
          [fn('COUNT', col('id')), 'count'],
        ],
        where: {
          createdAt: { [Op.gte]: startDate },
        },
        group: ['stars'],
        order: [['stars', 'ASC']],
        raw: true,
      }),
    ]);

    const attendanceTrend = attendanceTrendRows.map((row: any) => ({
      date: row.date,
      count: Number(row.count ?? 0),
    }));

    const attendanceByCareer = attendanceByCareerRows.map((row: any) => ({
      career: String(row.career ?? 'Sin carrera'),
      count: Number(row.count ?? 0),
    }));

    const sisbenDistribution = sisbenRows.map((row: any) => ({
      label: row.validated ? 'Validado' : 'Sin validar',
      count: Number(row.count ?? 0),
    }));

    const studentsBySemester = semesterRows.map((row: any) => ({
      semester: Number(row.semester ?? 0),
      count: Number(row.count ?? 0),
    }));

    const ratingsDistribution = ratingRows.map((row: any) => ({
      stars: Number(row.stars ?? 0),
      count: Number(row.count ?? 0),
    }));

    const totalRatings = ratingsDistribution.reduce((sum, row) => sum + row.count, 0);
    const weightedStars = ratingsDistribution.reduce((sum, row) => sum + (row.stars * row.count), 0);
    const totalRevenueRow = paymentRows[0] as unknown as { totalAmount?: string | number } | undefined;
    const remainingMealsRow = remainingMealsRows[0] as unknown as { remainingMeals?: string | number } | undefined;

    const totals = {
      totalStudents: await Student.count(),
      totalAttendancesInRange: attendanceTrend.reduce((sum, item) => sum + item.count, 0),
      totalRevenueInRange: Number(totalRevenueRow?.totalAmount ?? 0),
      remainingMeals: Number(remainingMealsRow?.remainingMeals ?? 0),
      activeStudents: await User.count({ where: { role: UserRole.STUDENT, isActive: true } }),
      averageDailyAttendances: Number((attendanceTrend.reduce((sum, item) => sum + item.count, 0) / days).toFixed(2)),
      averageRatingInRange: totalRatings > 0 ? Number((weightedStars / totalRatings).toFixed(2)) : 0,
      totalRatingsInRange: totalRatings,
    };

    res.json({
      rangeDays: days,
      totals,
      charts: {
        attendanceTrend,
        attendanceByCareer: attendanceByCareer.slice(0, 8),
        sisbenDistribution,
        studentsBySemester,
        ratingsDistribution,
      },
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({ message: 'Error del servidor al generar analítica' });
  }
};
