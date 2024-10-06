import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { LoginScreen, RegisterScreen, ResetPasswordScreen, ForgotPassScreen , VerifyAccountScreen, ProfileScreen } from './screens/index'
const Stack = createStackNavigator()

function AuthNavigator() {
  return (
    <Stack.Navigator
    initialRouteName="LoginScreen"
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="LoginScreen" component={LoginScreen} />
    <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
    <Stack.Screen name="ResetPasswordScreen" component={ResetPasswordScreen} />
    <Stack.Screen name="VerifyAccountScreen" component={VerifyAccountScreen} />
    <Stack.Screen name="ForgotPassScreen" component={ForgotPassScreen} />
  </Stack.Navigator>
  )
}

export default AuthNavigator