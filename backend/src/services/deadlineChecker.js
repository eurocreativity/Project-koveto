const cron = require('node-cron');
const emailService = require('./emailService');

/**
 * Deadline Checker - Cron job to check upcoming deadlines
 * Runs daily at 8:00 AM
 */

class DeadlineChecker {
  constructor(db) {
    this.db = db;
    this.cronJob = null;
  }

  /**
   * Start the cron job
   */
  start() {
    // Run every day at 8:00 AM
    this.cronJob = cron.schedule('0 8 * * *', async () => {
      console.log('🕐 Running deadline checker...');
      await this.checkDeadlines();
    });

    console.log('✅ Deadline checker started (runs daily at 8:00 AM)');
  }

  /**
   * Stop the cron job
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('⏹️ Deadline checker stopped');
    }
  }

  /**
   * Check all tasks for upcoming deadlines
   */
  async checkDeadlines() {
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const threeDaysLater = new Date(today);
      threeDaysLater.setDate(threeDaysLater.getDate() + 3);

      // Format dates for MySQL
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      const threeDaysStr = threeDaysLater.toISOString().split('T')[0];

      // Find tasks due tomorrow (1 day warning)
      const [tasksDueTomorrow] = await this.db.query(`
        SELECT
          t.*,
          p.name as project_name,
          u.name as owner_name,
          u.email as owner_email
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN users u ON t.owner_id = u.id
        WHERE t.deadline = ?
          AND t.status != 'completed'
          AND u.email IS NOT NULL
      `, [tomorrowStr]);

      // Find tasks due in 3 days (3 day warning)
      const [tasksDueInThreeDays] = await this.db.query(`
        SELECT
          t.*,
          p.name as project_name,
          u.name as owner_name,
          u.email as owner_email
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN users u ON t.owner_id = u.id
        WHERE t.deadline = ?
          AND t.status != 'completed'
          AND u.email IS NOT NULL
      `, [threeDaysStr]);

      // Send 1-day warnings
      for (const task of tasksDueTomorrow) {
        const user = {
          email: task.owner_email,
          name: task.owner_name
        };
        await emailService.sendDeadlineReminder(task, user, 1);
      }

      // Send 3-day warnings
      for (const task of tasksDueInThreeDays) {
        const user = {
          email: task.owner_email,
          name: task.owner_name
        };
        await emailService.sendDeadlineReminder(task, user, 3);
      }

      console.log(`📧 Deadline reminders sent: ${tasksDueTomorrow.length} (1 day), ${tasksDueInThreeDays.length} (3 days)`);

    } catch (error) {
      console.error('❌ Deadline checker error:', error);
    }
  }

  /**
   * Manual trigger for testing
   */
  async checkNow() {
    console.log('🧪 Manual deadline check triggered...');
    await this.checkDeadlines();
  }
}

module.exports = DeadlineChecker;
