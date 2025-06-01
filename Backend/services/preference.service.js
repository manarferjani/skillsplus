import { Preference, AppearanceConfig } from '../models/preference.model.js';

class PreferenceService {
  // Récupérer la configuration globale (thèmes et polices disponibles)
  async getAppearanceConfig() {
    try {
      let config = await AppearanceConfig.findOne();
      if (!config) {
        // Créer une configuration par défaut si aucune n'existe
        config = new AppearanceConfig({
          themes: [
            {
              value: 'light',
              label: 'Light',
              preview: { bg: '#ecedef', cardBg: 'white', accent: '#ecedef' },
            },
            {
              value: 'dark',
              label: 'Dark',
              preview: { bg: 'slate-950', cardBg: 'slate-800', accent: 'slate-400' },
            },
            {
              value: 'blue',
              label: 'Blue',
              preview: { bg: '#1e3a8a', cardBg: '#1e40af', accent: '#60a5fa' },
            },
          ],
          fonts: ['inter', 'manrope', 'roboto', 'arial'],
        });
        await config.save();
      }
      return config;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des configurations : ${error.message}`);
    }
  }

  // Récupérer les préférences d'un utilisateur
  async getUserPreferences(userId) {
    try {
      const preferences = await Preference.findOne({ userId });
      if (!preferences) {
        // Retourner des préférences par défaut si aucune n'existe
        const config = await this.getAppearanceConfig();
        return {
          userId,
          theme: config.themes[0].value, // Thème par défaut : premier thème
          font: config.fonts[0], // Police par défaut : première police
        };
      }
      return preferences;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des préférences : ${error.message}`);
    }
  }

  // Mettre à jour ou créer les préférences d'un utilisateur
  async updateUserPreferences(userId, { theme, font }) {
    try {
      // Vérifier si le thème et la police sont valides
      const config = await this.getAppearanceConfig();
      if (!config.themes.find((t) => t.value === theme)) {
        throw new Error('Thème invalide');
      }
      if (!config.fonts.includes(font)) {
        throw new Error('Police invalide');
      }

      const preferences = await Preference.findOneAndUpdate(
        { userId },
        { theme, font },
        { upsert: true, new: true }
      );
      return preferences;
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour des préférences : ${error.message}`);
    }
  }
}

export default new PreferenceService();