import React, { useContext, useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from '../screens/LoginScreen';
import ChatListScreen from '../screens/ChatListScreen';
import UserListScreen from '../screens/UserListScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TermsScreen from '../screens/TermsScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import MissionsScreen from '../screens/MissionsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import GroupChatListScreen from '../screens/GroupChatListScreen';
import GroupChatScreen from '../screens/GroupChatScreen';
import { AuthContext } from '../context/AuthContext';

const Stack = createStackNavigator();

export default function AppNavigator() {
	const { user } = useContext(AuthContext);
	const [showOnboarding, setShowOnboarding] = useState(null);

	useEffect(() => {
		const checkOnboarding = async () => {
			try {
				const completed = await AsyncStorage.getItem('onboarding_completed');
				setShowOnboarding(completed !== 'true');
			} catch (error) {
				console.error('Error checking onboarding:', error);
				setShowOnboarding(false);
			}
		};
		checkOnboarding();
	}, []);

	if (showOnboarding === null) {
		return null; // Loading state
	}

	return (
		<NavigationContainer>
			<Stack.Navigator 
				screenOptions={{ 
					headerShown: false,
					// 웹에서 애니메이션 비활성화
					...(Platform.OS === 'web' && {
						animationEnabled: false,
						cardStyle: { backgroundColor: 'white' }
					})
				}}
			>
				{user ? (
					showOnboarding ? (
						<>
							<Stack.Screen name="Onboarding">
								{(props) => (
									<OnboardingScreen
										{...props}
										onComplete={() => setShowOnboarding(false)}
									/>
								)}
							</Stack.Screen>
							<Stack.Screen name="ChatList" component={ChatListScreen} />
							<Stack.Screen name="UserList" component={UserListScreen} />
							<Stack.Screen name="Chat" component={ChatScreen} />
							<Stack.Screen name="Profile" component={ProfileScreen} />
							<Stack.Screen name="Missions" component={MissionsScreen} />
							<Stack.Screen name="EditProfile" component={EditProfileScreen} />
							<Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
							<Stack.Screen name="GroupChatList" component={GroupChatListScreen} />
							<Stack.Screen name="GroupChat" component={GroupChatScreen} />
						</>
					) : (
						<>
							<Stack.Screen name="ChatList" component={ChatListScreen} />
							<Stack.Screen name="UserList" component={UserListScreen} />
							<Stack.Screen name="Chat" component={ChatScreen} />
							<Stack.Screen name="Profile" component={ProfileScreen} />
							<Stack.Screen name="Missions" component={MissionsScreen} />
							<Stack.Screen name="EditProfile" component={EditProfileScreen} />
							<Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
							<Stack.Screen name="GroupChatList" component={GroupChatListScreen} />
							<Stack.Screen name="GroupChat" component={GroupChatScreen} />
						</>
					)
				) : (
					<>
						<Stack.Screen name="Login" component={LoginScreen} />
						<Stack.Screen 
							name="Terms" 
							component={TermsScreen}
							options={{ 
								headerShown: true,
								title: 'Terms of Service',
								headerBackTitle: 'Back'
							}}
						/>
					</>
				)}
			</Stack.Navigator>
		</NavigationContainer>
	);
}
