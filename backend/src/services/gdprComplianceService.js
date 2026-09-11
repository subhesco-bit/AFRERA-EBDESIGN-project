/**
 * GDPR Compliance Service (Priority #11)
 * Data inventory, consent management, data export, right to be forgotten
 */

const database = require("../database/connection");

class GDPRComplianceService {
  async createDataInventory(userId) {
    try {
      const inventory = {
        userId,
        timestamp: new Date(),
        personalData: [],
        processingBasis: "consent",
        dataRetention: "1_year",
      };

      const userData = await database.query(
        "SELECT * FROM users WHERE id = $1",
        [userId]
      );

      if (userData.rows[0]) {
        inventory.personalData.push({
          category: "user_profile",
          data: {
            email: userData.rows[0].email,
            name: userData.rows[0].name,
            phone: userData.rows[0].phone,
          },
        });
      }

      const farmData = await database.query(
        "SELECT * FROM farms WHERE user_id = $1",
        [userId]
      );

      if (farmData.rows.length > 0) {
        inventory.personalData.push({
          category: "farm_data",
          count: farmData.rows.length,
        });
      }

      await database.query(
        `INSERT INTO data_inventory (user_id, inventory_data, created_at)
         VALUES ($1, $2, NOW())`,
        [userId, JSON.stringify(inventory)]
      );

      return inventory;
    } catch (error) {
      console.error("Inventory error:", error);
      throw error;
    }
  }

  async recordConsent(userId, consentData) {
    try {
      const consent = {
        userId,
        type: consentData.type,
        status: "given",
        timestamp: new Date(),
        ipAddress: consentData.ipAddress,
        userAgent: consentData.userAgent,
      };

      await database.query(
        `INSERT INTO user_consents (user_id, consent_data, status, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [userId, JSON.stringify(consent), "active"]
      );

      return consent;
    } catch (error) {
      console.error("Consent recording error:", error);
      throw error;
    }
  }

  async exportUserData(userId) {
    try {
      const user = await database.query(
        "SELECT * FROM users WHERE id = $1",
        [userId]
      );

      const farms = await database.query(
        "SELECT * FROM farms WHERE user_id = $1",
        [userId]
      );

      const transactions = await database.query(
        "SELECT * FROM transactions WHERE user_id = $1 LIMIT 100",
        [userId]
      );

      const exportData = {
        exportedAt: new Date(),
        user: user.rows[0] || {},
        farms: farms.rows,
        transactions: transactions.rows,
        format: "json",
      };

      await database.query(
        `INSERT INTO data_exports (user_id, export_data, status, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [userId, JSON.stringify(exportData), "completed"]
      );

      return exportData;
    } catch (error) {
      console.error("Export error:", error);
      throw error;
    }
  }

  async rightToBeForgotten(userId) {
    try {
      const result = await database.query(
        `UPDATE users SET deleted_at = NOW() WHERE id = $1 RETURNING id`,
        [userId]
      );

      await database.query(
        `INSERT INTO deletion_requests (user_id, status, created_at)
         VALUES ($1, $2, NOW())`,
        [userId, "completed"]
      );

      return {
        userId,
        status: "deleted",
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("RTBF error:", error);
      throw error;
    }
  }
}

module.exports = new GDPRComplianceService();
