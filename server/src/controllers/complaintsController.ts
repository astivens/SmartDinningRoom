import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Complaint, Student, User } from '../models';

export const createComplaint = async (req: AuthRequest, res: Response) => {
  try {
    const { type, content, isAnonymous } = req.body;
    const studentId = req.user?.id;

    let student = null;
    if (studentId && !isAnonymous) {
      student = await Student.findOne({ where: { userId: studentId } });
    }

    const complaint = await Complaint.create({
      studentId: student?.id,
      type,
      content,
      isAnonymous: isAnonymous || !student,
      isResolved: false
    });

    res.status(201).json({ message: 'Queja/Sugerencia registrada', complaint });
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const getComplaints = async (req: AuthRequest, res: Response) => {
  try {
    const { type, isResolved, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (type) where.type = type;
    if (isResolved !== undefined) where.isResolved = isResolved === 'true';

    const { count, rows } = await Complaint.findAndCountAll({
      where,
      include: [
        { model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: ['name', 'lastName', 'email'] }] }
      ],
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      complaints: rows,
      total: count,
      page: Number(page),
      totalPages: Math.ceil(count / Number(limit))
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const respondComplaint = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    const adminId = req.user?.id;

    const complaint = await Complaint.findByPk(id);
    if (!complaint) {
      return res.status(404).json({ message: 'Queja no encontrada' });
    }

    await complaint.update({
      response,
      respondedBy: adminId,
      isResolved: true
    });

    res.json({ message: 'Respuesta registrada', complaint });
  } catch (error) {
    console.error('Respond complaint error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};
