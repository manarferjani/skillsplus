import mongoose from 'mongoose';
import Course from '../models/course.model.js';
import User from '../models/user.js';
import Admin from '../models/admin.js';
import Manager from '../models/manager.js';
import {Collaborator} from '../models/collaborator.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { sendCourseAssignmentEmail } from './emailcourse.service.js';
import { sendLevelAssignmentEmail } from './emaillevel.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CourseService {
  async getAllCourses() {
    try {
      const courses = await Course.find()
        .populate('assignedTo', 'name email role')
        .populate('assignedBy', 'name email role');
      console.log('Fetched Courses:', courses.map(c => ({
        _id: c._id,
        name: c.name,
        assignedBy: c.assignedBy,
        assignedTo: c.assignedTo,
      })));
      return courses;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des cours : ${error.message}`);
    }
  }

   

  async getCourseById(courseId) {
    try {
      const course = await Course.findById(courseId);
      if (!course) throw new Error('Cours non trouvé');
      return course;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération du cours : ${error.message}`);
    }
  }

  async getLevelByCourseAndLevelId(courseId, levelId) {
    try {
      const course = await Course.findById(courseId);
      if (!course) throw new Error('Cours non trouvé');

      const level = course.levels.id(levelId);
      if (!level) throw new Error('Niveau non trouvé');

      return level;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération du niveau : ${error.message}`);
    }
  }

  async createCourse(courseData) {
  try {
    const course = new Course(courseData);
    const savedCourse = await course.save();
    return savedCourse;
  } catch (error) {
    throw new Error(`Erreur lors de la création du cours : ${error.message}`);
  }
}
  async updateCourseById(courseId, updateData) {
    try {
      const updatedCourse = await Course.findByIdAndUpdate(courseId, updateData, { new: true, runValidators: true });
      if (!updatedCourse) throw new Error('Cours non trouvé');
      return updatedCourse;
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du cours : ${error.message}`);
    }
  }

  async deleteCourseById(courseId) {
    try {
      const course = await Course.findByIdAndDelete(courseId);
      if (!course) throw new Error('Cours non trouvé');
      return { message: 'Cours supprimé avec succès' };
    } catch (error) {
      throw new Error(`Erreur lors de la suppression du cours : ${error.message}`);
    }
  }

  async addLevelToCourseById(courseId, levelData) {
    try {
      const course = await Course.findById(courseId);
      if (!course) throw new Error('Cours non trouvé');

      course.levels.push(levelData);
      return await course.save();
    } catch (error) {
      throw new Error(`Erreur lors de l'ajout du niveau : ${error.message}`);
    }
  }

  async getLevelsByCourseId(courseId) {
    try {
      const course = await Course.findById(courseId);
      if (!course) throw new Error('Cours non trouvé');

      return course.levels;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des niveaux : ${error.message}`);
    }
  }

  async updateLevelById(courseId, levelId, updatedData) {
    try {
      const course = await Course.findById(courseId);
      if (!course) throw new Error('Cours non trouvé');

      const level = course.levels.id(levelId);
      if (!level) throw new Error('Niveau non trouvé');

      Object.assign(level, updatedData);
      await course.save();
      return level;
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du niveau : ${error.message}`);
    }
  }

  async deleteLevelById(courseId, levelId) {
    try {
      const course = await Course.findById(courseId);
      if (!course) throw new Error('Cours non trouvé');

      const level = course.levels.id(levelId);
      if (!level) throw new Error('Niveau non trouvé');

      level.remove();
      await course.save();
      return { message: 'Niveau supprimé avec succès' };
    } catch (error) {
      throw new Error(`Erreur lors de la suppression du niveau : ${error.message}`);
    }
  }

  

  async getSupportsByLevel(courseId, levelId) {
    try {
      const course = await Course.findById(courseId);
      if (!course) throw new Error('Cours non trouvé');

      const level = course.levels.id(levelId);
      if (!level) throw new Error('Niveau non trouvé');

      return level.supports;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des supports : ${error.message}`);
    }
  }
async assignLevelToUser(courseId, levelId, assignTo, assignedBy) {
  try {
    const course = await Course.findById(courseId);
    if (!course) throw new Error('Cours non trouvé');

    const level = course.levels.id(levelId);
    if (!level) throw new Error('Niveau non trouvé');

    // Find user by email or ID
    let user;
    const isEmail = assignTo.includes('@');
    if (isEmail) {
      user = await Admin.findOne({ email: assignTo }).select('_id firstName lastName email role')
        || await Manager.findOne({ email: assignTo }).select('_id firstName lastName email role')
        || await Collaborator.findOne({ email: assignTo }).select('_id firstName lastName email role')
        || await User.findOne({ email: assignTo }).select('_id firstName lastName email role');
    } else if (mongoose.Types.ObjectId.isValid(assignTo)) {
      user = await Admin.findById(assignTo).select('_id firstName lastName email role')
        || await Manager.findById(assignTo).select('_id firstName lastName email role')
        || await Collaborator.findById(assignTo).select('_id firstName lastName email role')
        || await User.findById(assignTo).select('_id firstName lastName email role');
    }
    if (!user) throw new Error('Utilisateur non trouvé');

    if (!level.assignedTo) level.assignedTo = [];
    let message = 'Niveau affecté à l’utilisateur avec succès';
    if (level.assignedTo.some(id => id.toString() === user._id.toString())) {
      message = 'L’utilisateur est déjà assigné à ce niveau, email envoyé à nouveau';
    } else {
      level.assignedTo.push(user._id);
      // Remove assignedBy to match course assignment
      level.assignedBy = undefined; // Or keep if required
      await course.save();
    }

    // Send email with a link to the level
    const levelLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/courses/${courseId}/levels/${levelId}`;
    const emailResult = await sendLevelAssignmentEmail(
      user.email,
      `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utilisateur',
      level.title,
      level.description || 'Aucun descriptif fourni',
      courseId,
      levelId,
      levelLink
    );

    if (!emailResult.success) {
      console.error('Échec de l’envoi de l’email:', emailResult.error);
      // Don’t fail assignment if email fails
    }

    return {
      message,
      level: {
        _id: level._id,
        title: level.title,
        assignedTo: level.assignedTo,
      },
    };
  } catch (error) {
    throw new Error(`Erreur lors de l’affectation du niveau : ${error.message}`);
  }
}
  async addSupportToLevel(courseId, levelId, supportData, pdfFile = null) {
    try {
      const course = await Course.findById(courseId);
      if (!course) throw new Error('Cours non trouvé');

      const level = course.levels.id(levelId);
      if (!level) throw new Error('Niveau non trouvé');

      const newSupportData = {
        name: supportData.name,
        description: supportData.description,
        type: Array.isArray(supportData.type) ? supportData.type : [supportData.type],
        imageUrl: supportData.imageUrl,
        isSaved: false,
        isViewed: false,
      };

      if (newSupportData.type.includes('video')) {
        if (!supportData.videoUrl) throw new Error('URL de la vidéo requise pour le type vidéo');
        newSupportData.videoUrl = supportData.videoUrl;
      }

      if (newSupportData.type.includes('pdf')) {
        if (!pdfFile) throw new Error('Fichier PDF requis pour le type PDF');
        newSupportData.pdfFile = pdfFile;
      }

      if (newSupportData.type.includes('link')) {
        if (!supportData.linkUrl) throw new Error('URL du lien requise pour le type lien');
        newSupportData.linkUrl = supportData.linkUrl;
      }

      level.supports.push(newSupportData);
      const savedCourse = await course.save();
      const addedSupport = level.supports[level.supports.length - 1];
      return addedSupport;
    } catch (error) {
      throw new Error(`Erreur lors de l'ajout du support : ${error.message}`);
    }
  }

  async updateSupportById(courseId, levelId, supportId, supportData, pdfFile = null) {
    try {
      const course = await Course.findById(courseId);
      if (!course) throw new Error('Cours non trouvé');

      const level = course.levels.id(levelId);
      if (!level) throw new Error('Niveau non trouvé');

      const support = level.supports.id(supportId);
      if (!support) throw new Error('Support non trouvé');

      support.name = supportData.name;
      support.description = supportData.description;
      support.type = Array.isArray(supportData.type) ? supportData.type : [supportData.type];
      support.imageUrl = supportData.imageUrl;

      if (support.type.includes('video')) {
        if (!supportData.videoUrl) throw new Error('URL de la vidéo requise pour le type vidéo');
        support.videoUrl = supportData.videoUrl;
      } else {
        support.videoUrl = undefined;
      }

      if (support.type.includes('pdf')) {
        if (!pdfFile && !support.pdfFile) throw new Error('Fichier PDF requis pour le type PDF');
        if (pdfFile) {
          if (support.pdfFile) {
            const oldPdfPath = path.join(__dirname, '..', 'Uploads', 'pdfs', support.pdfFile);
            if (fs.existsSync(oldPdfPath)) {
              fs.unlinkSync(oldPdfPath);
            }
          }
          support.pdfFile = pdfFile;
        }
      } else {
        if (support.pdfFile) {
          const oldPdfPath = path.join(__dirname, '..', 'Uploads', 'pdfs', support.pdfFile);
          if (fs.existsSync(oldPdfPath)) {
            fs.unlinkSync(oldPdfPath);
          }
          support.pdfFile = undefined;
        }
      }

      if (support.type.includes('link')) {
        if (!supportData.linkUrl) throw new Error('URL du lien requise pour le type lien');
        support.linkUrl = supportData.linkUrl;
      } else {
        support.linkUrl = undefined;
      }

      await course.save();
      return support;
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du support : ${error.message}`);
    }
  }

  async assignCourseToUser(courseId, userIdOrEmail) {
  try {
    const course = await Course.findById(courseId);
    if (!course) throw new Error('Cours non trouvé');

    let user;

    const isEmail = userIdOrEmail.includes('@');

    if (isEmail) {
      user =
        await Admin.findOne({ email: userIdOrEmail }).select('_id name email role') ||
        await Manager.findOne({ email: userIdOrEmail }).select('_id name email role') ||
        await Collaborator.findOne({ email: userIdOrEmail }).select('_id name email role') ||
        await User.findOne({ email: userIdOrEmail }).select('_id name email role');
    } else {
      if (!mongoose.Types.ObjectId.isValid(userIdOrEmail)) {
        throw new Error('Identifiant invalide');
      }

      user =
        await Admin.findById(userIdOrEmail).select('_id name email role') ||
        await Manager.findById(userIdOrEmail).select('_id name email role') ||
        await Collaborator.findById(userIdOrEmail).select('_id name email role') ||
        await User.findById(userIdOrEmail).select('_id name email role');
    }

    if (!user) throw new Error('Utilisateur non trouvé');

    if (!course.assignedTo) course.assignedTo = [];

    let message = 'Cours affecté à l’utilisateur avec succès';
    if (course.assignedTo.some(id => id.toString() === user._id.toString())) {
      message = 'L’utilisateur est déjà assigné à ce cours, email envoyé à nouveau';
    } else {
      course.assignedTo.push(user._id);
      await course.save();
    }

    const emailResult = await sendCourseAssignmentEmail(
      user.email,
      user.name || 'Utilisateur',
      course.name,
      course.desc || 'Aucun descriptif fourni',
      course._id.toString()
    );

    if (!emailResult.success) {
      console.error('Échec de l’envoi de l’email:', emailResult.error);
    }

    return {
      message,
      course: {
        _id: course._id,
        name: course.name,
        assignedTo: course.assignedTo,
      },
    };
  } catch (error) {
    throw new Error(`Erreur lors de l’affectation du cours : ${error.message}`);
  }
}


  async deleteSupportById(courseId, levelId, supportId) {
    try {
      const course = await Course.findById(courseId);
      if (!course) throw new Error('Cours non trouvé');

      const level = course.levels.id(levelId);
      if (!level) throw new Error('Niveau non trouvé');

      const support = level.supports.id(supportId);
      if (!support) throw new Error('Support non trouvé');

      if (support.pdfFile) {
        const pdfPath = path.join(process.cwd(), 'Uploads', 'pdfs', support.pdfFile);
        try {
          if (fs.existsSync(pdfPath)) {
            fs.unlinkSync(pdfPath);
            console.log('✅ Fichier PDF supprimé :', pdfPath);
          } else {
            console.warn('⚠️ Fichier PDF non trouvé :', pdfPath);
          }
        } catch (err) {
          console.error('❌ Erreur suppression fichier PDF :', err.message);
        }
      }

      support.remove();
      if (typeof level.calculateProgress === 'function') {
        level.calculateProgress();
      }

      await course.save();
      return { message: 'Support supprimé avec succès' };
    } catch (error) {
      throw new Error(`Erreur lors de la suppression du support : ${error.message}`);
    }
  }

  async markSupportAsViewed(courseId, levelId, supportId, isViewed) {
    try {
      const course = await Course.findById(courseId);
      if (!course) throw new Error('Cours non trouvé');

      const level = course.levels.id(levelId);
      if (!level) throw new Error('Niveau non trouvé');

      const support = level.supports.id(supportId);
      if (!support) throw new Error('Support non trouvé');

      support.isViewed = isViewed;
      level.calculateProgress();
      await course.save();
      return support;
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du statut visionné : ${error.message}`);
    }
  }

  async markLevelAsSaved(courseId, levelId, isSaved) {
    try {
      const course = await Course.findById(courseId);
      if (!course) throw new Error('Cours non trouvé');

      const level = course.levels.id(levelId);
      if (!level) throw new Error('Niveau non trouvé');

      level.isSaved = isSaved;
      console.log(`Updating level ${levelId} isSaved to ${isSaved}`);
      if (typeof level.calculateProgress === 'function') {
        level.calculateProgress();
      }

      await course.save();
      console.log(`Course ${courseId} saved successfully`);
      return { message: 'Niveau marqué comme sauvegardé', level };
    } catch (error) {
      console.error('Error in markLevelAsSaved:', error);
      throw new Error(`Erreur lors de la mise à jour du statut de sauvegarde du niveau : ${error.message}`);
    }
  }

  async markSupportAsSaved(courseId, levelId, supportId, isSaved) {
    try {
      const course = await Course.findById(courseId);
      if (!course) throw new Error('Cours non trouvé');

      const level = course.levels.id(levelId);
      if (!level) throw new Error('Niveau non trouvé');

      const support = level.supports.id(supportId);
      if (!support) throw new Error('Support non trouvé');

      support.isSaved = isSaved;
      if (typeof level.calculateProgress === 'function') {
        level.calculateProgress();
      }

      await course.save();
      return { message: 'Support marqué comme sauvegardé', support };
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du statut de sauvegarde du support : ${error.message}`);
    }
  }

  async downloadSupportPDF(courseId, levelId, supportId) {
    try {
      const course = await Course.findById(courseId);
      if (!course) throw new Error('Cours non trouvé');

      const level = course.levels.id(levelId);
      if (!level) throw new Error('Niveau non trouvé');

      const support = level.supports.id(supportId);
      if (!support || !support.type.includes('pdf')) throw new Error('Support PDF non trouvé');

      const pdfPath = path.join(__dirname, '..', 'Uploads', 'pdfs', support.pdfFile);
      if (!fs.existsSync(pdfPath)) throw new Error('Fichier non trouvé sur le serveur');

      return pdfPath;
    } catch (error) {
      throw new Error(`Erreur lors du téléchargement du PDF : ${error.message}`);
    }
  }

  async toggleCourseSavedStatus(courseId, saved) {
    try {
      if (typeof saved !== 'boolean') throw new Error('saved must be a boolean');

      const course = await Course.findById(courseId);
      if (!course) throw new Error('Cours non trouvé');

      course.saved = saved;
      await course.save();

      return {
        message: `Cours ${saved ? 'sauvegardé' : 'non sauvegardé'} avec succès`,
        course: {
          _id: course._id,
          name: course.name,
          saved: course.saved,
        },
      };
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du statut sauvegardé du cours : ${error.message}`);
    }
  }

  async toggleCourseCompletedStatus(courseId, completed) {
    try {
      if (typeof completed !== 'boolean') throw new Error('completed must be a boolean');

      const course = await Course.findById(courseId);
      if (!course) throw new Error('Cours non trouvé');

      course.completed = completed;
      await course.save();

      return {
        message: `Cours ${completed ? 'marqué comme terminé' : 'marqué comme non terminé'} avec succès`,
        course: {
          _id: course._id,
          name: course.name,
          completed: course.completed,
        },
      };
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du statut terminé du cours : ${error.message}`);
    }
  }

 
  async openSupportLink(courseId, levelId, supportId) {
    try {
      const course = await Course.findById(courseId);
      if (!course) throw new Error('Cours non trouvé');

      const level = course.levels.id(levelId);
      if (!level) throw new Error('Niveau non trouvé');

      const support = level.supports.id(supportId);
      if (!support || !support.type.includes('link')) throw new Error('Support lien non trouvé');

      return support.linkUrl;
    } catch (error) {
      throw new Error(`Erreur lors de l'ouverture du lien : ${error.message}`);
    }
  }

  async getUserRole(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('Utilisateur non trouvé');
      return { role: user.role };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération du rôle utilisateur : ${error.message}`);
    }
  }
  
}


export default new CourseService();