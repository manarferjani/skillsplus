import path from 'path';
import { NextConfig } from 'next';
import { Configuration as WebpackConfig } from 'webpack';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  webpack: (config: WebpackConfig) => {
    // Initialise config.resolve et config.resolve.alias si nécessaire
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};

    // Assurez-vous que config.resolve.alias est un objet
    if (Array.isArray(config.resolve.alias)) {
      config.resolve.alias = {};
    }

    // Ajoute l'alias @app/ pour pointer vers le dossier app/
    config.resolve.alias['@app'] = path.resolve(__dirname, 'app');

    // Ajoute l'alias @models/ pour pointer vers le dossier models/
    config.resolve.alias['@models'] = path.resolve(__dirname, 'models');

    return config;
  },
};

export default nextConfig;