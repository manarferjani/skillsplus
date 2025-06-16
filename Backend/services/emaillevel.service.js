// emaillevel.service.js
import { sendEmail } from './mail.service.js';

export const sendLevelAssignmentEmail = async (email, name, levelTitle, levelDescription, courseId, levelId, levelLink) => {
  try {
    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const result = await sendEmail({
      to: email,
      subject: `Vous avez été assigné au niveau : ${levelTitle}`,
      html: `
        <h2>Bonjour ${name},</h2>
        <p>Vous avez été assigné au niveau <strong>${levelTitle}</strong>.</p>
        <p><strong>Description :</strong> ${levelDescription}</p>
        <p><a href="${levelLink}" style="color: #007bff; text-decoration: none;">Accéder au niveau</a></p>
        <p>Ou copiez ce lien dans votre navigateur : ${levelLink}</p>
      `
    });
    return { success: true, messageId: result.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};