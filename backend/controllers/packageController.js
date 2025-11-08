const db = require('../models');

// Get all packages
exports.getPackages = async (req, res) => {
  try {
    const { isActive, packageType } = req.query;
    const where = {};
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    if (packageType) {
      where.packageType = packageType;
    }

    const packages = await db.BillingPackage.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    res.json({ packages });
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
};

// Get single package
exports.getPackage = async (req, res) => {
  try {
    const package = await db.BillingPackage.findByPk(req.params.id);
    
    if (!package) {
      return res.status(404).json({ error: 'Package not found' });
    }

    res.json(package);
  } catch (error) {
    console.error('Error fetching package:', error);
    res.status(500).json({ error: 'Failed to fetch package' });
  }
};

// Create package
exports.createPackage = async (req, res) => {
  try {
    const { name, description, packageType, price, duration, includedServices } = req.body;

    const package = await db.BillingPackage.create({
      name,
      description,
      packageType,
      price,
      duration,
      includedServices,
      isActive: true
    });

    res.status(201).json({ 
      message: 'Package created successfully',
      package 
    });
  } catch (error) {
    console.error('Error creating package:', error);
    res.status(500).json({ error: 'Failed to create package' });
  }
};

// Update package
exports.updatePackage = async (req, res) => {
  try {
    const package = await db.BillingPackage.findByPk(req.params.id);
    
    if (!package) {
      return res.status(404).json({ error: 'Package not found' });
    }

    const { name, description, packageType, price, duration, includedServices, isActive } = req.body;

    await package.update({
      name,
      description,
      packageType,
      price,
      duration,
      includedServices,
      isActive
    });

    res.json({ 
      message: 'Package updated successfully',
      package 
    });
  } catch (error) {
    console.error('Error updating package:', error);
    res.status(500).json({ error: 'Failed to update package' });
  }
};

// Delete package
exports.deletePackage = async (req, res) => {
  try {
    const package = await db.BillingPackage.findByPk(req.params.id);
    
    if (!package) {
      return res.status(404).json({ error: 'Package not found' });
    }

    await package.destroy();

    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Error deleting package:', error);
    res.status(500).json({ error: 'Failed to delete package' });
  }
};

// Toggle package active status
exports.togglePackageStatus = async (req, res) => {
  try {
    const package = await db.BillingPackage.findByPk(req.params.id);
    
    if (!package) {
      return res.status(404).json({ error: 'Package not found' });
    }

    await package.update({ isActive: !package.isActive });

    res.json({ 
      message: `Package ${package.isActive ? 'activated' : 'deactivated'} successfully`,
      package 
    });
  } catch (error) {
    console.error('Error toggling package status:', error);
    res.status(500).json({ error: 'Failed to toggle package status' });
  }
};
