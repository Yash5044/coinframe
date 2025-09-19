import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Chip, IconButton } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';

const TransactionCard = ({ transaction, onPress, onEdit, onDelete }) => {
  const getCategoryIcon = (category) => {
    const iconMap = {
      'Shopping': 'shopping-cart',
      'Food': 'restaurant',
      'Transport': 'directions-car',
      'Entertainment': 'movie',
      'Healthcare': 'local-hospital',
      'Utilities': 'electrical-services',
      'Cash': 'atm',
      'Others': 'category'
    };
    return iconMap[category] || 'category';
  };

  const getModeColor = (mode) => {
    const colorMap = {
      'Credit Card': '#FF6B6B',
      'Debit Card': '#4ECDC4',
      'Online': '#45B7D1',
      'Cash': '#96CEB4'
    };
    return colorMap[mode] || '#95A5A6';
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card style={styles.card} mode="outlined">
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Card.Content style={styles.content}>
          {/* Header with amount and category icon */}
          <View style={styles.header}>
            <View style={styles.amountContainer}>
              <Text style={styles.amount}>{formatAmount(transaction.amount)}</Text>
              <Text style={styles.date}>
                {format(new Date(transaction.date_time), 'MMM dd, yyyy')}
              </Text>
            </View>
            <MaterialIcons
              name={getCategoryIcon(transaction.category)}
              size={32}
              color={getModeColor(transaction.mode)}
            />
          </View>

          {/* Transaction details */}
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Category:</Text>
              <Chip 
                mode="outlined" 
                compact
                style={[styles.chip, { borderColor: getModeColor(transaction.mode) }]}
                textStyle={{ color: getModeColor(transaction.mode) }}
              >
                {transaction.category || 'Others'}
              </Chip>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Payment:</Text>
              <Chip 
                mode="outlined" 
                compact
                style={[styles.chip, { borderColor: getModeColor(transaction.mode) }]}
                textStyle={{ color: getModeColor(transaction.mode) }}
              >
                {transaction.mode || 'Others'}
              </Chip>
            </View>

            {transaction.receiver && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Merchant:</Text>
                <Text style={styles.value}>{transaction.receiver}</Text>
              </View>
            )}

            {transaction.bank && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Bank:</Text>
                <Text style={styles.value}>
                  {transaction.bank} {transaction.account ? `(${transaction.account})` : ''}
                </Text>
              </View>
            )}
          </View>

          {/* SMS text preview */}
          <View style={styles.smsContainer}>
            <Text style={styles.smsLabel}>Original SMS (T5 Processed):</Text>
            <Text style={styles.smsText} numberOfLines={2}>
              {transaction.sms_text}
            </Text>
          </View>
        </Card.Content>
      </TouchableOpacity>

      {/* Action buttons */}
      <Card.Actions style={styles.actions}>
        <View style={styles.actionButtons}>
          {onEdit && (
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => onEdit(transaction)}
              iconColor="#666"
            />
          )}
          {onDelete && (
            <IconButton
              icon="delete"
              size={20}
              onPress={() => onDelete(transaction)}
              iconColor="#FF6B6B"
            />
          )}
        </View>
      </Card.Actions>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
    backgroundColor: 'white',
  },
  content: {
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  amountContainer: {
    flex: 1,
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 2,
  },
  date: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  details: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '500',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  chip: {
    height: 28,
    backgroundColor: 'transparent',
  },
  smsContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  smsLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '600',
    marginBottom: 4,
  },
  smsText: {
    fontSize: 13,
    color: '#34495E',
    lineHeight: 18,
  },
  actions: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flex: 1,
  },
});

export default TransactionCard;