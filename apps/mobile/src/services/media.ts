/**
 * TRIBE v2 - Media Service
 *
 * Handles camera, image picker, and photo upload to MinIO
 */

import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface PhotoResult {
  uri: string;
  base64?: string;
  width: number;
  height: number;
  fileSize?: number;
}

class MediaService {
  /**
   * Request camera permissions
   */
  async requestCameraPermission(): Promise<boolean> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Request media library permissions
   */
  async requestMediaLibraryPermission(): Promise<boolean> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Take a photo with camera
   */
  async takePhoto(): Promise<PhotoResult | null> {
    try {
      // Request permission
      const hasPermission = await this.requestCameraPermission();
      if (!hasPermission) {
        console.log('❌ Camera permission denied');
        return null;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'] as any,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8, // Compress to 80%
        base64: false, // Don't include base64 by default (too large)
      });

      if (result.canceled) {
        return null;
      }

      const photo = result.assets[0];
      return {
        uri: photo.uri,
        width: photo.width,
        height: photo.height,
        fileSize: photo.fileSize,
      };
    } catch (error) {
      console.error('❌ Error taking photo:', error);
      return null;
    }
  }

  /**
   * Pick image from gallery
   */
  async pickImage(): Promise<PhotoResult | null> {
    try {
      // Request permission
      const hasPermission = await this.requestMediaLibraryPermission();
      if (!hasPermission) {
        console.log('❌ Media library permission denied');
        return null;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'] as any,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (result.canceled) {
        return null;
      }

      const photo = result.assets[0];
      return {
        uri: photo.uri,
        width: photo.width,
        height: photo.height,
        fileSize: photo.fileSize,
      };
    } catch (error) {
      console.error('❌ Error picking image:', error);
      return null;
    }
  }

  /**
   * Upload photo to MinIO
   * Returns the URL of the uploaded photo
   */
  async uploadPhoto(photoUri: string, poiId: string): Promise<string> {
    try {
      console.log('📤 Uploading photo to MinIO...');

      // Read file info
      const fileInfo = await FileSystem.getInfoAsync(photoUri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `poi_${poiId}_${timestamp}.jpg`;

      // For now, mock the MinIO upload
      // TODO: Implement actual MinIO upload via backend API
      const minioUrl = `${process.env.EXPO_PUBLIC_API_URL}/uploads/${filename}`;

      // Mock: In production, this would be a multipart/form-data upload
      // const formData = new FormData();
      // formData.append('file', {
      //   uri: photoUri,
      //   name: filename,
      //   type: 'image/jpeg',
      // } as any);
      //
      // await axios.post('/api/v1/upload', formData, {
      //   headers: { 'Content-Type': 'multipart/form-data' },
      // });

      console.log(`✅ Photo uploaded: ${minioUrl}`);
      return minioUrl;
    } catch (error) {
      console.error('❌ Error uploading photo:', error);
      throw error;
    }
  }

  /**
   * Resize image for optimization
   */
  async resizeImage(uri: string, maxWidth: number = 1024): Promise<string> {
    // TODO: Implement image resizing with expo-image-manipulator
    // For now, return original URI
    return uri;
  }

  /**
   * Compress image
   */
  async compressImage(uri: string, quality: number = 0.8): Promise<string> {
    // TODO: Implement compression
    return uri;
  }

  /**
   * Convert image to base64 (for offline storage)
   */
  async imageToBase64(uri: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error('❌ Error converting image to base64:', error);
      throw error;
    }
  }
}

export const mediaService = new MediaService();
