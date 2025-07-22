import { useAuth } from '@/contexts/AuthContext';

// Google OAuth Token Usage Examples
export const useGoogleOAuth = () => {
  const { getGoogleToken } = useAuth();

  const callGoogleAPI = async (apiFunction: (token: string) => Promise<any>) => {
    try {
      const { token, error } = await getGoogleToken();
      
      if (error || !token) {
        throw new Error(error || 'No Google OAuth token available');
      }

      return await apiFunction(token);
    } catch (error) {
      console.error('Google API call failed:', error);
      throw error;
    }
  };

  return {
    // YouTube API
    getYouTubeCaptions: (videoId: string) => 
      callGoogleAPI(token => 
        fetch(`https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json())
      ),
    
    getYouTubeVideoDetails: (videoId: string) => 
      callGoogleAPI(token => 
        fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json())
      ),

    // Google Drive API
    listGoogleDriveFiles: () => 
      callGoogleAPI(token => 
        fetch('https://www.googleapis.com/drive/v3/files', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json())
      ),

    // Google Calendar API
    listGoogleCalendarEvents: (calendarId: string = 'primary') => 
      callGoogleAPI(token => 
        fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json())
      ),
  };
};

// Facebook OAuth Token Usage Examples
export const useFacebookOAuth = () => {
  const { getFacebookToken } = useAuth();

  const callFacebookAPI = async (apiFunction: (token: string) => Promise<any>) => {
    try {
      const { token, error } = await getFacebookToken();
      
      if (error || !token) {
        throw new Error(error || 'No Facebook OAuth token available');
      }

      return await apiFunction(token);
    } catch (error) {
      console.error('Facebook API call failed:', error);
      throw error;
    }
  };

  return {
    // Facebook Graph API
    getFacebookProfile: () => 
      callFacebookAPI(token => 
        fetch('https://graph.facebook.com/me?fields=id,name,email,picture', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json())
      ),

    getFacebookFriends: () => 
      callFacebookAPI(token => 
        fetch('https://graph.facebook.com/me/friends', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json())
      ),

    getFacebookPages: () => 
      callFacebookAPI(token => 
        fetch('https://graph.facebook.com/me/accounts', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json())
      ),

    // Instagram Basic Display API (if connected)
    getInstagramProfile: () => 
      callFacebookAPI(token => 
        fetch('https://graph.instagram.com/me?fields=id,username,account_type', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json())
      ),
  };
};

// Apple OAuth Token Usage Examples
export const useAppleOAuth = () => {
  const { getAppleToken } = useAuth();

  const callAppleAPI = async (apiFunction: (token: string) => Promise<any>) => {
    try {
      const { token, error } = await getAppleToken();
      
      if (error || !token) {
        throw new Error(error || 'No Apple OAuth token available');
      }

      return await apiFunction(token);
    } catch (error) {
      console.error('Apple API call failed:', error);
      throw error;
    }
  };

  return {
    // Apple Music API
    getAppleMusicLibrary: () => 
      callAppleAPI(token => 
        fetch('https://api.music.apple.com/v1/me/library', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Music-User-Token': token // Apple Music requires this header
          }
        }).then(res => res.json())
      ),

    getAppleMusicPlaylists: () => 
      callAppleAPI(token => 
        fetch('https://api.music.apple.com/v1/me/library/playlists', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Music-User-Token': token
          }
        }).then(res => res.json())
      ),

    // Apple HealthKit (if available)
    getAppleHealthData: () => 
      callAppleAPI(token => {
        // Note: HealthKit access requires additional setup and permissions
        console.log('Apple HealthKit access requires additional setup');
        return Promise.resolve({ message: 'HealthKit access requires additional setup' });
      }),
  };
};

// Generic OAuth Token Usage
export const useOAuthToken = () => {
  const { getProviderToken } = useAuth();

  const getTokenForProvider = async (provider: 'google' | 'facebook' | 'apple') => {
    try {
      const { token, error } = await getProviderToken(provider);
      
      if (error || !token) {
        throw new Error(error || `No ${provider} OAuth token available`);
      }

      return token;
    } catch (error) {
      console.error(`${provider} token retrieval failed:`, error);
      throw error;
    }
  };

  return {
    getGoogleToken: () => getTokenForProvider('google'),
    getFacebookToken: () => getTokenForProvider('facebook'),
    getAppleToken: () => getTokenForProvider('apple'),
    getAnyToken: () => getProviderToken(), // Gets any available token
  };
};

// Example usage in a component:
/*
import { useGoogleOAuth, useFacebookOAuth, useAppleOAuth } from '@/utils/oauthTokens';

function OAuthExample() {
  const google = useGoogleOAuth();
  const facebook = useFacebookOAuth();
  const apple = useAppleOAuth();
  
  const handleGoogleAPI = async () => {
    try {
      const videoDetails = await google.getYouTubeVideoDetails('dQw4w9WgXcQ');
      console.log('YouTube video:', videoDetails);
    } catch (error) {
      console.error('Google API failed:', error);
    }
  };
  
  const handleFacebookAPI = async () => {
    try {
      const profile = await facebook.getFacebookProfile();
      console.log('Facebook profile:', profile);
    } catch (error) {
      console.error('Facebook API failed:', error);
    }
  };
  
  const handleAppleAPI = async () => {
    try {
      const library = await apple.getAppleMusicLibrary();
      console.log('Apple Music library:', library);
    } catch (error) {
      console.error('Apple API failed:', error);
    }
  };
  
  return (
    <View>
      <Button title="Test Google API" onPress={handleGoogleAPI} />
      <Button title="Test Facebook API" onPress={handleFacebookAPI} />
      <Button title="Test Apple API" onPress={handleAppleAPI} />
    </View>
  );
}
*/ 