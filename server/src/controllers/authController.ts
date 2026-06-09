import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { Op } from 'sequelize';
import { Student, User, UserRole } from '../models';
import { AuthRequest } from '../middleware/auth';
import { sendPasswordResetEmail } from '../services/emailService';
import { logAction } from '../services/auditService';
import { extractSisbenText, validateSisbenAgainstCedula } from '../services/sisbenValidationService';
import { VALID_CARRERAS, VALID_SEMESTERS, VALID_SISBEN_CATEGORIES } from '../constants';

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

const generateTwoFactorToken = (user: User) => jwt.sign(
  { id: user.id, email: user.email, role: user.role, purpose: 'login-2fa' },
  process.env.JWT_SECRET || 'secret',
  { expiresIn: '10m' }
);

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, role, twoFactorCode, twoFactorToken } = req.body;

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

    if ((role === UserRole.ADMIN || role === UserRole.SUPERVISOR || role === UserRole.EXTERNAL_AUDITOR) && !user.isAuthorized) {
      return res.status(403).json({ message: 'Usted no está autorizado' });
    }

    if (role === UserRole.STUDENT) {
      const student = await Student.findOne({ where: { userId: user.id } });
      const twoFactorEnabled = student?.qrCode === 'enabled' && !!student?.qrCodeSecret;
      if (twoFactorEnabled) {
        if (!twoFactorToken) {
          return res.status(200).json({
            requiresTwoFactor: true,
            twoFactorToken: generateTwoFactorToken(user),
            message: 'Se requiere código de autenticación en dos factores'
          });
        }

        let decoded: { id: string; email: string; role: UserRole; purpose: string };
        try {
          decoded = jwt.verify(twoFactorToken, process.env.JWT_SECRET || 'secret') as { id: string; email: string; role: UserRole; purpose: string };
        } catch {
          return res.status(401).json({ message: 'Token 2FA inválido o expirado' });
        }

        if (decoded.purpose !== 'login-2fa' || decoded.id !== user.id || decoded.email !== user.email) {
          return res.status(401).json({ message: 'Token 2FA inválido o expirado' });
        }

        if (!twoFactorCode) {
          return res.status(400).json({ message: 'Código 2FA requerido' });
        }

        const isValid2FA = speakeasy.totp.verify({
          secret: student.qrCodeSecret!,
          encoding: 'base32',
          token: String(twoFactorCode),
          window: 1
        });
        if (!isValid2FA) {
          return res.status(400).json({ message: 'Código 2FA inválido o expirado' });
        }
      }
    }

    const tokens = generateTokens(user);

    logAction(user.id, user.email, 'LOGIN', `Rol: ${user.role}`, req).catch(() => {});

    res.json({
      message: 'Login exitoso',
      user: {
        id: user.id,
        uid: user.uid,
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
      trabajaEstudia,
      estudiaSolo,
      etnia,
      desplazado,
      trabajadorUniversitario,
      diasComedor
    } = req.body;

    const files = (req as Request & {
      files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[];
    }).files;
    const fieldFiles = files && !Array.isArray(files) ? files : {};
    const sisbenFile = fieldFiles?.archivoSisben?.[0];
    const cedulaFrontalFile = fieldFiles?.cedulaFrontal?.[0];
    const horarioPdfFile = fieldFiles?.horarioPdf?.[0];
    const reciboFile = fieldFiles?.reciboPago?.[0];
    const archivoSisbenPath = sisbenFile?.path ?? '';
    const cedulaFrontalPath = cedulaFrontalFile?.path ?? '';
    const horarioPdfPath = horarioPdfFile?.path ?? '';
    const reciboPagoPath = reciboFile?.path ?? '';

    if (!archivoSisbenPath || !cedulaFrontalPath || !horarioPdfPath) {
      return res.status(400).json({ message: 'SISBEN, cédula frontal y horario PDF son obligatorios' });
    }

    if (typeof email !== 'string' || email.trim().length === 0 || email.length > 30) {
      return res.status(400).json({ message: 'Correo inválido (máximo 30 caracteres)' });
    }
    if (typeof name !== 'string' || name.trim().length === 0 || name.length > 20) {
      return res.status(400).json({ message: 'Nombre inválido (máximo 20 caracteres)' });
    }
    if (typeof lastName !== 'string' || lastName.trim().length === 0 || lastName.length > 20) {
      return res.status(400).json({ message: 'Apellido inválido (máximo 20 caracteres)' });
    }
    const cedulaString = String(cedula ?? '').trim();
    if (!/^\d{6,12}$/.test(cedulaString)) {
      return res.status(400).json({ message: 'Cédula inválida (entre 6 y 12 dígitos)' });
    }
    if (typeof password !== 'string' || password.length !== 8) {
      return res.status(400).json({ message: 'La contraseña debe tener exactamente 8 caracteres' });
    }
    if (typeof carrera !== 'string' || !VALID_CARRERAS.has(carrera)) {
      return res.status(400).json({ message: 'Carrera inválida, debe pertenecer al catálogo permitido' });
    }
    const semestreNumber = Number(semestre);
    if (!VALID_SEMESTERS.has(semestreNumber)) {
      return res.status(400).json({ message: 'Semestre inválido, debe estar entre 1 y 12' });
    }
    if (typeof categoriaSisben !== 'string' || !VALID_SISBEN_CATEGORIES.has(categoriaSisben)) {
      return res.status(400).json({ message: 'Categoría SISBEN inválida' });
    }
    if (typeof barrio !== 'string' || barrio.trim().length === 0) {
      return res.status(400).json({ message: 'Barrio es obligatorio' });
    }
    if (typeof telefono !== 'string' || telefono.trim().length === 0) {
      return res.status(400).json({ message: 'Número de contacto es obligatorio' });
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

    let sisbenValidation = {
      validated: false,
      mismatches: { cedula: true, name: true, lastName: true, cedulaDocument: true }
    };
    try {
      sisbenValidation = await validateSisbenAgainstCedula(archivoSisbenPath, cedulaFrontalPath, {
        cedula: cedulaString,
        name,
        lastName
      });
    } catch (sisbenError) {
      console.error('SISBEN validation error:', sisbenError);
    }

    let horarioExtract = '';
    try {
      const horarioText = await extractSisbenText(horarioPdfPath);
      horarioExtract = horarioText.trim().slice(0, 5000);
    } catch (horarioError) {
      console.error('Horario extraction error:', horarioError);
    }

    await Student.create({
      userId: user.id,
      cedula: cedulaString,
      carrera,
      semestre: semestreNumber,
      categoriaSisben,
      archivoSisben: archivoSisbenPath,
      cedulaFrontalPath,
      horarioPdfPath,
      reciboPagoPath,
      direccion,
      barrio,
      telefono,
      trabaja: trabaja === 'true' || trabaja === true,
      trabajaEstudia: trabajaEstudia === 'true' || trabajaEstudia === true,
      estudiaSolo: estudiaSolo === 'true' || estudiaSolo === true,
      etnia,
      desplazado: desplazado === 'true' || desplazado === true,
      trabajadorUniversitario: trabajadorUniversitario === 'true' || trabajadorUniversitario === true,
      diasComedor: parsedDias,
      isValidatedSisben: false,
      sisbenAutoValidated: sisbenValidation.validated,
      sisbenValidationDetails: {
        ...sisbenValidation,
        horarioExtract
      }
    });

    const tokens = generateTokens(user);

    res.status(201).json({
      message: 'Registro exitoso',
      user: {
        id: user.id,
        uid: user.uid,
        email: user.email,
        name: user.name,
        lastName: user.lastName,
        role: user.role
      },
      sisbenValidation,
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
