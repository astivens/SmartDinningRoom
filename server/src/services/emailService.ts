import nodemailer from 'nodemailer';
import { User, Student } from '../models';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'SmartComedor <noreply@smartcomedor.com>',
      to,
      subject,
      html
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

export const sendMealConfirmation = async (user: User, student: Student, date: Date) => {
  const subject = 'Confirmación de uso del Comedor Universitario';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2;">Confirmación de Almuerzo</h2>
      <p>Hola <strong>${user.name} ${user.lastName}</strong>,</p>
      <p>Te confirmamos que has hecho uso del servicio de comedor universitario.</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Fecha:</strong> ${date.toLocaleDateString('es-CO')}</p>
        <p><strong>Hora:</strong> ${new Date().toLocaleTimeString('es-CO')}</p>
      </div>
      <p style="color: #666; font-size: 14px;">
        Gracias por utilizar nuestro servicio del comedor universitario. 
        Si no fuiste tú, comunícate con la persona encargada.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #999; font-size: 12px;">
        SmartComedor - Comedor Universitario
      </p>
    </div>
  `;

  await sendEmail(user.email, subject, html);
};

export const sendPasswordResetEmail = async (user: User, resetToken: string) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
  
  const subject = 'Recuperación de Contraseña - SmartComedor';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2;">Recuperación de Contraseña</h2>
      <p>Hola <strong>${user.name}</strong>,</p>
      <p>Has solicitado recuperar tu contraseña. Haz clic en el siguiente enlace:</p>
      <a href="${resetUrl}" style="display: inline-block; background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
        Restablecer Contraseña
      </a>
      <p style="color: #666; font-size: 14px;">
        Este enlace expirará en 1 hora.
      </p>
      <p style="color: #999; font-size: 12px;">
        Si no solicitaste este cambio, ignora este correo.
      </p>
    </div>
  `;

  await sendEmail(user.email, subject, html);
};

import nodemailer from 'nodemailer';
import { User, Student } from '../models';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'SmartComedor <noreply@smartcomedor.com>',
      to,
      subject,
      html
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

export const sendMealConfirmation = async (user: User, student: Student, date: Date) => {
  const subject = 'Confirmación de uso del Comedor Universitario';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2;">Confirmación de Almuerzo</h2>
      <p>Hola <strong>${user.name} ${user.lastName}</strong>,</p>
      <p>Te confirmamos que has hecho uso del servicio de comedor universitario.</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Fecha:</strong> ${date.toLocaleDateString('es-CO')}</p>
        <p><strong>Hora:</strong> ${new Date().toLocaleTimeString('es-CO')}</p>
      </div>
      <p style="color: #666; font-size: 14px;">
        Gracias por utilizar nuestro servicio del comedor universitario. 
        Si no fuiste tú, comunícate con la persona encargada.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #999; font-size: 12px;">
        SmartComedor - Comedor Universitario
      </p>
    </div>
  `;

  await sendEmail(user.email, subject, html);
};

export const sendPasswordResetEmail = async (user: User, resetToken: string) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
  
  const subject = 'Recuperación de Contraseña - SmartComedor';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2;">Recuperación de Contraseña</h2>
      <p>Hola <strong>${user.name}</strong>,</p>
      <p>Has solicitado recuperar tu contraseña. Haz clic en el siguiente enlace:</p>
      <a href="${resetUrl}" style="display: inline-block; background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
        Restablecer Contraseña
      </a>
      <p style="color: #666; font-size: 14px;">
        Este enlace expirará en 1 hora.
      </p>
      <p style="color: #999; font-size: 12px;">
        Si no solicitaste este cambio, ignora este correo.
      </p>
    </div>
  `;

  await sendEmail(user.email, subject, html);
};

export const sendWelcomeEmail = async (user: User, tempPassword?: string) => {
  const subject = 'Bienvenido a SmartComedor';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2;">Bienvenido a SmartComedor</h2>
      <p>Hola <strong>${user.name} ${user.lastName}</strong>,</p>
      <p>Tu cuenta ha sido creada exitosamente.</p>
      ${tempPassword ? `<p><strong>Contraseña temporal:</strong> ${tempPassword}</p>` : ''}
      <p>Por favor, inicia sesión y cambia tu contraseña.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #999; font-size: 12px;">
        SmartComedor - Comedor Universitario
      </p>
    </div>
  `;

  await sendEmail(user.email, subject, html);
};

export const sendRevalidationEmail = async (user: User, cycleName: string) => {
  const subject = 'Revalidación de Documentos Requerida - SmartComedor';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2;">Revalidación de Documentos</h2>
      <p>Hola <strong>${user.name} ${user.lastName}</strong>,</p>
      <p>El ciclo <strong>${cycleName}</strong> ha finalizado.</p>
      <p>Para continuar utilizando los servicios del comedor en el siguiente periodo, es necesario que realices la revalidación de tus documentos en la plataforma.</p>
      <p>Por favor, inicia sesión para completar este proceso.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #999; font-size: 12px;">
        SmartComedor - Comedor Universitario
      </p>
    </div>
  `;

  await sendEmail(user.email, subject, html);
};
