import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth';
import { User, Student, SupervisorLog, UserRole, SupervisorAssignment } from '../models';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { logAction } from '../services/auditService';

export const getSupervisors = async (req: AuthRequest, res: Response) => {
  try {
    const supervisors = await User.findAll({
      where: { role: UserRole.SUPERVISOR },
      attributes: ['id', 'email', 'name', 'lastName', 'telefono', 'isActive', 'isAuthorized']
    });

    res.json(supervisors);
  } catch (error) {
    console.error('Get supervisors error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const createSupervisor = async (req: AuthRequest, res: Response) => {
  try {
    const { email, name, lastName, telefono } = req.body;

    const tempPassword = uuidv4().slice(0, 8);

    const supervisor = await User.create({
      email,
      password: tempPassword,
      name,
      lastName,
      telefono,
      role: UserRole.SUPERVISOR,
      isActive: true,
      isAuthorized: false
    });

    logAction(req.user!.id, req.user!.email, 'CREATE_SUPERVISOR', `Email: ${email}`, req).catch(() => {});
    res.status(201).json({
      message: 'Supervisor creado',
      supervisor: {
        id: supervisor.id,
        email: supervisor.email,
        name: supervisor.name,
        lastName: supervisor.lastName,
        telefono: supervisor.telefono
      },
      temporaryPassword: tempPassword
    });
  } catch (error: any) {
    console.error('Create supervisor error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const updateSupervisor = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, lastName, email, telefono, isActive, isAuthorized } = req.body;

    const supervisor = await User.findByPk(id);
    if (!supervisor || supervisor.role !== 'supervisor') {
      return res.status(404).json({ message: 'Supervisor no encontrado' });
    }

    await supervisor.update({ name, lastName, email, telefono, isActive, isAuthorized });

    res.json({ message: 'Supervisor actualizado' });
  } catch (error) {
    console.error('Update supervisor error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const deleteSupervisor = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const supervisor = await User.findByPk(id);

    if (!supervisor || supervisor.role !== 'supervisor') {
      return res.status(404).json({ message: 'Supervisor no encontrado' });
    }

    await supervisor.update({ isActive: false });
    res.json({ message: 'Supervisor deshabilitado' });
  } catch (error) {
    console.error('Delete supervisor error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const toggleSupervisorStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive, isAuthorized } = req.body;

    const supervisor = await User.findByPk(id);
    if (!supervisor || supervisor.role !== 'supervisor') {
      return res.status(404).json({ message: 'Supervisor no encontrado' });
    }

    await supervisor.update({ isActive, isAuthorized });
    logAction(req.user!.id, req.user!.email, 'TOGGLE_SUPERVISOR', `SupervisorId: ${id}, isActive: ${isActive}, isAuthorized: ${isAuthorized}`, req).catch(() => {});

    res.json({ message: 'Estado actualizado' });
  } catch (error) {
    console.error('Toggle supervisor error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const generateInviteLink = async (req: AuthRequest, res: Response) => {
  try {
    const inviteToken = jwt.sign(
      { role: UserRole.SUPERVISOR, type: 'invite' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '48h' }
    );

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const inviteUrl = `${clientUrl}/supervisor/join?token=${inviteToken}`;

    res.json({ inviteUrl, expiresIn: '48 horas' });
  } catch (error) {
    console.error('Generate invite error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const joinWithInvite = async (req: Request, res: Response) => {
  try {
    const { token, email, name, lastName, telefono, password } = req.body;

    if (!token || !email || !name || !lastName || !password) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    } catch {
      return res.status(400).json({ message: 'Enlace de invitación inválido o expirado' });
    }

    if (decoded.role !== UserRole.SUPERVISOR || decoded.type !== 'invite') {
      return res.status(400).json({ message: 'Enlace de invitación inválido' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    const supervisor = await User.create({
      email,
      password,
      name,
      lastName,
      telefono,
      role: UserRole.SUPERVISOR,
      isActive: true,
      isAuthorized: false
    });

    res.status(201).json({
      message: 'Cuenta de supervisor creada. Espera la autorización del administrador.',
      supervisor: { id: supervisor.id, email: supervisor.email, name: supervisor.name, lastName: supervisor.lastName, telefono: supervisor.telefono }
    });
  } catch (error: any) {
    console.error('Join with invite error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const assignStudentToSupervisor = async (req: AuthRequest, res: Response) => {
  try {
    const { supervisorId, studentId } = req.body;

    const supervisor = await User.findByPk(supervisorId);
    if (!supervisor || supervisor.role !== UserRole.SUPERVISOR) {
      return res.status(404).json({ message: 'Supervisor no encontrado' });
    }

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }

    const [assignment, created] = await SupervisorAssignment.findOrCreate({
      where: { supervisorId, studentId }
    });

    if (!created) {
      return res.status(400).json({ message: 'El estudiante ya está asignado a este supervisor' });
    }

    logAction(req.user!.id, req.user!.email, 'ASSIGN_STUDENT_TO_SUPERVISOR', `SupervisorId: ${supervisorId}, StudentId: ${studentId}`, req).catch(() => {});
    res.status(201).json({ message: 'Estudiante asignado al supervisor', assignment });
  } catch (error) {
    console.error('Assign student error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const removeStudentFromSupervisor = async (req: AuthRequest, res: Response) => {
  try {
    const { supervisorId, studentId } = req.params;

    const deleted = await SupervisorAssignment.destroy({
      where: { supervisorId, studentId }
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Asignación no encontrada' });
    }

    res.json({ message: 'Asignación eliminada' });
  } catch (error) {
    console.error('Remove assignment error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const getSupervisorStudents = async (req: AuthRequest, res: Response) => {
  try {
    const { supervisorId } = req.params;

    const assignments = await SupervisorAssignment.findAll({
      where: { supervisorId },
      include: [
        {
          model: Student,
          as: 'student',
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'lastName', 'email', 'isActive'] }]
        }
      ]
    });

    res.json(assignments);
  } catch (error) {
    console.error('Get supervisor students error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const getSupervisorLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await SupervisorLog.findAndCountAll({
      include: [
        { model: User, as: 'supervisor', attributes: ['id', 'name', 'lastName', 'email'] },
        { model: Student, as: 'student', attributes: ['id', 'cedula'], include: [{ model: User, as: 'user', attributes: ['id', 'name', 'lastName'] }] }
      ],
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      logs: rows,
      total: count,
      page: Number(page),
      totalPages: Math.ceil(count / Number(limit))
    });
  } catch (error) {
    console.error('Get supervisor logs error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};
