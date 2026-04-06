import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { Op } from 'sequelize';
import { User, UserRole } from '../models';
import { AuthRequest } from '../middleware/auth';
import { sendPasswordResetEmail } from '../services/emailService';
import { logAction } from '../services/auditService';

const generateTokens = (user: User) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET || 'refresh_secret',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, contraseña y rol son requeridos' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Usuario inactivo' });
    }

    if (user.role !== role) {
      return res.status(403).json({ message: 'Usted no está autorizado' });
    }

    if ((role === UserRole.ADMIN || role === UserRole.SUPERVISOR) && !user.isAuthorized) {
      return res.status(403).json({ message: 'Usted no está autorizado' });
    }

    const tokens = generateTokens(user);

    logAction(user.id, user.email, 'LOGIN', `Rol: ${user.role}`, req).catch(() => {});

    res.json({
      message: 'Login exitoso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        lastName: user.lastName,
        role: user.role
      },
      ...tokens
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error del servidor', error: (error as Error).message });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      name,
      lastName,
      cedula,
      carrera,
      semestre,
      categoriaSisben,
      direccion,
      barrio,
      telefono,
      trabaja,
      etnia,
      desplazado,
      trabajadorUniversitario,
      diasComedor
    } = req.body;

    const archivoSisbenPath = (req as any).file?.path ?? '';

    if (!archivoSisbenPath) {
      return res.status(400).json({ message: 'El archivo SISBEN es obligatorio (PDF o JPG)' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    const user = await User.create({
      email,
      password,
      name,
      lastName,
      role: UserRole.STUDENT,
      isActive: true,
      isAuthorized: true
    });

    const parsedDias = typeof diasComedor === 'string' ? JSON.parse(diasComedor) : (diasComedor ?? []);

    const { Student } = await import('../models');
    await Student.create({
      userId: user.id,
      cedula,
      carrera,
      semestre: parseInt(semestre),
      categoriaSisben,
      archivoSisben: archivoSisbenPath,
      direccion,
      barrio,
      telefono,
      trabaja: trabaja === 'true' || trabaja === true,
      etnia,
      desplazado: desplazado === 'true' || desplazado === true,
      trabajadorUniversitario: trabajadorUniversitario === 'true' || trabajadorUniversitario === true,
      diasComedor: parsedDias
    });

    const tokens = generateTokens(user);

    res.status(201).json({
      message: 'Registro exitoso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        lastName: user.lastName,
        role: user.role
      },
      ...tokens
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Refresh token requerido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh_secret') as { id: string };
    const user = await User.findByPk(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const tokens = generateTokens(user);

    res.json(tokens);
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByPk(req.user?.id, {
      include: ['student']
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByPk(req.user?.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const { name, lastName, email } = req.body;
    await user.update({ name, lastName, email });

    res.json({ message: 'Perfil actualizado', user });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email requerido' });
    }

    const user = await User.findOne({ where: { email } });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000);
      await user.update({ resetPasswordToken: resetToken, resetPasswordExpires: resetExpires });
      try {
        await sendPasswordResetEmail(user, resetToken);
      } catch (emailError) {
        console.error('Error sending reset email:', emailError);
      }
    }

    res.json({ message: 'Si el correo está registrado, recibirás un enlace de recuperación' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token y nueva contraseña son requeridos' });
    }

    if (newPassword.length !== 8) {
      return res.status(400).json({ message: 'La contraseña debe tener exactamente 8 caracteres' });
    }

    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    await user.update({ password: newPassword, resetPasswordToken: null, resetPasswordExpires: null });

    res.json({ message: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user?.id);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const isValid = await user.validatePassword(currentPassword);
    if (!isValid) {
      return res.status(400).json({ message: 'Contraseña actual incorrecta' });
    }

    await user.update({ password: newPassword });

    res.json({ message: 'Contraseña actualizada' });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const setupTwoFactor = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByPk(req.user?.id, {
      include: ['student']
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const student = (user as any).student;
    if (!student) {
      return res.status(400).json({ message: 'Solo los estudiantes pueden configurar 2FA' });
    }

    const secret = speakeasy.generateSecret({
      name: `SmartComedor (${user.email})`,
      issuer: 'SmartComedor'
    });

    await student.update({ qrCodeSecret: secret.base32 });

    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url!);

    res.json({
      message: 'Secreto 2FA generado. Escanea el código QR con tu app autenticadora.',
      qrCode: qrCodeDataUrl,
      secret: secret.base32
    });
  } catch (error) {
    console.error('Setup 2FA error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const verifyTwoFactor = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token 2FA requerido' });
    }

    const user = await User.findByPk(req.user?.id, {
      include: ['student']
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const student = (user as any).student;
    if (!student?.qrCodeSecret) {
      return res.status(400).json({ message: '2FA no configurado. Usa /auth/setup-2fa primero.' });
    }

    const isValid = speakeasy.totp.verify({
      secret: student.qrCodeSecret,
      encoding: 'base32',
      token,
      window: 1
    });

    if (!isValid) {
      return res.status(400).json({ message: 'Código 2FA inválido o expirado' });
    }

    await student.update({ qrCode: 'enabled' });

    res.json({ message: '2FA verificado y habilitado exitosamente' });
  } catch (error) {
    console.error('Verify 2FA error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};
