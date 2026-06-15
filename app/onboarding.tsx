import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff, Apple } from 'lucide-react-native';
import { PhaseEatLogo } from '../components/PhaseEatLogo';
import { supabase } from '../lib/supabase';
import { signInAsGuest } from '../services/guestAuthService';
import { colors, shadows } from '../theme/colors';
import { layout, radii, sizes, spacing } from '../theme/spacing';
import { fontWeights } from '../theme/typography';

type AuthMode = 'signup' | 'login';
type UserRole = 'student' | 'parent';

const tokens = {
  creamBg: colors.background,
  navyDark: colors.navy,
  coralAccent: colors.coral,
  greenAccent: colors.green,
  goldAccent: colors.gold,
  gray: colors.muted,
  grayPale: colors.track,
  roleTrack: 'rgba(15, 30, 58, 0.07)',
  cardShadow: 'rgba(15, 30, 58, 0.10)',
  coralShadow: 'rgba(255, 122, 102, 0.35)',
  navyShadow: 'rgba(15, 30, 58, 0.25)',
} as const;

function PhaseEatOnboardingLogo() {
  return <PhaseEatLogo variant="full" height={sizes.logoOnboardingHeight} />;
}

function SocialAuthButton({
  label,
  backgroundColor,
  borderColor,
  children,
  onPress,
}: {
  label: string;
  backgroundColor: string;
  borderColor: string;
  children: ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.socialButton,
        { backgroundColor, borderColor },
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {children}
    </Pressable>
  );
}

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const contentMaxWidth = Math.min(width, 480);

  const [mode, setMode] = useState<AuthMode>('signup');
  const [role, setRole] = useState<UserRole>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [linkParent, setLinkParent] = useState(false);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [focusedField, setFocusedField] = useState<string | null>(null);

  const showAuthError = (message: string) => {
    Alert.alert('Authentication failed', message);
  };

  const handleSignUp = async () => {
    const trimmedEmail = email.trim();
    if (!fullName.trim() || !trimmedEmail || !password) {
      showAuthError('Please complete all required fields.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          role,
          link_parent: linkParent,
        },
      },
    });
    setLoading(false);

    if (error) {
      showAuthError(error.message);
      return;
    }

    router.replace('/');
  };

  const handleLogIn = async () => {
    const trimmedEmail = loginEmail.trim();
    if (!trimmedEmail || !loginPassword) {
      showAuthError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    console.log('[PhaseEat:Login] Starting email/password sign-in…');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: loginPassword,
    });
    setLoading(false);

    if (error) {
      console.error('[PhaseEat:Login] Sign-in failed:', error.message);
      showAuthError(error.message);
      return;
    }

    console.log('[PhaseEat:Login] Sign-in succeeded', {
      userId: data.session?.user?.id,
      isAnonymous: data.session?.user?.is_anonymous,
    });

    router.replace('/');
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    console.log('[PhaseEat:Login] Guest login tapped');

    const { session, error } = await signInAsGuest();

    setLoading(false);

    if (error) {
      showAuthError(error.message);
      return;
    }

    console.log('[PhaseEat:Login] Guest login complete — session is active', {
      userId: session?.user?.id,
      isAnonymous: session?.user?.is_anonymous,
    });
  };

  const handlePrimaryAction = () => {
    if (mode === 'signup') {
      void handleSignUp();
      return;
    }
    void handleLogIn();
  };

  const handleSocialPress = (provider: string) => {
    Alert.alert('Coming soon', `${provider} sign-in will be available in a future update.`);
  };

  const inputBorderColor = (field: string) =>
    focusedField === field ? tokens.coralAccent : tokens.grayPale;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.blobTopRight} />
      <View style={styles.blobLeft} />
      <View style={styles.blobBottomRight} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <PhaseEatOnboardingLogo />
          </View>

          <View style={styles.roleTabsWrap}>
            <View style={styles.roleTabsTrack}>
              {(['student', 'parent'] as UserRole[]).map((value) => {
                const active = role === value;
                return (
                  <Pressable
                    key={value}
                    style={[styles.roleTab, active && styles.roleTabActive]}
                    onPress={() => setRole(value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={value === 'student' ? 'I am a Student' : 'I am a Parent'}
                  >
                    <Text style={[styles.roleTabLabel, active && styles.roleTabLabelActive]}>
                      {value === 'student' ? 'I am a Student' : 'I am a Parent'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.formSection}>
            <View style={styles.formCard}>
              <View style={styles.authModeRow}>
                {(['signup', 'login'] as AuthMode[]).map((value) => {
                  const active = mode === value;
                  return (
                    <Pressable
                      key={value}
                      style={[styles.authModeTab, active && styles.authModeTabActive]}
                      onPress={() => setMode(value)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={value === 'signup' ? 'Create Account' : 'Log In'}
                    >
                      <Text style={[styles.authModeLabel, active && styles.authModeLabelActive]}>
                        {value === 'signup' ? 'Create Account' : 'Log In'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {mode === 'signup' ? (
                <View style={styles.formFields}>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Full Name</Text>
                    <TextInput
                      style={[styles.input, { borderColor: inputBorderColor('fullName') }]}
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="e.g., Naomi Santos"
                      placeholderTextColor={tokens.gray}
                      onFocus={() => setFocusedField('fullName')}
                      onBlur={() => setFocusedField(null)}
                      autoCapitalize="words"
                      autoComplete="name"
                    />
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>University Email</Text>
                    <TextInput
                      style={[styles.input, { borderColor: inputBorderColor('email') }]}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="e.g., student@university.edu.ph"
                      placeholderTextColor={tokens.gray}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                    />
                    <Text style={styles.fieldHint}>
                      Use your school email for campus-specific carinderia tracking
                    </Text>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Password</Text>
                    <View style={styles.passwordRow}>
                      <TextInput
                        style={[
                          styles.input,
                          styles.passwordInput,
                          { borderColor: inputBorderColor('password') },
                        ]}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="••••••••••••"
                        placeholderTextColor={tokens.gray}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoComplete="password-new"
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                      />
                      <Pressable
                        style={styles.passwordToggle}
                        onPress={() => setShowPassword((current) => !current)}
                        accessibilityRole="button"
                        accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff size={16} color={tokens.gray} strokeWidth={2} />
                        ) : (
                          <Eye size={16} color={tokens.gray} strokeWidth={2} />
                        )}
                      </Pressable>
                    </View>
                  </View>

                  <Pressable
                    style={styles.checkboxRow}
                    onPress={() => setLinkParent((current) => !current)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: linkParent }}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        linkParent && styles.checkboxChecked,
                      ]}
                    >
                      {linkParent ? <Text style={styles.checkboxMark}>✓</Text> : null}
                    </View>
                    <Text style={styles.checkboxLabel}>
                      Link a Parent Account now for real-time budget sync{' '}
                      <Text style={styles.checkboxOptional}>(Optional)</Text>
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryCta,
                      styles.signUpCta,
                      pressed && styles.buttonPressed,
                      loading && styles.buttonDisabled,
                    ]}
                    onPress={handlePrimaryAction}
                    disabled={loading}
                    accessibilityRole="button"
                    accessibilityLabel="Join PhaseEat"
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <Text style={styles.primaryCtaLabel}>Join PhaseEat 🍚</Text>
                    )}
                  </Pressable>
                </View>
              ) : (
                <View style={styles.formFields}>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>School Email or Phone</Text>
                    <TextInput
                      style={[styles.input, { borderColor: inputBorderColor('loginEmail') }]}
                      value={loginEmail}
                      onChangeText={setLoginEmail}
                      placeholder="e.g., student@university.edu.ph"
                      placeholderTextColor={tokens.gray}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="username"
                      onFocus={() => setFocusedField('loginEmail')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>

                  <View style={styles.field}>
                    <View style={styles.passwordLabelRow}>
                      <Text style={styles.fieldLabel}>Password</Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Forgot Password"
                        onPress={() =>
                          Alert.alert(
                            'Reset password',
                            'Password reset will be wired to Supabase in a future update.',
                          )
                        }
                      >
                        <Text style={styles.forgotPassword}>Forgot Password?</Text>
                      </Pressable>
                    </View>
                    <View style={styles.passwordRow}>
                      <TextInput
                        style={[
                          styles.input,
                          styles.passwordInput,
                          { borderColor: inputBorderColor('loginPassword') },
                        ]}
                        value={loginPassword}
                        onChangeText={setLoginPassword}
                        placeholder="••••••••••••"
                        placeholderTextColor={tokens.gray}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoComplete="password"
                        onFocus={() => setFocusedField('loginPassword')}
                        onBlur={() => setFocusedField(null)}
                      />
                      <Pressable
                        style={styles.passwordToggle}
                        onPress={() => setShowPassword((current) => !current)}
                        accessibilityRole="button"
                        accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff size={16} color={tokens.gray} strokeWidth={2} />
                        ) : (
                          <Eye size={16} color={tokens.gray} strokeWidth={2} />
                        )}
                      </Pressable>
                    </View>
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryCta,
                      styles.logInCta,
                      pressed && styles.buttonPressed,
                      loading && styles.buttonDisabled,
                    ]}
                    onPress={handlePrimaryAction}
                    disabled={loading}
                    accessibilityRole="button"
                    accessibilityLabel="Log In"
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <Text style={styles.primaryCtaLabel}>Log In</Text>
                    )}
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.guestCta,
                      pressed && styles.buttonPressed,
                      loading && styles.buttonDisabled,
                    ]}
                    onPress={() => void handleGuestLogin()}
                    disabled={loading}
                    accessibilityRole="button"
                    accessibilityLabel="Login as Guest"
                  >
                    <Text style={styles.guestCtaLabel}>Login as Guest</Text>
                  </Pressable>
                </View>
              )}

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialRow}>
                <SocialAuthButton
                  label="Continue with Google"
                  backgroundColor={tokens.creamBg}
                  borderColor={tokens.grayPale}
                  onPress={() => handleSocialPress('Google')}
                >
                  <Text style={styles.socialGoogleG}>G</Text>
                </SocialAuthButton>
                <SocialAuthButton
                  label="Continue with Apple"
                  backgroundColor={tokens.navyDark}
                  borderColor={tokens.navyDark}
                  onPress={() => handleSocialPress('Apple')}
                >
                  <Apple size={18} color={colors.white} strokeWidth={0} fill={colors.white} />
                </SocialAuthButton>
                <SocialAuthButton
                  label="Continue with Facebook"
                  backgroundColor="#1877F2"
                  borderColor="#1877F2"
                  onPress={() => handleSocialPress('Facebook')}
                >
                  <Text style={styles.socialFacebookIcon}>f</Text>
                </SocialAuthButton>
              </View>

              <Text style={styles.footerToggle}>
                {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
                <Text
                  style={styles.footerToggleLink}
                  onPress={() => setMode(mode === 'signup' ? 'login' : 'signup')}
                >
                  {mode === 'signup' ? 'Log In' : 'Sign Up'}
                </Text>
              </Text>
            </View>

            <Text style={styles.bottomTagline}>Built for Students. Made for Families. 🧡</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: tokens.creamBg,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  blobTopRight: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 224,
    height: 224,
    borderRadius: 112,
    backgroundColor: colors.coralTint15,
    opacity: 0.7,
  },
  blobLeft: {
    position: 'absolute',
    top: '50%',
    left: -64,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.greenTint15,
    opacity: 0.7,
  },
  blobBottomRight: {
    position: 'absolute',
    bottom: 64,
    right: 0,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: colors.goldTint15,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xxxl + spacing.lg,
    paddingHorizontal: layout.screenPaddingX,
    paddingBottom: spacing.lg,
  },
  logoBlock: {
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  logoMarkWrap: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  logoEmoji: {
    fontSize: 40,
  },
  pinBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  wordmark: {
    fontSize: 34,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  wordmarkPhase: {
    color: colors.navy,
  },
  wordmarkIt: {
    color: colors.green,
  },
  headerTagline: {
    textAlign: 'center',
    color: tokens.navyDark,
    fontSize: 12,
    fontWeight: fontWeights.medium,
    letterSpacing: 0.1,
    lineHeight: 19,
    maxWidth: 240,
  },
  headerTaglineAccent: {
    color: tokens.coralAccent,
    fontWeight: fontWeights.bold,
  },
  roleTabsWrap: {
    paddingHorizontal: layout.screenPaddingX,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  roleTabsTrack: {
    flexDirection: 'row',
    backgroundColor: tokens.roleTrack,
    borderRadius: radii.lg,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  roleTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  roleTabActive: {
    backgroundColor: tokens.coralAccent,
    shadowColor: tokens.coralAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 3,
  },
  roleTabLabel: {
    fontSize: 13,
    fontWeight: fontWeights.medium,
    color: tokens.navyDark,
    letterSpacing: 0.1,
  },
  roleTabLabelActive: {
    color: colors.white,
    fontWeight: fontWeights.bold,
  },
  formSection: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    shadowColor: tokens.navyDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 32,
    elevation: 4,
  },
  authModeRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: tokens.grayPale,
    marginBottom: spacing.xxl,
  },
  authModeTab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: spacing.md,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  authModeTabActive: {
    borderBottomColor: tokens.coralAccent,
  },
  authModeLabel: {
    fontSize: 14,
    fontWeight: fontWeights.medium,
    color: tokens.gray,
  },
  authModeLabelActive: {
    color: tokens.coralAccent,
    fontWeight: fontWeights.bold,
  },
  formFields: {
    gap: spacing.lg,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: fontWeights.semibold,
    color: tokens.navyDark,
  },
  fieldHint: {
    fontSize: 10.5,
    color: tokens.gray,
    lineHeight: 15,
  },
  input: {
    backgroundColor: tokens.creamBg,
    borderWidth: 1.5,
    borderColor: tokens.grayPale,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 14,
    fontWeight: fontWeights.medium,
    color: tokens.navyDark,
  },
  passwordRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 48,
  },
  passwordToggle: {
    position: 'absolute',
    right: spacing.md,
    padding: spacing.xs,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  forgotPassword: {
    fontSize: 12,
    fontWeight: fontWeights.semibold,
    color: tokens.navyDark,
    textDecorationLine: 'underline',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: tokens.grayPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    borderColor: tokens.greenAccent,
    backgroundColor: tokens.greenAccent,
  },
  checkboxMark: {
    color: colors.white,
    fontSize: 12,
    fontWeight: fontWeights.bold,
    lineHeight: 14,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    color: tokens.navyDark,
    lineHeight: 18,
  },
  checkboxOptional: {
    color: tokens.gray,
    fontWeight: fontWeights.normal,
  },
  primaryCta: {
    marginTop: spacing.xs,
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  signUpCta: {
    backgroundColor: tokens.coralAccent,
    shadowColor: tokens.coralAccent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 4,
  },
  logInCta: {
    backgroundColor: tokens.navyDark,
    shadowColor: tokens.navyDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 4,
  },
  guestCta: {
    marginTop: spacing.sm,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: tokens.grayPale,
    backgroundColor: tokens.creamBg,
  },
  guestCtaLabel: {
    fontSize: 14,
    fontWeight: fontWeights.semibold,
    color: tokens.navyDark,
    letterSpacing: 0.1,
  },
  primaryCtaLabel: {
    fontSize: 16,
    fontWeight: fontWeights.bold,
    color: colors.white,
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: tokens.grayPale,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: fontWeights.medium,
    color: tokens.gray,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  socialButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  socialGoogleG: {
    fontSize: 18,
    fontWeight: fontWeights.bold,
    color: '#4285F4',
  },
  socialFacebookIcon: {
    fontSize: 22,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },
  footerToggle: {
    textAlign: 'center',
    marginTop: spacing.xl,
    fontSize: 12.5,
    color: tokens.gray,
  },
  footerToggleLink: {
    color: tokens.coralAccent,
    fontWeight: fontWeights.bold,
  },
  bottomTagline: {
    textAlign: 'center',
    marginTop: spacing.lg,
    fontSize: 11,
    fontWeight: fontWeights.medium,
    color: tokens.gray,
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
