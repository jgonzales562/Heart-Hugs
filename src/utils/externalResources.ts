import { Linking } from 'react-native';

type OpenUrl = (url: string) => Promise<unknown>;

export async function tryOpenExternalResource(
  url: string,
  openUrl: OpenUrl = Linking.openURL
): Promise<boolean> {
  try {
    await openUrl(url);
    return true;
  } catch (error) {
    console.warn(`Unable to open external resource: ${url}`, error);
    return false;
  }
}
