import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'manarferjanii@gmail.com',
    pass: 'hndq uuwz pond cibz' // ← Utilisez le nouveau mot de passe
  }
});

async function testEmail() {
  try {
    const info = await transporter.sendMail({
      from: '"Test" <manargerjanii@gmail.com>',
      to: 'wessss815@gmail.com',
      subject: 'Test SMTP',
      text: 'Ceci est un test'
    });
    console.log('Email envoyé !', info.messageId);
  } catch (error) {
    console.error('Échec:', {
      error: error.message,
      fullError: error // Affiche tous les détails
    });
  }
}

testEmail();