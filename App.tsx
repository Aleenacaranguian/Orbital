// App.tsx
import { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { supabase } from './lib/supabase'
import { Session } from '@supabase/supabase-js'
import Auth from './components/Auth'
import Home from './components/Home'
import { Ionicons } from '@expo/vector-icons'

const Tab = createBottomTabNavigator()

export default function App() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  if (!session) {
    return <Auth />
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName

            if (route.name === 'Home') {
              iconName = 'person-circle-outline'
            } else if (route.name === 'Search') {
              iconName = 'search-outline'
            } else if (route.name === 'Calls') {
              iconName = 'call-outline'
            } else if (route.name === 'Bookings') {
              iconName = 'heart-outline'
            }

            return <Ionicons name={iconName as any} size={size} color={color} />
          },
          tabBarActiveTintColor: '#000',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
        })}
      >
        <Tab.Screen name="Search" component={DummyScreen} />
        <Tab.Screen name="Calls" component={DummyScreen} />
        <Tab.Screen name="Bookings" component={DummyScreen} />
        <Tab.Screen name="Home" component={Home} />
      </Tab.Navigator>
    </NavigationContainer>
  )
}

// Dummy screen placeholder
function DummyScreen() {
  return null
}
