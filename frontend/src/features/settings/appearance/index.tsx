import { useEffect, useState } from 'react';
import ContentSection from '../components/content-section';
import { AppearanceForm } from './appearance-form';

// Interface pour les props dynamiques
interface SettingsSectionProps {
  title?: string;
  description?: string;
  formComponent?: React.ComponentType; // Permet de passer un composant de formulaire personnalisé
  configSource?: string; // URL ou source pour charger la configuration dynamique
}

// Configuration par défaut
const defaultConfig = {
  title: 'Appearance',
  description: 'Customize the appearance of the app. Automatically switch between day and night themes.',
};

export default function SettingsAppearance({
  title = defaultConfig.title,
  description = defaultConfig.description,
  formComponent: FormComponent = AppearanceForm,
  configSource,
}: SettingsSectionProps) {
  // État pour gérer la configuration dynamique
  const [dynamicConfig, setDynamicConfig] = useState({ title, description });

  // Charger la configuration dynamiquement si une source est fournie
  useEffect(() => {
    if (configSource) {
      const fetchConfig = async () => {
        try {
          const response = await fetch(configSource);
          const data = await response.json();
          setDynamicConfig({
            title: data.title || defaultConfig.title,
            description: data.description || defaultConfig.description,
          });
        } catch (error) {
          console.error('Erreur lors du chargement de la configuration:', error);
        }
      };
      fetchConfig();
    }
  }, [configSource]);

  return (
    <ContentSection
      title={dynamicConfig.title}
      desc={dynamicConfig.description}
    >
      <FormComponent />
    </ContentSection>
  );
}