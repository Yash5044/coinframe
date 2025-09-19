import * as SMS from 'expo-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SMSService {
  constructor() {
    this.isInitialized = false;
    this.mockMessages = [
      {
        id: '1',
        body: 'ICICI Bank: INR 904.00 spent on Credit Card XX7003 at AMAZON on 19-Sep-25. Available Limit: INR 45,096. Call 18002662 to report fraud.',
        date: new Date('2025-09-19'),
        sender: 'ICICIB'
      },
      {
        id: '2', 
        body: 'HDFC Bank: Rs 2,450.00 debited from A/c XX8901 on 18-Sep-25 via UPI to SWIGGY. Avl Bal: Rs 12,340.50',
        date: new Date('2025-09-18'),
        sender: 'HDFCBK'
      },
      {
        id: '3',
        body: 'SBI: Rs 150.00 debited from Savings A/c XX4567 for ATM Cash Withdrawal at HDFC ATM on 17-Sep-25. Avl Bal Rs 8,456.75',
        date: new Date('2025-09-17'),
        sender: 'SBIINB'
      },
      {
        id: '4',
        body: 'Axis Bank: INR 1,200.00 spent via Debit Card XX2345 at RELIANCE FRESH on 16-Sep-25. Avl Bal: INR 15,678.90',
        date: new Date('2025-09-16'),
        sender: 'AXISBK'
      },
      {
        id: '5',
        body: 'Paytm: Rs 350.00 paid to UBER INDIA via Paytm Wallet on 15-Sep-25. Wallet Balance: Rs 1,250.00',
        date: new Date('2025-09-15'),
        sender: 'PAYTM'
      }
    ];
  }

  async initialize() {
    try {
      // Check if SMS permission is available (mock implementation)
      const isAvailable = await SMS.isAvailableAsync();
      
      if (!isAvailable) {
        console.log('SMS not available on this device - using mock data');
      }
      
      this.isInitialized = true;
      return { success: true, hasPermission: true };
    } catch (error) {
      console.error('Error initializing SMS service:', error);
      return { success: false, error: error.message };
    }
  }

  async requestPermissions() {
    // Mock permission request - in real app this would request actual SMS permissions
    try {
      await AsyncStorage.setItem('sms_permission_granted', 'true');
      return { granted: true };
    } catch (error) {
      console.error('Error requesting SMS permissions:', error);
      return { granted: false, error: error.message };
    }
  }

  async checkPermissions() {
    try {
      const permission = await AsyncStorage.getItem('sms_permission_granted');
      return { granted: permission === 'true' };
    } catch (error) {
      console.error('Error checking SMS permissions:', error);
      return { granted: false, error: error.message };
    }
  }

  async getMessages(filter = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // In a real app, this would read actual SMS messages
      // For now, we'll use mock data that simulates bank SMS messages
      let messages = [...this.mockMessages];

      // Apply filters
      if (filter.startDate) {
        messages = messages.filter(msg => msg.date >= filter.startDate);
      }
      
      if (filter.endDate) {
        messages = messages.filter(msg => msg.date <= filter.endDate);
      }
      
      if (filter.sender) {
        messages = messages.filter(msg => 
          msg.sender.toLowerCase().includes(filter.sender.toLowerCase())
        );
      }

      // Filter for potential transaction messages
      const transactionKeywords = [
        'spent', 'debited', 'withdrawn', 'paid', 'credited', 
        'balance', 'transaction', 'rupees', 'rs', 'inr', 
        'bank', 'card', 'upi', 'atm'
      ];
      
      const potentialTransactions = messages.filter(msg => {
        const body = msg.body.toLowerCase();
        return transactionKeywords.some(keyword => body.includes(keyword));
      });

      return {
        success: true,
        messages: potentialTransactions,
        total: potentialTransactions.length
      };
    } catch (error) {
      console.error('Error getting messages:', error);
      return { success: false, error: error.message, messages: [] };
    }
  }

  async addMockMessage(messageData) {
    try {
      const newMessage = {
        id: Date.now().toString(),
        body: messageData.body,
        date: new Date(messageData.date || Date.now()),
        sender: messageData.sender || 'BANK'
      };
      
      this.mockMessages.unshift(newMessage);
      return { success: true, message: newMessage };
    } catch (error) {
      console.error('Error adding mock message:', error);
      return { success: false, error: error.message };
    }
  }

  // Simulate real-time SMS monitoring
  startMonitoring(callback) {
    // In a real app, this would listen for new SMS messages
    // For simulation, we'll occasionally trigger with new messages
    console.log('SMS monitoring started (simulation mode)');
    
    const interval = setInterval(() => {
      // Randomly generate a new transaction message every 30 seconds
      if (Math.random() > 0.7) {
        const mockNewMessage = {
          id: Date.now().toString(),
          body: 'New transaction detected: Rs 250.00 spent at COFFEE SHOP',
          date: new Date(),
          sender: 'MOCKBANK'
        };
        
        this.mockMessages.unshift(mockNewMessage);
        if (callback) {
          callback(mockNewMessage);
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }
}

export default new SMSService();