// Punto de entrada para Vercel Serverless Functions
// Vercel llama a este archivo por cada request a /api/*
// El archivo simplemente exporta la aplicación Express
require('dotenv').config();
const app = require('./src/app');

module.exports = app;
