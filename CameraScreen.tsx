import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ChevronLeft, ImageIcon, Sparkles } from 'lucide-react-native';
import { uploadFoodImage } from './storageUtils';
import {
  analyzeMealFromImage,
  type MealNutrition,
} from './services/nutritionVisionService';
import { colors } from './theme/colors';

export type MealLogResult = {
  publicUrl: string;
  localUri: string;
  nutrition: MealNutrition;
};

type CameraScreenProps = {
  onClose?: () => void;
  onUploadComplete?: (result: MealLogResult) => void;
};

type UploadState =
  | 'idle'
  | 'capturing'
  | 'uploading'
  | 'analyzing'
  | 'success'
  | 'error';

function FrameGuide() {
  const size = 220;
  const arm = 32;

  const cornerStyle = {
    width: arm,
    height: arm,
    borderColor: colors.green,
  };

  return (
    <View style={[styles.frameGuide, { width: size, height: size }]}>
      <View style={[styles.corner, cornerStyle, styles.cornerTL]} />
      <View style={[styles.corner, cornerStyle, styles.cornerTR]} />
      <View style={[styles.corner, cornerStyle, styles.cornerBL]} />
      <View style={[styles.corner, cornerStyle, styles.cornerBR]} />
    </View>
  );
}

export default function CameraScreen({ onClose, onUploadComplete }: CameraScreenProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);

  const isBusy =
    uploadState === 'capturing' ||
    uploadState === 'uploading' ||
    uploadState === 'analyzing';

  const uploadPhoto = async (uri: string) => {
    setUploadState('uploading');
    setStatusMessage('Uploading to Supabase…');
    setPublicUrl(null);

    console.log('Local photo URI:', uri);

    const url = await uploadFoodImage(uri);

    if (!url) {
      setUploadState('error');
      setStatusMessage('Upload failed. Check your connection and try again.');
      console.error('Upload failed — uploadFoodImage returned null');
      return;
    }

    setPublicUrl(url);
    console.log('Public Supabase URL:', url);

    setUploadState('analyzing');
    setStatusMessage('AI is analyzing your ulam…');

    try {
      const nutrition = await analyzeMealFromImage(url);
      console.log('AI meal analysis:', nutrition);

      setUploadState('success');
      setStatusMessage('Analysis complete!');
      onUploadComplete?.({ publicUrl: url, localUri: uri, nutrition });
    } catch (error) {
      console.error('Vision analysis error:', error);
      setUploadState('error');
      setStatusMessage(
        error instanceof Error
          ? error.message
          : 'Could not analyze this meal. Try another photo.',
      );
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isBusy) return;

    setUploadState('capturing');
    setStatusMessage(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (!photo?.uri) {
        setUploadState('error');
        setStatusMessage('Camera did not return a photo. Try again.');
        return;
      }

      await uploadPhoto(photo.uri);
    } catch (error) {
      console.error('Capture error:', error);
      setUploadState('error');
      setStatusMessage('Something went wrong while taking the photo.');
    }
  };

  const handlePickFromGallery = async () => {
    if (isBusy) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]?.uri) return;

    try {
      await uploadPhoto(result.assets[0].uri);
    } catch (error) {
      console.error('Gallery upload error:', error);
      setUploadState('error');
      setStatusMessage('Could not upload the selected image.');
    }
  };

  if (!permission) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionScreen}>
        <Pressable style={styles.backButton} onPress={onClose}>
          <ChevronLeft size={22} color={colors.navy} strokeWidth={2.5} />
        </Pressable>
        <View style={styles.permissionBody}>
          <Text style={styles.permissionTitle}>Camera access needed</Text>
          <Text style={styles.permissionCopy}>
            PhaseEat uses your camera to photograph meals and log them automatically.
          </Text>
          <Pressable style={styles.permissionCta} onPress={requestPermission}>
            <Text style={styles.permissionCtaText}>Allow camera</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.viewfinderShell}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />

        <View style={styles.viewfinderOverlay} pointerEvents="box-none">
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={onClose}
              accessibilityLabel="Go back"
            >
              <ChevronLeft size={22} color={colors.navy} strokeWidth={2.5} />
            </Pressable>
            <Text style={styles.headerTitle}>Log Meal</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.aiPill}>
            <Sparkles size={12} color="rgba(255,255,255,0.9)" strokeWidth={2.2} />
            <Text style={styles.aiPillText}>AI will auto-detect your meal</Text>
          </View>

          <View style={styles.frameArea}>
            <FrameGuide />
          </View>

          <View style={styles.positionPill}>
            <Text style={styles.positionPillText}>
              Position your Ulam within the brackets
            </Text>
          </View>

          {statusMessage && (
            <View
              style={[
                styles.statusBanner,
                uploadState === 'error' && styles.statusBannerError,
                uploadState === 'success' && styles.statusBannerSuccess,
              ]}
            >
              {isBusy && <ActivityIndicator size="small" color={colors.white} />}
              <Text style={styles.statusBannerText}>{statusMessage}</Text>
            </View>
          )}

          {publicUrl && uploadState === 'success' && (
            <Text style={styles.urlPreview} numberOfLines={2} selectable>
              {publicUrl}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable
          style={styles.galleryButton}
          onPress={handlePickFromGallery}
          disabled={isBusy}
          accessibilityLabel="Choose from gallery"
        >
          <ImageIcon size={22} color={colors.muted} strokeWidth={2} />
        </Pressable>

        <Pressable
          style={[styles.shutterButton, isBusy && styles.shutterButtonDisabled]}
          onPress={handleCapture}
          disabled={isBusy}
          accessibilityLabel="Take photo"
        >
          {isBusy ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Camera size={28} color={colors.white} strokeWidth={2.2} />
          )}
        </Pressable>

        <View style={styles.controlsSpacer} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy,
  },
  permissionScreen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  permissionBody: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 80,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.navy,
  },
  permissionCopy: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
  },
  permissionCta: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.green,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 999,
  },
  permissionCtaText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  viewfinderShell: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.navy,
  },
  camera: {
    ...StyleSheet.absoluteFill,
  },
  viewfinderOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  headerSpacer: {
    width: 40,
  },
  aiPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 30, 58, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: -8,
  },
  aiPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  frameArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  frameGuide: {
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    borderStyle: 'solid',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  positionPill: {
    alignSelf: 'center',
    backgroundColor: 'rgba(67, 176, 106, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    marginBottom: 8,
  },
  positionPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
  },
  statusBanner: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 30, 58, 0.8)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  statusBannerSuccess: {
    backgroundColor: 'rgba(67, 176, 106, 0.92)',
  },
  statusBannerError: {
    backgroundColor: 'rgba(255, 122, 102, 0.92)',
  },
  statusBannerText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  urlPreview: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 8,
    fontSize: 9,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
  controls: {
    height: 112,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 32,
  },
  galleryButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  shutterButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  shutterButtonDisabled: {
    opacity: 0.75,
  },
  controlsSpacer: {
    width: 48,
  },
});
