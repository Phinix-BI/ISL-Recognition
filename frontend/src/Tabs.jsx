import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import TranslatorNavigator from './TranslatorNavigator';
import ChatingNavigator from './ChatingNavigator';
import ProfileScreen from './screens/ProfileScreen';



const Tab = createBottomTabNavigator();

function Tabs() {
  return (
    <Tab.Navigator >
   
    <Tab.Screen name="Translator" component={TranslatorNavigator} screenOptions={{ headerShown: false }} options={{
      tabBarLabel: 'Translator',
      tabBarIcon: ({ color, size }) => (
        <MaterialIcons name="translate" color={color} size={size} />
      ),
      headerShown: false
    }} />
    <Tab.Screen name="Call" component={ChatingNavigator} options={{
      tabBarLabel: 'Call',
      tabBarIcon: ({ color, size }) => (
        <MaterialIcons name="phone" color={color} size={size} />
      ),
      headerShown: false
    }} />
    <Tab.Screen name="Account" component={LoginScreen} options={{
      tabBarLabel: 'Account',
      tabBarIcon: ({ color, size }) => (
        <MaterialIcons name="account-circle" color={color} size={size} />
      ),
      headerShown: false
    }} />
  </Tab.Navigator>
  )
}

export default Tabs;