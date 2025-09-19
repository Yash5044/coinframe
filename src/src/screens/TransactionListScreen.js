import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Text, Searchbar, Card, Chip, Button } from 'react-native-paper';
import TransactionCard from '../components/TransactionCard';
import DatabaseService from '../services/DatabaseService';

const TransactionListScreen = ({ navigation }) => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    category: null,
    mode: null,
    bank: null
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, searchQuery, filters]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const result = await DatabaseService.getTransactions({
        limit: 100
      });

      if (result.success) {
        setTransactions(result.transactions);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(transaction =>
        transaction.sms_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (transaction.receiver && transaction.receiver.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (transaction.category && transaction.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (transaction.bank && transaction.bank.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply filters
    if (filters.category) {
      filtered = filtered.filter(transaction => transaction.category === filters.category);
    }
    if (filters.mode) {
      filtered = filtered.filter(transaction => transaction.mode === filters.mode);
    }
    if (filters.bank) {
      filtered = filtered.filter(transaction => transaction.bank === filters.bank);
    }

    setFilteredTransactions(filtered);
  };

  const clearFilters = () => {
    setFilters({ category: null, mode: null, bank: null });
    setSearchQuery('');
  };

  const getUniqueValues = (field) => {
    return [...new Set(transactions.map(t => t[field]).filter(Boolean))];
  };

  const handleTransactionPress = (transaction) => {
    // Navigation would be implemented for transaction details
    console.log('Transaction pressed:', transaction.id);
  };

  const handleEditTransaction = (transaction) => {
    console.log('Edit transaction:', transaction.id);
  };

  const handleDeleteTransaction = async (transaction) => {
    try {
      const result = await DatabaseService.deleteTransaction(transaction.id);
      if (result.success) {
        await loadTransactions();
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const renderTransaction = ({ item }) => (
    <TransactionCard
      transaction={item}
      onPress={() => handleTransactionPress(item)}
      onEdit={handleEditTransaction}
      onDelete={handleDeleteTransaction}
    />
  );

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading transactions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <Searchbar
        placeholder="Search transactions..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      {/* Filter chips */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Category:</Text>
          <View style={styles.chipContainer}>
            {getUniqueValues('category').slice(0, 3).map(category => (
              <Chip
                key={category}
                mode={filters.category === category ? 'flat' : 'outlined'}
                selected={filters.category === category}
                onPress={() => setFilters(prev => ({
                  ...prev,
                  category: prev.category === category ? null : category
                }))}
                style={styles.filterChip}
              >
                {category}
              </Chip>
            ))}
          </View>
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Mode:</Text>
          <View style={styles.chipContainer}>
            {getUniqueValues('mode').map(mode => (
              <Chip
                key={mode}
                mode={filters.mode === mode ? 'flat' : 'outlined'}
                selected={filters.mode === mode}
                onPress={() => setFilters(prev => ({
                  ...prev,
                  mode: prev.mode === mode ? null : mode
                }))}
                style={styles.filterChip}
              >
                {mode}
              </Chip>
            ))}
          </View>
        </View>

        {Object.values(filters).some(f => f !== null) && (
          <Button mode="outlined" onPress={clearFilters} style={styles.clearButton}>
            Clear Filters
          </Button>
        )}
      </View>

      {/* Summary card */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>
              {filteredTransactions.length} transactions
            </Text>
            <Text style={styles.summaryAmount}>
              Total: {formatAmount(totalAmount)}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Transaction list */}
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transactions found</Text>
            <Text style={styles.emptySubText}>
              {searchQuery || Object.values(filters).some(f => f !== null)
                ? 'Try adjusting your search or filters'
                : 'SMS messages will be processed automatically with T5 model'
              }
            </Text>
          </View>
        }
      />
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
  searchBar: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterRow: {
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C3E50',
    marginBottom: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  clearButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#46B7D1',
  },
  listContainer: {
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#95A5A6',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default TransactionListScreen;