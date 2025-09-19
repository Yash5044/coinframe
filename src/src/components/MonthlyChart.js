import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Card } from 'react-native-paper';

const screenWidth = Dimensions.get('window').width;

const MonthlyChart = ({ data, title = "Monthly Expenses", type = "line" }) => {
  if (!data || data.length === 0) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No data available</Text>
          </View>
        </Card.Content>
      </Card>
    );
  }

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(70, 183, 209, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#46B7D1',
    },
    propsForBackgroundLines: {
      strokeDasharray: '', // solid background lines
      stroke: '#e3e3e3',
      strokeWidth: 1,
    },
  };

  // Prepare chart data
  const chartData = {
    labels: data.map(item => item.monthName || item.month || ''),
    datasets: [
      {
        data: data.map(item => item.totalAmount || 0),
        color: (opacity = 1) => `rgba(70, 183, 209, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const formatYLabel = (value) => {
    if (value >= 10000000) {
      return `${(value / 10000000).toFixed(1)}Cr`;
    } else if (value >= 100000) {
      return `${(value / 100000).toFixed(1)}L`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalExpenses = data.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
  const avgExpenses = totalExpenses / data.length;
  const maxExpense = Math.max(...data.map(item => item.totalAmount || 0));
  const maxExpenseMonth = data.find(item => (item.totalAmount || 0) === maxExpense);

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.title}>{title}</Text>
        
        {/* Summary stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatAmount(totalExpenses)}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatAmount(avgExpenses)}</Text>
            <Text style={styles.statLabel}>Average</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatAmount(maxExpense)}</Text>
            <Text style={styles.statLabel}>Highest</Text>
          </View>
        </View>

        {/* Chart */}
        <View style={styles.chartContainer}>
          {type === 'line' ? (
            <LineChart
              data={chartData}
              width={screenWidth - 80}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              formatYLabel={formatYLabel}
              yAxisSuffix=""
              yAxisInterval={1}
              withInnerLines={true}
              withOuterLines={true}
              withHorizontalLabels={true}
              withVerticalLabels={true}
            />
          ) : (
            <BarChart
              data={chartData}
              width={screenWidth - 80}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              formatYLabel={formatYLabel}
              yAxisSuffix=""
              showValuesOnTopOfBars={true}
              withInnerLines={true}
            />
          )}
        </View>

        {/* Additional insights */}
        {maxExpenseMonth && (
          <View style={styles.insightContainer}>
            <Text style={styles.insightText}>
              Highest spending was in {maxExpenseMonth.monthName || maxExpenseMonth.month} 
              with {formatAmount(maxExpense)}
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    elevation: 4,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  emptyText: {
    fontSize: 16,
    color: '#7F8C8D',
    fontStyle: 'italic',
  },
  insightContainer: {
    backgroundColor: '#E8F4FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#2C3E50',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default MonthlyChart;