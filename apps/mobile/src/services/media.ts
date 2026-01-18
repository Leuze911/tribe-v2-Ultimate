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
   * Upload photo to MinIO via backend API
   * Returns the URL of the uploaded photo
   */
  async uploadPhoto(photoUri: string): Promise<string> {
    try {
      console.log('📤 Uploading photo to MinIO...');

      // Read file info
      const fileInfo = await FileSystem.getInfoAsync(photoUri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      // Create form data
      const formData = new FormData();

      // On mobile, we need to use the file URI
      const filename = photoUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri: photoUri,
        name: filename,
        type,
      } as any);

      // Upload to backend
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/v1/upload/photo`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Photo uploaded: ${data.url}`);
      return data.url;
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
        encoding: 'base64',
      });
      return base64;
    } catch (error) {
      console.error('❌ Error converting image to base64:', error);
      throw error;
    }
  }
}

export const mediaService = new MediaService();
