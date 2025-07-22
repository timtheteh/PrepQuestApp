import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useGoogleOAuth, useFacebookOAuth, useAppleOAuth, useOAuthToken } from '@/utils/oauthTokens';

export const OAuthTokenExample: React.FC = () => {
  const { user, getGoogleToken, getFacebookToken, getAppleToken, getProviderToken } = useAuth();
  const google = useGoogleOAuth();
  const facebook = useFacebookOAuth();
  const apple = useAppleOAuth();
  const oauth = useOAuthToken();
  
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string>('');

  const addResult = (message: string) => {
    setResults(prev => `${prev}\n${new Date().toLocaleTimeString()}: ${message}`);
  };

  const handleGetGoogleToken = async () => {
    setIsLoading(true);
    try {
      const { token, error } = await getGoogleToken();
      
      if (error) {
        addResult(`❌ Google Token Error: ${error}`);
        Alert.alert('Error', error);
      } else if (token) {
        addResult(`✅ Google Token: ${token.substring(0, 20)}...`);
        console.log('Full Google token:', token);
      } else {
        addResult('❌ No Google OAuth token found');
        Alert.alert('No Token', 'No Google OAuth token found. User may not have signed in with Google.');
      }
    } catch (error) {
      addResult(`❌ Google Token Failed: ${error}`);
      Alert.alert('Error', 'Failed to get Google token');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetFacebookToken = async () => {
    setIsLoading(true);
    try {
      const { token, error } = await getFacebookToken();
      
      if (error) {
        addResult(`❌ Facebook Token Error: ${error}`);
        Alert.alert('Error', error);
      } else if (token) {
        addResult(`✅ Facebook Token: ${token.substring(0, 20)}...`);
        console.log('Full Facebook token:', token);
      } else {
        addResult('❌ No Facebook OAuth token found');
        Alert.alert('No Token', 'No Facebook OAuth token found. User may not have signed in with Facebook.');
      }
    } catch (error) {
      addResult(`❌ Facebook Token Failed: ${error}`);
      Alert.alert('Error', 'Failed to get Facebook token');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetAppleToken = async () => {
    setIsLoading(true);
    try {
      const { token, error } = await getAppleToken();
      
      if (error) {
        addResult(`❌ Apple Token Error: ${error}`);
        Alert.alert('Error', error);
      } else if (token) {
        addResult(`✅ Apple Token: ${token.substring(0, 20)}...`);
        console.log('Full Apple token:', token);
      } else {
        addResult('❌ No Apple OAuth token found');
        Alert.alert('No Token', 'No Apple OAuth token found. User may not have signed in with Apple.');
      }
    } catch (error) {
      addResult(`❌ Apple Token Failed: ${error}`);
      Alert.alert('Error', 'Failed to get Apple token');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestYouTubeAPI = async () => {
    setIsLoading(true);
    try {
      const videoId = 'dQw4w9WgXcQ'; // Example video ID
      const videoDetails = await google.getYouTubeVideoDetails(videoId);
      addResult(`✅ YouTube API Success: ${videoDetails.items?.[0]?.snippet?.title || 'Unknown video'}`);
      console.log('YouTube video details:', videoDetails);
    } catch (error) {
      addResult(`❌ YouTube API Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      Alert.alert('Error', `YouTube API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestFacebookAPI = async () => {
    setIsLoading(true);
    try {
      const profile = await facebook.getFacebookProfile();
      addResult(`✅ Facebook API Success: ${profile.name || 'Unknown user'}`);
      console.log('Facebook profile:', profile);
    } catch (error) {
      addResult(`❌ Facebook API Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      Alert.alert('Error', `Facebook API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestAppleAPI = async () => {
    setIsLoading(true);
    try {
      const library = await apple.getAppleMusicLibrary();
      addResult(`✅ Apple Music API Success: ${library.data?.length || 0} items in library`);
      console.log('Apple Music library:', library);
    } catch (error) {
      addResult(`❌ Apple Music API Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      Alert.alert('Error', `Apple Music API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetAnyToken = async () => {
    setIsLoading(true);
    try {
      const { token, error } = await getProviderToken();
      
      if (error) {
        addResult(`❌ Any Token Error: ${error}`);
        Alert.alert('Error', error);
      } else if (token) {
        addResult(`✅ Any Token: ${token.substring(0, 20)}...`);
        console.log('Full token:', token);
      } else {
        addResult('❌ No OAuth token found');
        Alert.alert('No Token', 'No OAuth token found. User may not have signed in with any OAuth provider.');
      }
    } catch (error) {
      addResult(`❌ Any Token Failed: ${error}`);
      Alert.alert('Error', 'Failed to get any token');
    } finally {
      setIsLoading(false);
    }
  };

  const checkProviderSignIn = (provider: string) => {
    if (!user) {
      Alert.alert('Not Signed In', 'Please sign in first');
      return false;
    }

    const identities = user.user_metadata?.identities || [];
    const hasProviderIdentity = identities.some((identity: any) => identity.provider === provider);
    
    if (!hasProviderIdentity) {
      Alert.alert(`Not ${provider} User`, `Please sign in with ${provider} to access ${provider} APIs`);
      return false;
    }

    return true;
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>OAuth Token Test</Text>
      
      <Text style={styles.status}>
        User: {user?.email || 'Not signed in'}
      </Text>
      
      <Text style={styles.status}>
        Provider: {user?.user_metadata?.identities?.[0]?.provider || 'Unknown'}
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Get OAuth Tokens</Text>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={handleGetGoogleToken}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Loading...' : 'Get Google OAuth Token'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.facebookButton]}
          onPress={handleGetFacebookToken}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Loading...' : 'Get Facebook OAuth Token'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.appleButton]}
          onPress={handleGetAppleToken}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Loading...' : 'Get Apple OAuth Token'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.genericButton]}
          onPress={handleGetAnyToken}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Loading...' : 'Get Any OAuth Token'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test API Calls</Text>
        
        <TouchableOpacity 
          style={[styles.button, styles.apiButton]}
          onPress={() => {
            if (checkProviderSignIn('google')) {
              handleTestYouTubeAPI();
            }
          }}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Loading...' : 'Test YouTube API'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.apiButton]}
          onPress={() => {
            if (checkProviderSignIn('facebook')) {
              handleTestFacebookAPI();
            }
          }}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Loading...' : 'Test Facebook API'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.apiButton]}
          onPress={() => {
            if (checkProviderSignIn('apple')) {
              handleTestAppleAPI();
            }
          }}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Loading...' : 'Test Apple Music API'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Results Log</Text>
        <Text style={styles.results}>{results || 'No results yet...'}</Text>
      </View>

      <Text style={styles.instructions}>
        Instructions:{'\n'}
        1. Sign in with Google/Facebook/Apple{'\n'}
        2. Click "Get [Provider] OAuth Token"{'\n'}
        3. Click "Test [Provider] API"{'\n'}
        4. Check results log and console
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  status: {
    fontSize: 14,
    marginBottom: 10,
    color: '#666',
  },
  section: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  button: {
    backgroundColor: '#4F41D8',
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
  },
  facebookButton: {
    backgroundColor: '#1877F2',
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  genericButton: {
    backgroundColor: '#6c757d',
  },
  apiButton: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  results: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    fontSize: 12,
    fontFamily: 'monospace',
    minHeight: 100,
  },
  instructions: {
    marginTop: 20,
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
}); 