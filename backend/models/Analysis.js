'use strict';

/**
 * Analysis Model - Deprecated wrapper for backward compatibility
 * 
 * This file now exports proper Sequelize models.
 * For new code, use AnalysisService and AnalysisRepository instead.
 * 
 * @deprecated Use AnalysisService for business logic
 */

module.exports = (sequelize, DataTypes) => {
  // This is a virtual model that doesn't represent a real table
  // It's just here to satisfy the models/index.js loader
  // The actual models are AnalysisType and PatientAnalysis
  
  // We return a placeholder that won't conflict with the loader
  const Analysis = sequelize.define('Analysis', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
  }, {
    tableName: '_analysis_deprecated',
    timestamps: false,
    // This model is just a placeholder and should not sync
    sync: { force: false, alter: false },
  });

  // Store reference to models for backward compatibility methods
  Analysis.getModels = () => {
    const models = require('./index');
    return {
      AnalysisType: models.AnalysisType,
      PatientAnalysis: models.PatientAnalysis,
      Laboratory: models.Laboratory,
      User: models.User,
    };
  };

  // Backward compatibility static methods (deprecated)
  Analysis.getAllTypes = async function() {
    console.warn('⚠️  Analysis.getAllTypes() is deprecated. Use AnalysisService.getAllTypes() instead.');
    const { AnalysisType } = this.getModels();
    return await AnalysisType.findAll();
  };

  Analysis.getTypesByLaboratory = async function(labId) {
    console.warn('⚠️  Analysis.getTypesByLaboratory() is deprecated. Use AnalysisService.getTypesByLaboratory() instead.');
    const { AnalysisType } = this.getModels();
    return await AnalysisType.findAll({
      where: { laboratory_id: labId }
    });
  };

  Analysis.createRequest = async function(data) {
    console.warn('⚠️  Analysis.createRequest() is deprecated. Use AnalysisService.createRequest() instead.');
    const AnalysisService = require('../services/AnalysisService');
    const service = new AnalysisService();
    return await service.createRequest(data);
  };

  Analysis.getPatientAnalyses = async function(userId) {
    console.warn('⚠️  Analysis.getPatientAnalyses() is deprecated. Use AnalysisService.getPatientAnalyses() instead.');
    const AnalysisService = require('../services/AnalysisService');
    const service = new AnalysisService();
    return await service.getPatientAnalyses(userId);
  };

  Analysis.updateResult = async function(id, result, status = 'completed') {
    console.warn('⚠️  Analysis.updateResult() is deprecated. Use AnalysisService.updateResult() instead.');
    const AnalysisService = require('../services/AnalysisService');
    const service = new AnalysisService();
    return await service.updateResult(id, result, status);
  };

  return Analysis;
};
