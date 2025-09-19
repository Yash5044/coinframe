import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

class DatabaseService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      if (Platform.OS === 'web') {
        // Use AsyncStorage for web platform
        this.isInitialized = true;
        console.log('Database initialized with AsyncStorage for web');
        return { success: true };
      } else {
        this.db = await SQLite.openDatabaseAsync('expense_tracker.db');
        await this.createTables();
        this.isInitialized = true;
        console.log('Database initialized successfully');
        return { success: true };
      }
    } catch (error) {
      console.error('Error initializing database:', error);
      return { success: false, error: error.message };
    }
  }

  async createTables() {
    try {
      // Create transactions table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          message_id TEXT UNIQUE,
          sms_text TEXT NOT NULL,
          date_time DATETIME NOT NULL,
          sender TEXT,
          is_expense BOOLEAN NOT NULL,
          amount REAL,
          mode TEXT,
          bank TEXT,
          account TEXT,
          category TEXT,
          receiver TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create index for faster queries
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date_time);
      `);
      
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
      `);

      console.log('Database tables created successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  async saveTransaction(transactionData) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const {
        messageId,
        smsText,
        dateTime,
        sender,
        classification
      } = transactionData;

      if (Platform.OS === 'web') {
        // Use AsyncStorage for web
        const transactionId = Date.now().toString();
        const transaction = {
          id: transactionId,
          message_id: messageId,
          sms_text: smsText,
          date_time: dateTime.toISOString(),
          sender: sender,
          is_expense: classification.IsExpense === 'Yes',
          amount: classification.Amount || 0,
          mode: classification.Mode || '',
          bank: classification.Bank || '',
          account: classification.Account || '',
          category: classification.Category || '',
          receiver: classification.Receiver || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const existingData = await AsyncStorage.getItem('transactions');
        const transactions = existingData ? JSON.parse(existingData) : [];
        
        // Remove existing transaction with same message_id
        const filteredTransactions = transactions.filter(t => t.message_id !== messageId);
        filteredTransactions.push(transaction);
        
        await AsyncStorage.setItem('transactions', JSON.stringify(filteredTransactions));
        
        return {
          success: true,
          transactionId: transactionId
        };
      } else {
        const result = await this.db.runAsync(
          `INSERT OR REPLACE INTO transactions 
           (message_id, sms_text, date_time, sender, is_expense, amount, mode, bank, account, category, receiver, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            messageId,
            smsText,
            dateTime.toISOString(),
            sender,
            classification.IsExpense === 'Yes' ? 1 : 0,
            classification.Amount || 0,
            classification.Mode || '',
            classification.Bank || '',
            classification.Account || '',
            classification.Category || '',
            classification.Receiver || ''
          ]
        );

        return {
          success: true,
          transactionId: result.lastInsertRowId
        };
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      return { success: false, error: error.message };
    }
  }

  async batchSaveTransactions(transactions) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      let savedCount = 0;
      
      for (const transaction of transactions) {
        const result = await this.saveTransaction(transaction);
        if (result.success) {
          savedCount++;
        }
      }

      return {
        success: true,
        saved: savedCount,
        total: transactions.length
      };
    } catch (error) {
      console.error('Error batch saving transactions:', error);
      return { success: false, error: error.message };
    }
  }

  async getTransactions(filters = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (Platform.OS === 'web') {
        // Use AsyncStorage for web
        const existingData = await AsyncStorage.getItem('transactions');
        let transactions = existingData ? JSON.parse(existingData) : [];
        
        // Filter only expenses
        transactions = transactions.filter(t => t.is_expense);
        
        // Apply filters
        if (filters.startDate) {
          transactions = transactions.filter(t => new Date(t.date_time) >= filters.startDate);
        }
        
        if (filters.endDate) {
          transactions = transactions.filter(t => new Date(t.date_time) <= filters.endDate);
        }
        
        if (filters.category) {
          transactions = transactions.filter(t => t.category === filters.category);
        }
        
        if (filters.bank) {
          transactions = transactions.filter(t => t.bank === filters.bank);
        }
        
        if (filters.mode) {
          transactions = transactions.filter(t => t.mode === filters.mode);
        }
        
        // Sort by date descending
        transactions.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
        
        // Apply limit
        if (filters.limit) {
          transactions = transactions.slice(0, filters.limit);
        }
        
        return {
          success: true,
          transactions: transactions.map(row => ({
            ...row,
            date_time: new Date(row.date_time)
          }))
        };
      } else {
        let query = `
          SELECT * FROM transactions 
          WHERE is_expense = 1
        `;
        let params = [];

        // Add filters
        if (filters.startDate) {
          query += ` AND date_time >= ?`;
          params.push(filters.startDate.toISOString());
        }

        if (filters.endDate) {
          query += ` AND date_time <= ?`;
          params.push(filters.endDate.toISOString());
        }

        if (filters.category) {
          query += ` AND category = ?`;
          params.push(filters.category);
        }

        if (filters.bank) {
          query += ` AND bank = ?`;
          params.push(filters.bank);
        }

        if (filters.mode) {
          query += ` AND mode = ?`;
          params.push(filters.mode);
        }

        query += ` ORDER BY date_time DESC`;

        if (filters.limit) {
          query += ` LIMIT ?`;
          params.push(filters.limit);
        }

        const result = await this.db.getAllAsync(query, params);
        
        return {
          success: true,
          transactions: result.map(row => ({
            ...row,
            date_time: new Date(row.date_time),
            is_expense: Boolean(row.is_expense)
          }))
        };
      }
    } catch (error) {
      console.error('Error getting transactions:', error);
      return { success: false, error: error.message, transactions: [] };
    }
  }

  async getMonthlyAggregation(year = new Date().getFullYear()) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (Platform.OS === 'web') {
        const existingData = await AsyncStorage.getItem('transactions');
        const transactions = existingData ? JSON.parse(existingData) : [];
        
        const monthlyData = {};
        transactions
          .filter(t => t.is_expense && new Date(t.date_time).getFullYear() === year)
          .forEach(t => {
            const month = new Date(t.date_time).getMonth() + 1;
            if (!monthlyData[month]) {
              monthlyData[month] = { total_amount: 0, transaction_count: 0 };
            }
            monthlyData[month].total_amount += t.amount || 0;
            monthlyData[month].transaction_count += 1;
          });

        const result = Object.keys(monthlyData).map(month => ({
          month: parseInt(month),
          total_amount: monthlyData[month].total_amount,
          transaction_count: monthlyData[month].transaction_count,
          avg_amount: monthlyData[month].total_amount / monthlyData[month].transaction_count
        }));

        return { success: true, aggregation: result };
      } else {
        const query = `
          SELECT 
            strftime('%m', date_time) as month,
            SUM(amount) as total_amount,
            COUNT(*) as transaction_count,
            AVG(amount) as avg_amount
          FROM transactions 
          WHERE is_expense = 1 
          AND strftime('%Y', date_time) = ?
          GROUP BY strftime('%m', date_time)
          ORDER BY month
        `;

        const result = await this.db.getAllAsync(query, [year.toString()]);
        
        return {
          success: true,
          aggregation: result.map(row => ({
            month: parseInt(row.month),
            totalAmount: row.total_amount || 0,
            transactionCount: row.transaction_count || 0,
            avgAmount: row.avg_amount || 0
          }))
        };
      }
    } catch (error) {
      console.error('Error getting monthly aggregation:', error);
      return { success: false, error: error.message, aggregation: [] };
    }
  }

  async getCategoryAggregation(startDate, endDate) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (Platform.OS === 'web') {
        const existingData = await AsyncStorage.getItem('transactions');
        const transactions = existingData ? JSON.parse(existingData) : [];
        
        const categoryData = {};
        transactions
          .filter(t => {
            if (!t.is_expense) return false;
            const tDate = new Date(t.date_time);
            if (startDate && tDate < startDate) return false;
            if (endDate && tDate > endDate) return false;
            return true;
          })
          .forEach(t => {
            const category = t.category || 'Others';
            if (!categoryData[category]) {
              categoryData[category] = { total_amount: 0, transaction_count: 0 };
            }
            categoryData[category].total_amount += t.amount || 0;
            categoryData[category].transaction_count += 1;
          });

        const result = Object.keys(categoryData)
          .map(category => ({
            category,
            total_amount: categoryData[category].total_amount,
            transaction_count: categoryData[category].transaction_count
          }))
          .sort((a, b) => b.total_amount - a.total_amount);

        return { success: true, aggregation: result };
      } else {
        let query = `
          SELECT 
            category,
            SUM(amount) as total_amount,
            COUNT(*) as transaction_count
          FROM transactions 
          WHERE is_expense = 1
        `;
        let params = [];

        if (startDate) {
          query += ` AND date_time >= ?`;
          params.push(startDate.toISOString());
        }

        if (endDate) {
          query += ` AND date_time <= ?`;
          params.push(endDate.toISOString());
        }

        query += ` GROUP BY category ORDER BY total_amount DESC`;

        const result = await this.db.getAllAsync(query, params);
        
        return {
          success: true,
          aggregation: result.map(row => ({
            category: row.category || 'Others',
            totalAmount: row.total_amount || 0,
            transactionCount: row.transaction_count || 0
          }))
        };
      }
    } catch (error) {
      console.error('Error getting category aggregation:', error);
      return { success: false, error: error.message, aggregation: [] };
    }
  }

  async getModeAggregation(startDate, endDate) {
    // Similar implementation to getCategoryAggregation but for payment modes
    // Implementation details omitted for brevity - would follow same pattern
    try {
      // Placeholder implementation
      return { success: true, aggregation: [] };
    } catch (error) {
      console.error('Error getting mode aggregation:', error);
      return { success: false, error: error.message, aggregation: [] };
    }
  }

  async deleteTransaction(transactionId) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (Platform.OS === 'web') {
        const existingData = await AsyncStorage.getItem('transactions');
        const transactions = existingData ? JSON.parse(existingData) : [];
        const filteredTransactions = transactions.filter(t => t.id !== transactionId);
        await AsyncStorage.setItem('transactions', JSON.stringify(filteredTransactions));
        return { success: true };
      } else {
        await this.db.runAsync(
          'DELETE FROM transactions WHERE id = ?',
          [transactionId]
        );
        return { success: true };
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return { success: false, error: error.message };
    }
  }

  async updateTransaction(transactionId, updates) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const allowedFields = ['amount', 'category', 'mode', 'receiver', 'bank'];
      const updateFields = [];
      const values = [];

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          updateFields.push(`${key} = ?`);
          values.push(updates[key]);
        }
      });

      if (updateFields.length === 0) {
        return { success: false, error: 'No valid fields to update' };
      }

      if (Platform.OS === 'web') {
        const existingData = await AsyncStorage.getItem('transactions');
        const transactions = existingData ? JSON.parse(existingData) : [];
        const updatedTransactions = transactions.map(t => {
          if (t.id === transactionId) {
            return { ...t, ...updates, updated_at: new Date().toISOString() };
          }
          return t;
        });
        await AsyncStorage.setItem('transactions', JSON.stringify(updatedTransactions));
        return { success: true };
      } else {
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(transactionId);

        const query = `UPDATE transactions SET ${updateFields.join(', ')} WHERE id = ?`;
        await this.db.runAsync(query, values);
        return { success: true };
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new DatabaseService();