//app.tsx
import { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { supabase } from './lib/supabase'
import { Session } from '@supabase/supabase-js'
import Auth from './components/Auth'
import Home from './components/Home'
import Search from './components/Search'
import Messaging from './components/Messaging'
import Community from './components/Community'
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
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
              Home: 'person-circle-outline',
              Search: 'search-outline',
              Messaging: 'chatbubble-outline',
              Community: 'heart-outline',
            }
            const iconName = iconMap[route.name] || 'help-circle-outline'
            return <Ionicons name={iconName} size={size} color={color} />
          },
          tabBarActiveTintColor: '#000',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={Home} />
        <Tab.Screen name="Search" component={Search} />
        <Tab.Screen name="Messaging" component={Messaging} />
        <Tab.Screen name="Community" component={Community} />
      </Tab.Navigator>
    </NavigationContainer>
  )
}