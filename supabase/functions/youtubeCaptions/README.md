# YouTube Captions Edge Function

This Supabase Edge Function extracts captions from YouTube videos using the YouTube Data API v3.

## Features

1. **URL Validation**: Validates that the provided URL is a valid YouTube video URL
2. **Video Existence Check**: Verifies that the video exists and is accessible
3. **Caption Extraction**: Attempts to extract captions from the video
4. **Error Handling**: Provides detailed error messages and codes
5. **Video Information**: Returns additional video metadata when available

## API Usage

### Endpoint
```
POST /functions/v1/youtubeCaptions
```

### Request Body
```json
{
  "youtubeUrl": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

### Response Format
```json
{
  "success": true,
  "captions": "Extracted caption text...",
  "videoInfo": {
    "title": "Video Title",
    "description": "Video Description",
    "channelTitle": "Channel Name",
    "publishedAt": "2023-01-01T00:00:00Z"
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "errorCode": "ERROR_CODE",
  "videoInfo": {
    // Video info if available
  }
}
```

## Error Codes

- `MISSING_URL`: YouTube URL is required
- `INVALID_URL_FORMAT`: Invalid YouTube URL format
- `VIDEO_NOT_FOUND`: Video does not exist or is not accessible
- `CAPTIONS_ERROR`: Error retrieving captions
- `METHOD_NOT_ALLOWED`: Invalid HTTP method
- `INTERNAL_ERROR`: Internal server error

## OAuth 2.0 Requirement

**Important**: The YouTube Data API's `captions.download` endpoint requires OAuth 2.0 authentication. This means:

1. You need to set up OAuth 2.0 credentials in the Google Cloud Console
2. The function currently returns information about available caption tracks but cannot download the actual caption content without OAuth 2.0
3. To fully implement caption downloading, you would need to:
   - Set up OAuth 2.0 flow in your frontend
   - Pass the OAuth token to this edge function
   - Modify the function to use the token for caption downloads

## Environment Variables

Set the following environment variable in your Supabase project:

```
YOUTUBE_API_KEY=your_youtube_data_api_key
```

## Setup Instructions

1. **Get YouTube Data API Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the YouTube Data API v3
   - Create credentials (API Key)
   - Set the API key as environment variable

2. **For Full Caption Download (OAuth 2.0)**:
   - Create OAuth 2.0 credentials in Google Cloud Console
   - Set up OAuth consent screen
   - Implement OAuth flow in your frontend
   - Modify this function to accept OAuth tokens

## Example Usage

```javascript
// Frontend usage
const response = await fetch('/functions/v1/youtubeCaptions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseToken}`
  },
  body: JSON.stringify({
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  })
});

const result = await response.json();
if (result.success) {
  console.log('Captions:', result.captions);
  console.log('Video Info:', result.videoInfo);
} else {
  console.error('Error:', result.error);
  console.error('Error Code:', result.errorCode);
}
```

## Limitations

1. **OAuth 2.0 Required**: Full caption download requires OAuth 2.0 authentication
2. **API Quotas**: YouTube Data API has daily quotas
3. **Caption Availability**: Not all videos have captions available
4. **Language Support**: Captions may not be available in all languages

## Next Steps for Full Implementation

To implement full caption downloading:

1. Set up OAuth 2.0 credentials
2. Implement OAuth flow in your frontend
3. Modify this function to accept OAuth tokens
4. Use the `captions.download` endpoint with OAuth authentication
5. Parse and return the caption content 