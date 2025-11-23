const { User, UserProfile, Doctor, Laboratory, AdminProfile } = require('../models');

const userController = {
  // Get all users
  async getAllUsers(req, res) {
    try {
      const users = await User.findAll({
        attributes: { exclude: ['password'] },
        include: [
          {
            model: UserProfile,
            attributes: ['phone', 'profile_image', 'gender'],
          },
        ],
        order: [['created_at', 'DESC']],
      });

      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  },

  // Get user by ID (or current user if /me route)
  async getUserById(req, res) {
    try {
      // Support both /me and /:id routes
      const userId = req.params.id || req.user.id;
      
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] },
        include: [
          {
            model: UserProfile,
          },
        ],
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  },

  // Update user
  async updateUser(req, res) {
    try {
      const userId = req.params.id;
      const updates = req.body;

      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Don't allow updating password through this endpoint
      delete updates.password;

      await user.update(updates);

      const updatedUser = await User.findByPk(userId, {
        attributes: { exclude: ['password'] },
      });

      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  },

  // Delete user
  async deleteUser(req, res) {
    try {
      const userId = req.params.id;

      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await user.destroy();

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  },

  // Get users by role
  async getUsersByRole(req, res) {
    try {
      const { role } = req.params;

      const users = await User.findAll({
        where: { role },
        attributes: { exclude: ['password'] },
        include: [
          {
            model: UserProfile,
            attributes: ['phone', 'profile_image'],
          },
        ],
      });

      res.json(users);
    } catch (error) {
      console.error('Error fetching users by role:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  },

  // Update user status (admin only)
  async updateUserStatus(req, res) {
    try {
      const userId = req.params.id;
      const { account_status, verification_notes } = req.body;

      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await user.update({
        account_status,
        verification_notes,
        verified_by: req.user.id,
        verified_at: new Date(),
      });

      res.json({
        message: 'User status updated successfully',
        user: user.toSafeObject(),
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ error: 'Failed to update user status' });
    }
  },
};

module.exports = userController;

