import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card, SegmentedButtons, Button } from 'react-native-paper';
import CategoryChart from '../components/CategoryChart';
import MonthlyChart from '../components/MonthlyChart';
import AggregationService from '../services/AggregationService';

const AnalyticsScreen = () => {
  const [period, setPeriod] = useState('current_month');
  const [chartType, setChartType] = useState('line');
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [modeData, setModeData] = useState([]);
  const [bankData, setBankData] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      const [
        summaryResult,
        categoryResult,
        monthlyResult,
        modeResult,
        bankResult
      ] = await Promise.all([
        AggregationService.getExpenseSummary(period),
        AggregationService.getCategoryBreakdown(period),
        AggregationService.getMonthlyExpenses(new Date().getFullYear()),
        AggregationService.getPaymentModeAnalysis(period),
        AggregationService.getBankwiseSpending(period)
      ]);

      if (summaryResult.success) setSummary(summaryResult.summary);
      if (categoryResult.success) setCategoryData(categoryResult.categories);
      if (monthlyResult.success) setMonthlyData(monthlyResult.monthlyExpenses);
      if (modeResult.success) setModeData(modeResult.paymentModes);
      if (bankResult.success) setBankData(bankResult.bankAnalysis);
      
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
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

  const getPeriodLabel = () => {
    switch (period) {
      case 'current_month': return 'This Month';
      case 'last_month': return 'Last Month';
      case 'last_3_months': return 'Last 3 Months';
      case 'last_6_months': return 'Last 6 Months';
      case 'current_year': return 'This Year';
      default: return 'This Month';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading T5 analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Period selector */}
        <Card style={styles.selectorCard}>
          <Card.Content>
            <Text style={styles.selectorTitle}>Analysis Period</Text>
            <SegmentedButtons
              value={period}
              onValueChange={setPeriod}
              buttons={[
                { value: 'current_month', label: 'This Month' },
                { value: 'last_3_months', label: '3 Months' },
                { value: 'current_year', label: 'Year' },
              ]}
              style={styles.segmentedButtons}
            />
          </Card.Content>
        </Card>

        {/* Summary stats */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>{getPeriodLabel()} T5 Analytics</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatAmount(summary.totalExpenses)}</Text>
                <Text style={styles.statLabel}>Total Spent</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{summary.transactionCount || 0}</Text>
                <Text style={styles.statLabel}>Transactions</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatAmount(summary.avgTransaction)}</Text>
                <Text style={styles.statLabel}>Average</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatAmount(summary.highestTransaction)}</Text>
                <Text style={styles.statLabel}>Highest</Text>
              </View>
            </View>

            {summary.topCategory && (
              <View style={styles.insightContainer}>
                <Text style={styles.insightLabel}>Top spending category (T5 classified):</Text>
                <Text style={styles.insightValue}>{summary.topCategory}</Text>
              </View>
            )}
            
            {summary.topPaymentMode && (
              <View style={styles.insightContainer}>
                <Text style={styles.insightLabel}>Preferred payment method:</Text>
                <Text style={styles.insightValue}>{summary.topPaymentMode}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Monthly trend chart */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <View style={styles.chartHeader}>
              <Text style={styles.cardTitle}>Monthly Spending Trend</Text>
              <SegmentedButtons
                value={chartType}
                onValueChange={setChartType}
                buttons={[
                  { value: 'line', label: 'Line' },
                  { value: 'bar', label: 'Bar' },
                ]}
                style={styles.chartTypeSelector}
              />
            </View>
          </Card.Content>
        </Card>
        
        <MonthlyChart 
          data={monthlyData.filter(m => m.totalAmount > 0)} 
          title="Monthly Expenses (T5 Processed)"
          type={chartType}
        />

        {/* Category breakdown */}
        <CategoryChart 
          data={categoryData} 
          title={`${getPeriodLabel()} - T5 Category Classification`}
        />

        {/* Payment mode breakdown */}
        <CategoryChart 
          data={modeData.map(mode => ({ ...mode, category: mode.mode }))} 
          title={`${getPeriodLabel()} - Payment Methods`}
        />

        {/* Bank-wise spending */}
        {bankData.length > 0 && (
          <Card style={styles.bankCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Bank-wise Analysis</Text>
              {bankData.map((bank, index) => (
                <View key={index} style={styles.bankItem}>
                  <View style={styles.bankInfo}>
                    <Text style={styles.bankName}>{bank.bank}</Text>
                    <Text style={styles.bankDetails}>
                      {bank.transactionCount} transactions • {bank.accountCount} accounts
                    </Text>
                  </View>
                  <View style={styles.bankAmount}>
                    <Text style={styles.bankValue}>{formatAmount(bank.totalAmount)}</Text>
                    <Text style={styles.bankPercentage}>{bank.percentage}%</Text>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* T5 Model info */}
        <Card style={styles.exportCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>T5 Model Performance</Text>
            <Text style={styles.exportDescription}>
              Transactions classified using T5 Efficient Tiny NL32 with 87.7% size reduction
            </Text>
            
            <View style={styles.exportButtons}>
              <Button 
                mode="outlined" 
                style={styles.exportButton}
                onPress={() => {/* TODO: Implement CSV export */}}
              >
                Export Analysis
              </Button>
              
              <Button 
                mode="outlined" 
                style={styles.exportButton}
                onPress={() => {/* TODO: Implement model report */}}
              >
                Model Report
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  segmentedButtons: {
    backgroundColor: '#F8F9FA',
  },
  statsCard: {
    margin: 16,
    marginTop: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#46B7D1',
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 4,
  },
  insightContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    padding: 12,
    backgroundColor: '#E8F4FD',
    borderRadius: 8,
  },
  insightLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    flex: 1,
  },
  insightValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  chartCard: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartTypeSelector: {
    backgroundColor: '#F8F9FA',
    flexShrink: 1,
  },
  bankCard: {
    margin: 16,
    elevation: 2,
  },
  bankItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
  },
  bankDetails: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  bankAmount: {
    alignItems: 'flex-end',
  },
  bankValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#46B7D1',
  },
  bankPercentage: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  exportCard: {
    margin: 16,
    marginBottom: 32,
    elevation: 2,
  },
  exportDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 16,
  },
  exportButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  exportButton: {
    flex: 1,
  },
});

export default AnalyticsScreen;