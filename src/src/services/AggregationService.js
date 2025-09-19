import DatabaseService from './DatabaseService';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';

class AggregationService {
  constructor() {
    this.dbService = DatabaseService;
  }

  async getMonthlyExpenses(year = new Date().getFullYear()) {
    try {
      const result = await this.dbService.getMonthlyAggregation(year);
      
      if (result.success) {
        // Fill in missing months with zero values
        const monthlyData = [];
        for (let month = 1; month <= 12; month++) {
          const existing = result.aggregation.find(item => item.month === month);
          monthlyData.push({
            month: month,
            monthName: format(new Date(year, month - 1), 'MMM'),
            totalAmount: existing ? existing.totalAmount || existing.total_amount || 0 : 0,
            transactionCount: existing ? existing.transactionCount || existing.transaction_count || 0 : 0,
            avgAmount: existing ? existing.avgAmount || existing.avg_amount || 0 : 0
          });
        }
        
        return {
          success: true,
          year: year,
          monthlyExpenses: monthlyData,
          totalYearExpenses: monthlyData.reduce((sum, month) => sum + month.totalAmount, 0)
        };
      }
      
      return result;
    } catch (error) {
      console.error('Error getting monthly expenses:', error);
      return { success: false, error: error.message };
    }
  }

  async getCategoryBreakdown(period = 'current_month') {
    try {
      const { startDate, endDate } = this.getPeriodDates(period);
      const result = await this.dbService.getCategoryAggregation(startDate, endDate);
      
      if (result.success) {
        const total = result.aggregation.reduce((sum, cat) => sum + (cat.totalAmount || cat.total_amount || 0), 0);
        
        const categoryBreakdown = result.aggregation.map(category => ({
          category: category.category,
          totalAmount: category.totalAmount || category.total_amount || 0,
          transactionCount: category.transactionCount || category.transaction_count || 0,
          percentage: total > 0 ? (((category.totalAmount || category.total_amount || 0) / total) * 100).toFixed(1) : 0
        }));
        
        return {
          success: true,
          period: period,
          startDate: startDate,
          endDate: endDate,
          categories: categoryBreakdown,
          totalAmount: total
        };
      }
      
      return result;
    } catch (error) {
      console.error('Error getting category breakdown:', error);
      return { success: false, error: error.message };
    }
  }

  async getPaymentModeAnalysis(period = 'current_month') {
    try {
      const { startDate, endDate } = this.getPeriodDates(period);
      const result = await this.dbService.getModeAggregation(startDate, endDate);
      
      if (result.success) {
        const total = result.aggregation.reduce((sum, mode) => sum + (mode.totalAmount || mode.total_amount || 0), 0);
        
        const modeAnalysis = result.aggregation.map(mode => ({
          mode: mode.mode,
          totalAmount: mode.totalAmount || mode.total_amount || 0,
          transactionCount: mode.transactionCount || mode.transaction_count || 0,
          percentage: total > 0 ? (((mode.totalAmount || mode.total_amount || 0) / total) * 100).toFixed(1) : 0
        }));
        
        return {
          success: true,
          period: period,
          startDate: startDate,
          endDate: endDate,
          paymentModes: modeAnalysis,
          totalAmount: total
        };
      }
      
      return result;
    } catch (error) {
      console.error('Error getting payment mode analysis:', error);
      return { success: false, error: error.message };
    }
  }

  async getSpendingTrends(months = 6) {
    try {
      const trends = [];
      const currentDate = new Date();
      
      for (let i = months - 1; i >= 0; i--) {
        const monthDate = subMonths(currentDate, i);
        const startDate = startOfMonth(monthDate);
        const endDate = endOfMonth(monthDate);
        
        const transactions = await this.dbService.getTransactions({
          startDate: startDate,
          endDate: endDate
        });
        
        if (transactions.success) {
          const monthTotal = transactions.transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
          const monthCount = transactions.transactions.length;
          
          trends.push({
            month: format(monthDate, 'MMM yyyy'),
            monthKey: format(monthDate, 'yyyy-MM'),
            totalAmount: monthTotal,
            transactionCount: monthCount,
            avgTransaction: monthCount > 0 ? monthTotal / monthCount : 0
          });
        }
      }
      
      // Calculate month-over-month changes
      const trendsWithChanges = trends.map((current, index) => {
        if (index === 0) {
          return { ...current, changePercent: 0, changeAmount: 0 };
        }
        
        const previous = trends[index - 1];
        const changeAmount = current.totalAmount - previous.totalAmount;
        const changePercent = previous.totalAmount > 0 
          ? ((changeAmount / previous.totalAmount) * 100).toFixed(1)
          : 0;
        
        return {
          ...current,
          changeAmount: changeAmount,
          changePercent: parseFloat(changePercent)
        };
      });
      
      return {
        success: true,
        trends: trendsWithChanges,
        totalPeriodSpending: trends.reduce((sum, t) => sum + t.totalAmount, 0),
        avgMonthlySpending: trends.length > 0 
          ? trends.reduce((sum, t) => sum + t.totalAmount, 0) / trends.length 
          : 0
      };
    } catch (error) {
      console.error('Error getting spending trends:', error);
      return { success: false, error: error.message };
    }
  }

  async getBankwiseSpending(period = 'current_month') {
    try {
      const { startDate, endDate } = this.getPeriodDates(period);
      const transactions = await this.dbService.getTransactions({
        startDate: startDate,
        endDate: endDate
      });
      
      if (transactions.success) {
        const bankSpending = {};
        
        transactions.transactions.forEach(transaction => {
          const bank = transaction.bank || 'Others';
          if (!bankSpending[bank]) {
            bankSpending[bank] = {
              bank: bank,
              totalAmount: 0,
              transactionCount: 0,
              accounts: new Set()
            };
          }
          
          bankSpending[bank].totalAmount += transaction.amount || 0;
          bankSpending[bank].transactionCount += 1;
          if (transaction.account) {
            bankSpending[bank].accounts.add(transaction.account);
          }
        });
        
        const bankAnalysis = Object.values(bankSpending).map(bank => ({
          bank: bank.bank,
          totalAmount: bank.totalAmount,
          transactionCount: bank.transactionCount,
          accountCount: bank.accounts.size,
          avgTransaction: bank.transactionCount > 0 ? bank.totalAmount / bank.transactionCount : 0
        })).sort((a, b) => b.totalAmount - a.totalAmount);
        
        const total = bankAnalysis.reduce((sum, bank) => sum + bank.totalAmount, 0);
        
        return {
          success: true,
          period: period,
          bankAnalysis: bankAnalysis.map(bank => ({
            ...bank,
            percentage: total > 0 ? ((bank.totalAmount / total) * 100).toFixed(1) : 0
          })),
          totalAmount: total
        };
      }
      
      return transactions;
    } catch (error) {
      console.error('Error getting bankwise spending:', error);
      return { success: false, error: error.message };
    }
  }

  async getExpenseSummary(period = 'current_month') {
    try {
      const { startDate, endDate } = this.getPeriodDates(period);
      const transactions = await this.dbService.getTransactions({
        startDate: startDate,
        endDate: endDate
      });
      
      if (transactions.success) {
        const summary = {
          totalExpenses: transactions.transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
          transactionCount: transactions.transactions.length,
          avgTransaction: 0,
          highestTransaction: 0,
          lowestTransaction: 0,
          topCategory: '',
          topPaymentMode: ''
        };
        
        if (summary.transactionCount > 0) {
          const amounts = transactions.transactions.map(t => t.amount || 0);
          summary.avgTransaction = summary.totalExpenses / summary.transactionCount;
          summary.highestTransaction = Math.max(...amounts);
          summary.lowestTransaction = Math.min(...amounts.filter(a => a > 0));
          
          // Find top category
          const categories = {};
          transactions.transactions.forEach(t => {
            const cat = t.category || 'Others';
            categories[cat] = (categories[cat] || 0) + (t.amount || 0);
          });
          summary.topCategory = Object.keys(categories).reduce((a, b) => 
            categories[a] > categories[b] ? a : b, 'Others');
          
          // Find top payment mode
          const modes = {};
          transactions.transactions.forEach(t => {
            const mode = t.mode || 'Others';
            modes[mode] = (modes[mode] || 0) + (t.amount || 0);
          });
          summary.topPaymentMode = Object.keys(modes).reduce((a, b) => 
            modes[a] > modes[b] ? a : b, 'Others');
        }
        
        return {
          success: true,
          period: period,
          startDate: startDate,
          endDate: endDate,
          summary: summary
        };
      }
      
      return transactions;
    } catch (error) {
      console.error('Error getting expense summary:', error);
      return { success: false, error: error.message };
    }
  }

  getPeriodDates(period) {
    const now = new Date();
    
    switch (period) {
      case 'current_month':
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now)
        };
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        return {
          startDate: startOfMonth(lastMonth),
          endDate: endOfMonth(lastMonth)
        };
      case 'last_3_months':
        return {
          startDate: startOfMonth(subMonths(now, 2)),
          endDate: endOfMonth(now)
        };
      case 'last_6_months':
        return {
          startDate: startOfMonth(subMonths(now, 5)),
          endDate: endOfMonth(now)
        };
      case 'current_year':
        return {
          startDate: new Date(now.getFullYear(), 0, 1),
          endDate: new Date(now.getFullYear(), 11, 31)
        };
      default:
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now)
        };
    }
  }
}

export default new AggregationService();