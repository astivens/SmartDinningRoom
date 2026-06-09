import { Response } from 'express';
import fs from 'fs/promises';
import { AuthRequest } from '../middleware/auth';
import { Payment, Student, User, UserRole } from '../models';
import { logAction } from '../services/auditService';

const MEAL_PRICE = 2000;

export const createPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, amount, comprobantePath, universityReceiptPath, bankReceiptPath } = req.body;

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
      universityReceiptPath: universityReceiptPath || '',
      bankReceiptPath: bankReceiptPath || '',
      isVerified: false
    });

    res.status(201).json({
      message: 'Pago registrado',
      payment,
      mealsIncluded
    });
    if (req.user) {
      logAction(req.user.id, req.user.email, 'CREATE_PAYMENT', `StudentId: ${studentId}, amount: ${amount}`, req).catch(() => {});
    }
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
      verifiedBy: adminId,
      verifiedAt: new Date()
    });

    const deletionCandidates = [
      payment.comprobantePath,
      payment.universityReceiptPath,
      payment.bankReceiptPath
    ].filter((pathCandidate): pathCandidate is string => typeof pathCandidate === 'string' && pathCandidate.trim().length > 0);

    for (const filePath of deletionCandidates) {
      try {
        await fs.unlink(filePath);
      } catch (deleteError: any) {
        if (deleteError?.code !== 'ENOENT') {
          console.error(`Error eliminando adjunto ${filePath}:`, deleteError);
        }
      }
    }

    await payment.update({
      comprobantePath: '',
      universityReceiptPath: '',
      bankReceiptPath: ''
    });

    res.json({ message: 'Pago verificado', payment });
    if (req.user) {
      logAction(req.user.id, req.user.email, 'VERIFY_PAYMENT', `PaymentId: ${id}`, req).catch(() => {});
    }
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
    const files = (req as AuthRequest & {
      files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[];
      file?: Express.Multer.File;
    }).files;
    const fieldFiles = files && !Array.isArray(files) ? files : {};
    const comprobanteFile = fieldFiles?.comprobante?.[0] ?? (req as any).file;
    const universityReceiptFile = fieldFiles?.universityReceipt?.[0];
    const bankReceiptFile = fieldFiles?.bankReceipt?.[0];

    if (!comprobanteFile && !universityReceiptFile && !bankReceiptFile) {
      return res.status(400).json({ message: 'Archivo requerido' });
    }

    const { studentId, amount } = req.body;
    const requesterId = req.user?.id;

    if (!requesterId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const requester = await User.findByPk(requesterId);
    if (!requester) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    let targetStudent: Student | null = null;
    if (requester.role === UserRole.STUDENT) {
      targetStudent = await Student.findOne({ where: { userId: requesterId } });
    } else if (studentId) {
      targetStudent = await Student.findByPk(studentId);
    }

    if (!targetStudent) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }

    const mealsIncluded = Math.floor(amount / MEAL_PRICE);

    const payment = await Payment.create({
      studentId: targetStudent.id,
      amount: parseInt(amount),
      mealsIncluded,
      mealsUsed: 0,
      comprobantePath: comprobanteFile?.path ?? bankReceiptFile?.path ?? universityReceiptFile?.path ?? '',
      universityReceiptPath: universityReceiptFile?.path ?? '',
      bankReceiptPath: bankReceiptFile?.path ?? '',
      isVerified: false
    });

    res.status(201).json({
      message: 'Comprobante subido exitosamente',
      payment
    });
    logAction(requester.id, requester.email, 'UPLOAD_PAYMENT_RECEIPT', `StudentId: ${targetStudent.id}`, req).catch(() => {});
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
