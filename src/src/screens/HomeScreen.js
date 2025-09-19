import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card, Button, FAB, Chip } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import SMSService from '../services/SMSService';
import ModelService from '../services/ModelService';
import DatabaseService from '../services/DatabaseService';
import AggregationService from '../services/AggregationService';

const HomeScreen = ({ navigation }) => {
  const [summary, setSummary] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasProcessedSMS, setHasProcessedSMS] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      
      // Initialize services
      await DatabaseService.initialize();
      await SMSService.initialize();
      await ModelService.loadModel();
      
      // Check if we have processed SMS messages already
      const existingTransactions = await DatabaseService.getTransactions({ limit: 1 });
      
      if (existingTransactions.success && existingTransactions.transactions.length === 0) {
        // Process initial SMS messages
        await processInitialSMS();
      }
      
      // Load summary
      await loadSummary();
      setHasProcessedSMS(true);
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processInitialSMS = async () => {
    try {
      // Get SMS messages
      const smsResult = await SMSService.getMessages();
      
      if (smsResult.success && smsResult.messages.length > 0) {
        // Classify messages using model
        const classificationResult = await ModelService.batchClassify(smsResult.messages);
        
        if (classificationResult.success) {
          // Save classified transactions to database
          const transactions = classificationResult.results
            .filter(result => result.classification.IsExpense === 'Yes')
            .map(result => ({
              messageId: result.messageId,
              smsText: result.smsText,
              dateTime: result.date,
              sender: result.sender,
              classification: result.classification
            }));
          
          await DatabaseService.batchSaveTransactions(transactions);
        }
      }
    } catch (error) {
      console.error('Error processing initial SMS:', error);
    }
  };

  const loadSummary = async () => {
    try {
      const [summaryResult, categoryResult, monthlyResult] = await Promise.all([
        AggregationService.getExpenseSummary('current_month'),
        AggregationService.getCategoryBreakdown('current_month'),
        AggregationService.getMonthlyExpenses(new Date().getFullYear())
      ]);

      const summaryData = {
        currentMonth: summaryResult.success ? summaryResult.summary : {},
        topCategories: categoryResult.success ? categoryResult.categories.slice(0, 3) : [],
        monthlyData: monthlyResult.success ? monthlyResult.monthlyExpenses : []
      };

      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSummary();
    setRefreshing(false);
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getCurrentMonth = () => {
    return new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Initializing CoinFrame SMS Tracker...</Text>
        <Text style={styles.loadingSubText}>Setting up T5 model and processing messages</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome header */}
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <View style={styles.welcomeHeader}>
              <MaterialIcons name="account-balance-wallet" size={40} color="#46B7D1" />
              <View style={styles.welcomeText}>
                <Text style={styles.welcomeTitle}>CoinFrame</Text>
                <Text style={styles.welcomeSubtitle}>
                  {hasProcessedSMS ? 'SMS expenses tracked with T5 AI' : 'Loading T5 model...'}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Current month summary */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{getCurrentMonth()} Summary</Text>
            
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {formatAmount(summary.currentMonth?.totalExpenses)}
                </Text>
                <Text style={styles.summaryLabel}>Total Spent</Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {summary.currentMonth?.transactionCount || 0}
                </Text>
                <Text style={styles.summaryLabel}>Transactions</Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {formatAmount(summary.currentMonth?.avgTransaction)}
                </Text>
                <Text style={styles.summaryLabel}>Average</Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {formatAmount(summary.currentMonth?.highestTransaction)}
                </Text>
                <Text style={styles.summaryLabel}>Highest</Text>
              </View>
            </View>

            {summary.currentMonth?.topCategory && (
              <View style={styles.topCategoryContainer}>
                <Text style={styles.topCategoryLabel}>Top Category:</Text>
                <Chip mode="outlined" style={styles.topCategoryChip}>
                  {summary.currentMonth.topCategory}
                </Chip>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Top categories */}
        {summary.topCategories && summary.topCategories.length > 0 && (
          <Card style={styles.categoriesCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Top Spending Categories</Text>
              {summary.topCategories.map((category, index) => (
                <View key={index} style={styles.categoryItem}>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{category.category}</Text>
                    <Text style={styles.categoryCount}>
                      {category.transactionCount} transactions
                    </Text>
                  </View>
                  <View style={styles.categoryAmount}>
                    <Text style={styles.categoryValue}>
                      {formatAmount(category.totalAmount)}
                    </Text>
                    <Text style={styles.categoryPercentage}>
                      {category.percentage}%
                    </Text>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Quick actions */}
        <Card style={styles.actionsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Transactions')}
                style={styles.actionButton}
                icon="format-list-bulleted"
              >
                View All Transactions
              </Button>
              
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Analytics')}
                style={styles.actionButton}
                icon="chart-line"
              >
                View Analytics
              </Button>
              
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('Settings')}
                style={styles.actionButton}
                icon="cog"
              >
                Settings & Model Info
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  loadingSubText: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  welcomeCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    marginLeft: 16,
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 4,
  },
  summaryCard: {
    margin: 16,
    marginTop: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#46B7D1',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 4,
  },
  topCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  topCategoryLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginRight: 8,
  },
  topCategoryChip: {
    backgroundColor: '#E8F4FD',
  },
  categoriesCard: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
  },
  categoryCount: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#46B7D1',
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  actionsCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 100,
    elevation: 2,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
});

export default HomeScreen;