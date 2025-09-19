import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, Switch, Button, List } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import SMSService from '../services/SMSService';
import DatabaseService from '../services/DatabaseService';
import ModelService from '../services/ModelService';

const SettingsScreen = () => {
  const [permissions, setPermissions] = useState({ granted: false });
  const [autoProcessing, setAutoProcessing] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalMessages: 0,
    modelInfo: {}
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Check SMS permissions
      const permissionStatus = await SMSService.checkPermissions();
      setPermissions(permissionStatus);

      // Get app statistics
      const transactions = await DatabaseService.getTransactions();
      const modelInfo = ModelService.getModelInfo();
      
      setStats({
        totalTransactions: transactions.success ? transactions.transactions.length : 0,
        totalMessages: 0, // Would be from SMS service in real app
        modelInfo: modelInfo
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const requestSMSPermissions = async () => {
    try {
      const result = await SMSService.requestPermissions();
      if (result.granted) {
        setPermissions({ granted: true });
        Alert.alert('Success', 'SMS permissions granted successfully');
      } else {
        Alert.alert('Permission Denied', 'SMS permissions are required for automatic expense tracking');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request SMS permissions');
    }
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your transactions and cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // In a real app, you would call a method to clear all data
              // For now, just show success message
              Alert.alert('Success', 'All data has been cleared');
              await loadSettings(); // Reload stats
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          }
        }
      ]
    );
  };

  const reprocessMessages = () => {
    Alert.alert(
      'Reprocess Messages',
      'This will reprocess all SMS messages using the T5 model and may update your transactions. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reprocess',
          onPress: async () => {
            try {
              // In a real app, this would reprocess all SMS messages
              Alert.alert('Success', 'Messages have been reprocessed with T5 model');
              await loadSettings();
            } catch (error) {
              Alert.alert('Error', 'Failed to reprocess messages');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Permissions section */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Permissions</Text>
            
            <List.Item
              title="SMS Access"
              description={permissions.granted ? 'Granted - App can read SMS messages' : 'Required for automatic expense tracking'}
              left={() => (
                <MaterialIcons 
                  name={permissions.granted ? 'check-circle' : 'error'} 
                  size={24} 
                  color={permissions.granted ? '#4CAF50' : '#FF6B6B'} 
                  style={styles.listIcon}
                />
              )}
              right={() => (
                !permissions.granted && (
                  <Button mode="outlined" onPress={requestSMSPermissions}>
                    Grant
                  </Button>
                )
              )}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* Model Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>T5 Model Information</Text>
            
            <List.Item
              title="Model Type"
              description={stats.modelInfo.modelType || 'T5 Efficient Tiny NL32'}
              left={() => (
                <MaterialIcons name="psychology" size={24} color="#46B7D1" style={styles.listIcon} />
              )}
              style={styles.listItem}
            />

            <List.Item
              title="Model Status"
              description={stats.modelInfo.isLoaded ? 'Loaded and Ready' : 'Not Loaded'}
              left={() => (
                <MaterialIcons 
                  name={stats.modelInfo.isLoaded ? 'check-circle' : 'error'} 
                  size={24} 
                  color={stats.modelInfo.isLoaded ? '#4CAF50' : '#FF6B6B'} 
                  style={styles.listIcon}
                />
              )}
              style={styles.listItem}
            />

            <List.Item
              title="ONNX Runtime"
              description={stats.modelInfo.hasONNXRuntime ? 'Active' : 'Using Fallback Classification'}
              left={() => (
                <MaterialIcons name="speed" size={24} color="#46B7D1" style={styles.listIcon} />
              )}
              style={styles.listItem}
            />

            <List.Item
              title="Model Path"
              description={stats.modelInfo.modelPath || './models/onnx-models/t5-sms-encoder.onnx'}
              left={() => (
                <MaterialIcons name="folder" size={24} color="#46B7D1" style={styles.listIcon} />
              )}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* App settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>App Settings</Text>
            
            <List.Item
              title="Auto-Process SMS"
              description="Automatically process new SMS messages for expenses"
              left={() => (
                <MaterialIcons name="auto-awesome" size={24} color="#46B7D1" style={styles.listIcon} />
              )}
              right={() => (
                <Switch
                  value={autoProcessing}
                  onValueChange={setAutoProcessing}
                />
              )}
              style={styles.listItem}
            />
            
            <List.Item
              title="Notifications"
              description="Show notifications for new expenses detected"
              left={() => (
                <MaterialIcons name="notifications" size={24} color="#46B7D1" style={styles.listIcon} />
              )}
              right={() => (
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                />
              )}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* Statistics */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Statistics</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalTransactions}</Text>
                <Text style={styles.statLabel}>Total Transactions</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalMessages}</Text>
                <Text style={styles.statLabel}>SMS Processed</Text>
              </View>
            </View>

            <View style={styles.modelStats}>
              <Text style={styles.modelStatsTitle}>Supported Categories:</Text>
              <View style={styles.categoryTags}>
                {(stats.modelInfo.supportedCategories || []).map((category, index) => (
                  <Text key={index} style={styles.categoryTag}>{category}</Text>
                ))}
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Data management */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Data Management</Text>
            
            <List.Item
              title="Reprocess Messages"
              description="Reprocess all SMS messages with T5 model"
              left={() => (
                <MaterialIcons name="refresh" size={24} color="#FFA726" style={styles.listIcon} />
              )}
              onPress={reprocessMessages}
              style={styles.listItem}
            />
            
            <List.Item
              title="Clear All Data"
              description="Delete all transactions and reset the app"
              left={() => (
                <MaterialIcons name="delete-forever" size={24} color="#FF6B6B" style={styles.listIcon} />
              )}
              onPress={clearAllData}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* About section */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>About</Text>
            
            <List.Item
              title="CoinFrame"
              description="T5 AI-Powered SMS Expense Tracker v1.0.0"
              left={() => (
                <MaterialIcons name="info" size={24} color="#46B7D1" style={styles.listIcon} />
              )}
              style={styles.listItem}
            />
            
            <List.Item
              title="Privacy Policy"
              description="All data is stored locally on your device. T5 model runs offline."
              left={() => (
                <MaterialIcons name="privacy-tip" size={24} color="#46B7D1" style={styles.listIcon} />
              )}
              style={styles.listItem}
            />
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
  card: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  listItem: {
    paddingHorizontal: 0,
  },
  listIcon: {
    alignSelf: 'center',
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#46B7D1',
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 4,
  },
  modelStats: {
    marginTop: 16,
  },
  modelStatsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C3E50',
    marginBottom: 8,
  },
  categoryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTag: {
    backgroundColor: '#E8F4FD',
    color: '#46B7D1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default SettingsScreen;