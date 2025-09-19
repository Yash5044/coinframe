import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import TransactionListScreen from './src/screens/TransactionListScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

// Custom theme
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#46B7D1',
    accent: '#FFA726',
    surface: '#FFFFFF',
    background: '#F5F5F5',
  },
};

const getTabIcon = (routeName, focused, color, size) => {
  let iconName;

  switch (routeName) {
    case 'Home':
      iconName = focused ? 'dashboard' : 'dashboard';
      break;
    case 'Transactions':
      iconName = focused ? 'list' : 'list';
      break;
    case 'Analytics':
      iconName = focused ? 'analytics' : 'analytics';
      break;
    case 'Settings':
      iconName = focused ? 'settings' : 'settings';
      break;
    default:
      iconName = 'circle';
  }

  return <MaterialIcons name={iconName} size={size} color={color} />;
};

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => 
              getTabIcon(route.name, focused, color, size),
            tabBarActiveTintColor: '#46B7D1',
            tabBarInactiveTintColor: '#7F8C8D',
            tabBarStyle: {
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: '#ECF0F1',
              elevation: 8,
              height: 60,
              paddingBottom: 8,
              paddingTop: 8,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '500',
            },
            headerStyle: {
              backgroundColor: '#46B7D1',
              elevation: 4,
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
            },
          })}
        >
          <Tab.Screen 
            name="Home" 
            component={HomeScreen}
            options={{
              title: 'CoinFrame',
              headerTitle: 'SMS Expense Tracker',
            }}
          />
          <Tab.Screen 
            name="Transactions" 
            component={TransactionListScreen}
            options={{
              title: 'Transactions',
              headerTitle: 'All Transactions',
            }}
          />
          <Tab.Screen 
            name="Analytics" 
            component={AnalyticsScreen}
            options={{
              title: 'Analytics',
              headerTitle: 'Expense Analytics',
            }}
          />
          <Tab.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{
              title: 'Settings',
              headerTitle: 'App Settings',
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}