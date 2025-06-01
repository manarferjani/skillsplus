import { sendEmail } from './mail.service.js'; // Use named import

export const sendCourseAssignmentEmail = async (email, name, courseName, courseDescription, courseId) => {
  try {
    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const courseUrl = `${frontendUrl}/courses/${courseId}`;
    const result = await sendEmail({
      to: email,
      subject: `Vous avez été assigné au cours : ${courseName}`,
      html: `
        <h2>Bonjour ${name},</h2>
        <p>Vous avez été assigné au cours <strong>${courseName}</strong>.</p>
        <p><strong>Description :</strong> ${courseDescription}</p>
        <p><a href="${frontendUrl}" style="color: #007bff; text-decoration: none;">Accéder au cours</a></p>
        <p>Ou copiez ce lien dans votre navigateur : ${courseUrl}</p>
      `
    });
    return { success: true, messageId: result.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};