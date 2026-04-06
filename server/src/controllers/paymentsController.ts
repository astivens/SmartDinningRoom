import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Payment, Student, User } from '../models';

const MEAL_PRICE = 2000;

export const createPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, amount, comprobantePath } = req.body;

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }

    const mealsIncluded = Math.floor(amount / MEAL_PRICE);

    const payment = await Payment.create({
      studentId,
      amount,
      mealsIncluded,
      mealsUsed: 0,
      comprobantePath: comprobantePath || '',
      isVerified: false
    });

    res.status(201).json({
      message: 'Pago registrado',
      payment,
      mealsIncluded
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;

    const payment = await Payment.findByPk(id);
    if (!payment) {
      return res.status(404).json({ message: 'Pago no encontrado' });
    }

    await payment.update({
      isVerified: true,
      verifiedBy: adminId
    });

    res.json({ message: 'Pago verificado', payment });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const getPayments = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, isVerified, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (isVerified !== undefined) where.isVerified = isVerified === 'true';

    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: [
        { model: Student, as: 'student', include: [{ model: User, as: 'user' }] }
      ],
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      payments: rows,
      total: count,
      page: Number(page),
      totalPages: Math.ceil(count / Number(limit))
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const uploadPaymentComprobante = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Archivo requerido' });
    }

    const { studentId, amount } = req.body;

    const mealsIncluded = Math.floor(amount / MEAL_PRICE);

    const payment = await Payment.create({
      studentId,
      amount: parseInt(amount),
      mealsIncluded,
      mealsUsed: 0,
      comprobantePath: req.file.path,
      isVerified: false
    });

    res.status(201).json({
      message: 'Comprobante subido exitosamente',
      payment
    });
  } catch (error) {
    console.error('Upload comprobante error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const calculateMeals = async (req: AuthRequest, res: Response) => {
  try {
    const { amount } = req.body;

    if (!amount || amount < MEAL_PRICE) {
      return res.status(400).json({ message: `Monto mínimo: $${MEAL_PRICE}` });
    }

    const meals = Math.floor(amount / MEAL_PRICE);
    const remaining = amount % MEAL_PRICE;

    res.json({
      amount,
      mealsIncluded: meals,
      remaining
    });
  } catch (error) {
    console.error('Calculate meals error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};
