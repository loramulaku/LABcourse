const path = require('path');
const db = require(path.join(__dirname, '..', 'models'));

async function main() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Connected to DB');

    // Ensure models are available
    const { User, Bill, BillItem, sequelize } = db;

    // Find or create a seed user
    const [user, userCreated] = await User.findOrCreate({
      where: { email: 'seed.user@example.local' },
      defaults: {
        name: 'Seed User',
        email: 'seed.user@example.local',
        password: 'SeedPass123!'
      }
    });

    console.log(`${userCreated ? 'Created' : 'Found'} user id=${user.id} email=${user.email}`);

    // Ensure an admin user exists for testing admin-only endpoints
    const [admin, adminCreated] = await User.findOrCreate({
      where: { email: 'seed.admin@example.local' },
      defaults: {
        name: 'Seed Admin',
        email: 'seed.admin@example.local',
        password: 'AdminPass123!',
        role: 'admin'
      }
    });

    if (!adminCreated && admin.role !== 'admin') {
      // Promote to admin if existed as non-admin
      admin.role = 'admin';
      await admin.save();
    }

    console.log(`${adminCreated ? 'Created' : 'Found'} admin id=${admin.id} email=${admin.email}`);

    // Create a bill + one item in a transaction
    const t = await sequelize.transaction();
    try {
      const bill = await Bill.create({
        patientId: user.id,
        totalAmount: 0.00,
        isPaid: false,
        notes: 'Seeded bill for testing',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }, { transaction: t });

      const item = await BillItem.create({
        billId: bill.id,
        description: 'Seed consultation',
        quantity: 1,
        amount: 100.00
      }, { transaction: t });

      bill.totalAmount = item.amount;
      await bill.save({ transaction: t });

      await t.commit();
      console.log('✅ Seeded bill id=', bill.id);
    } catch (err) {
      await t.rollback();
      throw err;
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err && err.message ? err.message : err);
    if (err && err.stack) console.error(err.stack);
    process.exit(1);
  }
}

main();
