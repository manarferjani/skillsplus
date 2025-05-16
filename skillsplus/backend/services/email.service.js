import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Charger les variables d'environnement depuis le fichier .env
dotenv.config();

console.log(process.env.GMAIL_PASSWORD_APP);  // Vérifie que la variable est bien définie


// Configure le transporteur pour Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
   
    user: process.env.GMAIL_USER, // Fallback explicite
    pass: process.env.GMAIL_PASSWORD_APP // Fallback pour les tests
  },
  debug: true // Active les logs SMTP détaillés
});

// Fonction pour envoyer un email de bienvenue
export async function sendWelcomeEmail(to, name, password) {
    const mailOptions = {
      from: '"SkillBloom" <manarferjanii@gmail.com>',
      to,
      subject: 'Bienvenue sur SkillBloom , la plateforme créée par la plus belle des plus belles Mannoura! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px;">
          <h2>Bienvenue, ${name} 👋</h2>
          <p>Votre compte sur <strong>SkillsPlus</strong> a été créé avec succès.</p>
          <p><strong>Adresse Email :</strong> ${to}</p>
          <p><strong>Mot de passe temporaire :</strong> ${password}</p>
          <p style="color: red;">⚠️ Veuillez changer votre mot de passe lors de votre première connexion pour plus de sécurité.</p>
          <br/>
          <p>À très bientôt !</p>
        </div>
      `
    };
  
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email envoyé ! Message ID:', info.messageId);
      return true;
    } catch (error) {
      console.error('Échec d\'envoi :', {
        error: error.message,
        stack: error.stack,
        smtp: error.response // Détails SMTP
      });
      throw error; // ← Propage l'erreur
    }
}
  
  