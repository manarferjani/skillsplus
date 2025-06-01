// mail.service.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD_APP,
  },
  debug: true,
});

export async function sendEmail({ to, subject, html }) {
  const mailOptions = {
    from: `"SkillBloom" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email envoyé ! Message ID:', info.messageId);
    return { id: info.messageId }; // Pour garder la compatibilité avec ton code actuel
  } catch (error) {
    console.error('Erreur envoi mail:', error);
    throw error;
  }

}
