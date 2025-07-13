import * as ImageManipulator from 'expo-image-manipulator';

export async function prepareImageForUpload(uri: string): Promise<string> {
  let manipResult = { uri };
  try {
    const { width, height } = await ImageManipulator.manipulateAsync(uri, [], { base64: false });
    let resize = {};
    if (width && height) {
      if (width > height && width > 1568) {
        resize = { width: 1568 };
      } else if (height > width && height > 1568) {
        resize = { height: 1568 };
      } else if (width === height && width > 1568) {
        resize = { width: 1568, height: 1568 };
      }
    }
    manipResult = await ImageManipulator.manipulateAsync(
      uri,
      resize ? [{ resize }] : [],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
  } catch (e) {
    manipResult = { uri };
  }
  return manipResult.uri;
} 