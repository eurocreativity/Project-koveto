const nodemailer = require('nodemailer');

/**
 * Email Service - Nodemailer integration
 * Sends email notifications for tasks and projects
 */

class EmailService {
  constructor() {
    this.transporter = null;
    this.enabled = process.env.EMAIL_ENABLED === 'true';

    if (this.enabled) {
      this.initTransporter();
    }
  }

  initTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      console.log('✅ Email service initialized');
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      this.enabled = false;
    }
  }

  /**
   * Send task assignment notification
   */
  async sendTaskAssignment(task, user) {
    const subject = `📋 Új feladat hozzárendelve: ${task.name}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">📋 Új feladat hozzárendelve</h2>
        <div style="background: #f5f7fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${task.name}</h3>
          <p><strong>Projekt:</strong> ${task.project_name || 'N/A'}</p>
          <p><strong>Leírás:</strong> ${task.description || 'Nincs leírás'}</p>
          <p><strong>Határidő:</strong> ${task.deadline}</p>
          <p><strong>Prioritás:</strong> ${this.getPriorityBadge(task.priority)}</p>
        </div>
        <p style="color: #666;">Jelentkezz be a rendszerbe a feladat megtekintéséhez.</p>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  /**
   * Send deadline reminder (1 or 3 days before)
   */
  async sendDeadlineReminder(task, user, daysLeft) {
    const urgency = daysLeft === 1 ? '⚠️ HOLNAP' : '📅';
    const subject = `${urgency} Határidő közeleg: ${task.name}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">⚠️ Határidő figyelmeztetés</h2>
        <div style="background: ${daysLeft === 1 ? '#fef3c7' : '#f5f7fa'}; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${task.name}</h3>
          <p style="font-size: 18px; color: #f59e0b;"><strong>${daysLeft} nap múlva lejár!</strong></p>
          <p><strong>Projekt:</strong> ${task.project_name || 'N/A'}</p>
          <p><strong>Határidő:</strong> ${task.deadline}</p>
          <p><strong>Státusz:</strong> ${this.getStatusBadge(task.status)}</p>
        </div>
        <p style="color: #666;">Ne felejtsd el időben befejezni a feladatot!</p>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  /**
   * Send task status change notification
   */
  async sendTaskStatusChange(task, user, oldStatus, newStatus) {
    const subject = `🔄 Feladat státusz frissült: ${task.name}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">🔄 Feladat frissítve</h2>
        <div style="background: #f5f7fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${task.name}</h3>
          <p><strong>Státusz változás:</strong></p>
          <p style="font-size: 16px;">
            ${this.getStatusBadge(oldStatus)} → ${this.getStatusBadge(newStatus)}
          </p>
          <p><strong>Projekt:</strong> ${task.project_name || 'N/A'}</p>
        </div>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  /**
   * Send project created notification
   */
  async sendProjectCreated(project, users) {
    const subject = `🚀 Új projekt létrehozva: ${project.name}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">🚀 Új projekt</h2>
        <div style="background: #f5f7fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${project.name}</h3>
          <p>${project.description || 'Nincs leírás'}</p>
          <p><strong>Kezdés:</strong> ${project.start_date}</p>
          <p><strong>Befejezés:</strong> ${project.end_date}</p>
          <p><strong>Felelős:</strong> ${project.owner_name || 'N/A'}</p>
        </div>
      </div>
    `;

    // Send to all users
    const promises = users.map(user => this.sendEmail(user.email, subject, html));
    return Promise.all(promises);
  }

  /**
   * Core email sending function
   */
  async sendEmail(to, subject, html) {
    if (!this.enabled) {
      console.log(`📧 [EMAIL DISABLED] Would send to: ${to}`);
      console.log(`   Subject: ${subject}`);
      return { success: false, message: 'Email disabled' };
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        html
      });

      console.log(`✅ Email sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`❌ Email send failed to ${to}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * HTML badge helpers
   */
  getPriorityBadge(priority) {
    const badges = {
      low: '<span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px;">Alacsony</span>',
      medium: '<span style="background: #f59e0b; color: white; padding: 4px 8px; border-radius: 4px;">Közepes</span>',
      high: '<span style="background: #ef4444; color: white; padding: 4px 8px; border-radius: 4px;">Magas</span>'
    };
    return badges[priority] || priority;
  }

  getStatusBadge(status) {
    const badges = {
      open: '<span style="background: #6b7280; color: white; padding: 4px 8px; border-radius: 4px;">Nyitott</span>',
      in_progress: '<span style="background: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px;">Folyamatban</span>',
      completed: '<span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px;">Befejezett</span>'
    };
    return badges[status] || status;
  }

  /**
   * Test email connection
   */
  async testConnection() {
    if (!this.enabled) {
      return { success: false, message: 'Email service is disabled' };
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'Email connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

// Singleton instance
const emailService = new EmailService();

module.exports = emailService;
