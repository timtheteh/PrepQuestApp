import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

import { incrementChatWithAIRequests } from '@/db/users';

interface TranscribeResponse {
  transcript: string;
  evaluation: {
    concise: string | null;
    detailed: string | null;
  };
}

async function getAudioDuration(uri: string): Promise<number> {
  try {
    if (Platform.OS === 'android' && uri.endsWith('.amr')) {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists && fileInfo.size) {
        const estimatedSeconds = (fileInfo.size - 6) / 2981;
        return estimatedSeconds;
      }
    }

    const { sound } = await Audio.Sound.createAsync({ uri });
    const status = await sound.getStatusAsync();
    if (status.isLoaded) {
      const durationSeconds = status.durationMillis ? status.durationMillis / 1000 : 0;
      await sound.unloadAsync();
      return durationSeconds;
    }
    await sound.unloadAsync();
    return 0;
  } catch (error) {
    console.error('Error getting audio duration:', error);
    return 0;
  }
}

async function getAudioDataForUpload(
  uri: string,
  isLongAudio: boolean,
  questionContext?: string
): Promise<{ data: Blob | FormData; contentType: string }> {
  try {
    if (Platform.OS === 'ios') {
      const base64String = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const dataUri = `data:audio/wav;base64,${base64String}`;
      const response = await fetch(dataUri);
      const blob = await response.blob();
      return { data: blob, contentType: 'audio/wav' };
    }

    const formData = new FormData();
    formData.append('audio', {
      uri,
      type: 'audio/amr-wb',
      name: isLongAudio ? 'recording_long.amr' : 'recording.amr',
    } as any);

    if (questionContext) {
      formData.append('questionContext', questionContext);
    }

    return { data: formData, contentType: 'multipart/form-data' };
  } catch (error) {
    console.error('Error preparing audio data:', error);
    throw error;
  }
}

export async function transcribeAudio(
  audioUri: string,
  voiceLanguage: string = 'English',
  questionContext?: string
): Promise<TranscribeResponse> {
  try {
    const duration = await getAudioDuration(audioUri);
    const audioType = duration <= 60 ? 'short' : 'long';
    const isLongAudio = audioType === 'long';

    const { data: audioData, contentType } = await getAudioDataForUpload(
      audioUri,
      isLongAudio,
      questionContext
    );

    const headers: HeadersInit = {
      'x-audio-type': audioType,
      'x-platform': Platform.OS,
      'x-language': voiceLanguage,
      Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
    };

    if (Platform.OS === 'ios' && questionContext) {
      headers['x-question-context'] = encodeURIComponent(questionContext);
    }

    if (contentType !== 'multipart/form-data') {
      headers['Content-Type'] = contentType;
    }

    const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL}/AIChatAPI`, {
      method: 'POST',
      headers,
      body: audioData as any,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Speech-to-text error:', response.status, errorText);
      throw new Error(`SERVER_ERROR:${response.status} ${errorText}`);
    }

    const data = await response.json();

    if (data?.transcript) {
      try {
        await incrementChatWithAIRequests();
      } catch (error) {
        console.error('Error incrementing chatWithAIRequests:', error);
      }

      return {
        transcript: data.transcript,
        evaluation: data.evaluation || { concise: null, detailed: null },
      };
    }

    return {
      transcript: 'No speech detected',
      evaluation: { concise: null, detailed: null },
    };
  } catch (error: any) {
    console.error('Error in transcribeAudio:', error);

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('NETWORK_ERROR');
    } else if (error instanceof Error && error.message.includes('AbortError')) {
      throw new Error('NETWORK_ERROR');
    } else if (error instanceof Error && (error.message.includes('Network request failed') || error.message.includes('network'))) {
      throw new Error('NETWORK_ERROR');
    }

    throw error;
  }
}

