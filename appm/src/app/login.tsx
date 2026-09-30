import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  AuthError,
  confirmarCodigoRecuperacion,
  iniciarSesion,
  solicitarCodigoRecuperacion,
} from '@/lib/auth';
import { useVictoriaToast } from '@/components/victoria/toast';
import { TarjetaFecha } from '@/components/victoria/TarjetaFecha';

/**
 * Pantalla de inicio de sesión de Victoria.
 * Migrada desde VICTORIA_integrado/templates/login.html + static/js/auth.js:
 * ya no simula el ingreso, llama de verdad a POST /api/v1/auth/login contra
 * la API FastAPI (el "usuario" que pide el backend es el número de
 * documento, no un correo).
 *
 * El redirect después de iniciar sesión SIEMPRE es a "/victoria/dashboard"
 * -- sin importar el rol. Esa pantalla (app/victoria/dashboard.tsx) es la
 * que decide a dónde mandar según perfil.nombre_rol (coordinador,
 * instructor, o se queda ahí mismo si es aprendiz). Así esta pantalla no
 * necesita saber nada de roles, y esa lógica vive en un solo lugar.
 */
function useOcultarOjitoNativo() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const id = 'victoria-hide-native-password-reveal';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      input[type="password"]::-ms-reveal,
      input[type="password"]::-ms-clear {
        display: none;
      }
      input[type="password"]::-webkit-credentials-auto-fill-button,
      input[type="password"]::-webkit-textfield-decoration-container {
        display: none !important;
        visibility: hidden;
      }
    `;
    document.head.appendChild(style);
  }, []);
}

export default function LoginScreen() {
  useOcultarOjitoNativo();
  const { mostrarExito } = useVictoriaToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [pasoModal, setPasoModal] = useState<'correo' | 'codigo'>('correo');
  const [correoRecuperacion, setCorreoRecuperacion] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [cargandoModal, setCargandoModal] = useState(false);
  const [errorModal, setErrorModal] = useState('');
  const [mensajeModal, setMensajeModal] = useState('');
  
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarNuevaPassword, setMostrarNuevaPassword] = useState(false);

  const requisitosPassword = [
    { label: 'Mínimo 8 caracteres', cumple: nuevaContrasena.length >= 8 },
    { label: 'Una mayúscula', cumple: /[A-Z]/.test(nuevaContrasena) },
    { label: 'Una minúscula', cumple: /[a-z]/.test(nuevaContrasena) },
    { label: 'Un número', cumple: /[0-9]/.test(nuevaContrasena) },
    { label: 'Un carácter especial', cumple: /[^A-Za-z0-9]/.test(nuevaContrasena) },
  ];
  const passwordValida = requisitosPassword.every((r) => r.cumple);

  function cerrarModal() {
    setModalVisible(false);
    setPasoModal('correo');
    setCorreoRecuperacion('');
    setCodigo('');
    setNuevaContrasena('');
    setErrorModal('');
    setMensajeModal('');
  }

  async function enviarCodigo() {
    if (!correoRecuperacion.trim()) {
      setErrorModal('Ingresa tu correo.');
      return;
    }
    setCargandoModal(true);
    setErrorModal('');
    try {
      await solicitarCodigoRecuperacion(correoRecuperacion.trim());
      setMensajeModal('Si el correo existe, te llegará un código en unos minutos.');
      setPasoModal('codigo');
    } catch (err) {
      setErrorModal(err instanceof AuthError ? err.message : 'No se pudo enviar el código.');
    } finally {
      setCargandoModal(false);
    }
  }

  async function confirmarNuevaContrasena() {
    if (!codigo.trim() || !nuevaContrasena.trim()) {
      setErrorModal('Ingresa el código y la nueva contraseña.');
      return;
    }
    if (!passwordValida) {
      setErrorModal('La nueva contraseña todavía no cumple todos los requisitos.');
      return;
    }
    setCargandoModal(true);
    setErrorModal('');
    try {
      await confirmarCodigoRecuperacion(correoRecuperacion.trim(), codigo.trim(), nuevaContrasena);
      setMensajeModal('¡Contraseña actualizada! Ya puedes iniciar sesión.');
      mostrarExito('Contraseña actualizada correctamente');
      setTimeout(cerrarModal, 2000);
    } catch (err) {
      setErrorModal(err instanceof AuthError ? err.message : 'Código incorrecto o vencido.');
    } finally {
      setCargandoModal(false);
    }
  }

  async function handleSubmit() {
    if (cargando) return;
    setError('');
    setCargando(true);
    try {
      await iniciarSesion(username.trim(), password);
      mostrarExito('Inicio de sesión exitoso');
      router.replace('/victoria/dashboard');
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'No fue posible iniciar sesión.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <View style={styles.body}>
      <Image
        source={require('@/assets/images/victoria/login-bg.jpg')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      
      <View style={styles.container}>
        {/* Panel izquierdo */}
        <View style={styles.leftPanel}>
          <BlurView intensity={40} tint="dark" style={styles.glassCard}>
            <View style={styles.loginCard}>
              <View style={styles.loginHeader}>
                <Text style={styles.brandText}>VICTORIA</Text>
                <Image
                  source={require('@/assets/images/victoria/v-logo.png')}
                  style={styles.vMiniLogo}
                  contentFit="contain"
                />
              </View>

              <Text style={styles.loginTitle}>Log in</Text>

              <View style={styles.customInputGroup}>
                <View style={styles.inputIconWrapper}>
                  <Text style={styles.inputIconGlyph}>👤</Text>
                </View>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="numero de documento"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType={Platform.OS === 'web' ? 'default' : 'number-pad'}
                  style={styles.input}
                />
              </View>

              <View style={styles.customInputGroup}>
                <View style={styles.inputIconWrapper}>
                  <Text style={styles.inputIconGlyph}>🔒</Text>
                </View>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="contraseña"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  secureTextEntry={!mostrarPassword}
                  style={styles.input}
                />
                <Pressable
                  onPress={() => setMostrarPassword((v) => !v)}
                  hitSlop={8}
                  style={styles.togglePasswordBtn}>
                  <Ionicons
                    name={mostrarPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={16}
                    color="rgba(255, 255, 255, 0.6)"
                  />
                </Pressable>
              </View>

              <Text style={styles.loginInfoText}>
                Aca podras ver los repositorios y materiales SENA, incluyendo portafolios
                instructor aprendiz.
              </Text>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.loginFooterActions}>
                <Pressable style={styles.btnForgotPassword} onPress={() => setModalVisible(true)}>
                  <Text style={styles.btnForgotPasswordText}>Olvidaste tu contraseña?</Text>
                </Pressable>
                <Pressable
                  style={[styles.btnSubmitArrow, cargando && styles.btnSubmitArrowDisabled]}
                  onPress={handleSubmit}
                  disabled={cargando}>
                  {cargando ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <Text style={styles.btnSubmitArrowText}>→</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </BlurView>

          <View style={styles.supportBar}>
            <View style={styles.supportMeta}>
              <Text style={styles.supportTitle}>Necesitas ayuda?</Text>
              <Text style={styles.supportSubtitle}>da click aquí!!</Text>
            </View>
            <Pressable style={styles.supportActionBtn} onPress={abrirSofiaPlus}>
              <Text style={styles.supportActionText}>click</Text>
              <View style={styles.arrowCircle}>
                <Text style={styles.arrowCircleText}>→</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Panel derecho */}
        <View style={styles.rightPanel}>
          <View style={{ width: '70%', maxWidth: 360 }}>
            <TarjetaFecha />
          </View>
        </View>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={cerrarModal}>
        <Pressable style={modalStyles.backdrop} onPress={cerrarModal}>
          <Pressable style={modalStyles.card} onPress={(e) => e.stopPropagation()}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={modalStyles.title}>Recuperar contraseña</Text>

              {errorModal ? <Text style={modalStyles.error}>{errorModal}</Text> : null}
              {mensajeModal ? <Text style={modalStyles.success}>{mensajeModal}</Text> : null}

              {pasoModal === 'correo' ? (
                <>
                  <Text style={modalStyles.label}>
                    Ingresa tu correo (personal o del SENA) y te mandamos un código.
                  </Text>
                  <TextInput
                    value={correoRecuperacion}
                    onChangeText={setCorreoRecuperacion}
                    placeholder="tucorreo@ejemplo.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={modalStyles.input}
                  />
                  <Pressable
                    style={[modalStyles.button, cargandoModal && { opacity: 0.6 }]}
                    onPress={enviarCodigo}
                    disabled={cargandoModal}>
                    {cargandoModal ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={modalStyles.buttonText}>Enviar código</Text>
                    )}
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={modalStyles.label}>
                    Ingresa el código de 6 dígitos y tu nueva contraseña.
                  </Text>
                  <TextInput
                    value={codigo}
                    onChangeText={setCodigo}
                    placeholder="123456"
                    keyboardType="number-pad"
                    maxLength={6}
                    style={modalStyles.input}
                  />
                  <View style={modalStyles.passwordRow}>
                    <TextInput
                      value={nuevaContrasena}
                      onChangeText={setNuevaContrasena}
                      placeholder="Nueva contraseña"
                      secureTextEntry={!mostrarNuevaPassword}
                      style={modalStyles.passwordInput}
                    />
                    <Pressable
                      onPress={() => setMostrarNuevaPassword((v) => !v)}
                      hitSlop={8}
                      style={modalStyles.passwordToggleBtn}>
                      <Ionicons
                        name={mostrarNuevaPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={16}
                        color="#8a8a8a"
                      />
                    </Pressable>
                  </View>

                  <View style={modalStyles.requisitosBox}>
                    {requisitosPassword.map((r) => (
                      <Text
                        key={r.label}
                        style={[modalStyles.requisito, r.cumple && modalStyles.requisitoCumplido]}>
                        {r.cumple ? '✓' : '✗'} {r.label}
                      </Text>
                    ))}
                  </View>

                  <Pressable
                    style={[modalStyles.button, cargandoModal && { opacity: 0.6 }]}
                    onPress={confirmarNuevaContrasena}
                    disabled={cargandoModal}>
                    {cargandoModal ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={modalStyles.buttonText}>Cambiar contraseña</Text>
                    )}
                  </Pressable>
                </>
              )}

              <Pressable style={modalStyles.cancelBtn} onPress={cerrarModal}>
                <Text style={modalStyles.cancelText}>Cancelar</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    width: '95%',
    maxWidth: 1180,
    minHeight: 640,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 40,
    overflow: 'hidden',
  },
  leftPanel: {
    width: Platform.OS === 'web' ? '50%' : '100%',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    padding: 30,
    gap: 15,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 28,
    overflow: 'hidden',
  },
  loginCard: {
    padding: 30,
  },
  loginHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandText: {
    fontSize: 26,
    fontWeight: '300',
    letterSpacing: 4,
    color: '#ffffff',
  },
  vMiniLogo: {
    width: 28,
    height: 28,
  },
  loginTitle: {
    fontSize: 30,
    fontWeight: '400',
    color: '#ffffff',
    marginBottom: 20,
  },
  customInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 50,
    paddingVertical: 5,
    paddingHorizontal: 6,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  inputIconWrapper: {
    backgroundColor: '#ffffff',
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputIconGlyph: {
    fontSize: 14,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: 14,
    fontSize: 16,
    outlineStyle: 'none',
  } as never,
  togglePasswordBtn: {
    paddingHorizontal: 10,
  },
  loginInfoText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.45)',
    lineHeight: 19,
    marginVertical: 15,
  },
  errorText: {
    fontSize: 12,
    color: '#ff8080',
    marginBottom: 12,
  },
  loginFooterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  btnForgotPassword: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 22,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  btnForgotPasswordText: {
    color: '#ffffff',
    fontSize: 13,
  },
  btnSubmitArrow: {
    backgroundColor: '#ffffff',
    width: 55,
    height: 40,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSubmitArrowDisabled: {
    opacity: 0.6,
  },
  btnSubmitArrowText: {
    color: '#000000',
    fontSize: 18,
  },
  supportBar: {
    backgroundColor: '#143520',
    borderRadius: 25,
    paddingVertical: 20,
    paddingHorizontal: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  supportMeta: {
    gap: 2,
  },
  supportTitle: {
    fontSize: 19,
    fontWeight: '400',
    color: '#ffffff',
  },
  supportSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  supportActionBtn: {
    backgroundColor: '#ffffff',
    paddingVertical: 5,
    paddingRight: 5,
    paddingLeft: 15,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  supportActionText: {
    color: '#143520',
    fontWeight: '600',
    fontSize: 13,
  },
  arrowCircle: {
    backgroundColor: '#143520',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowCircleText: {
    color: '#ffffff',
    fontSize: 14,
  },
  rightPanel: {
    width: Platform.OS === 'web' ? '50%' : '100%',
    minHeight: Platform.OS === 'web' ? undefined : 260,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Platform.OS === 'web' ? 0 : 20,
  },
});

const URL_SOFIA_PLUS = 'https://www.senasofiaplus.edu.co/';

function abrirSofiaPlus() {
  Linking.openURL(URL_SOFIA_PLUS).catch(() => {});
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    backgroundColor: '#f8f9fa',
    borderRadius: 24,
    padding: 24,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#1a3322', marginBottom: 12 },
  label: { fontSize: 13, color: '#556b5c', marginBottom: 16, lineHeight: 18 },
  error: { color: '#c0392b', fontSize: 13, marginBottom: 12 },
  success: { color: '#146c43', fontSize: 13, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    fontSize: 14,
    color: '#1a3322',
    backgroundColor: '#fff',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#1a3322',
  } as never,
  passwordToggleBtn: {
    paddingHorizontal: 12,
  },
  requisitosBox: {
    marginBottom: 14,
    gap: 4,
  },
  requisito: {
    fontSize: 12,
    color: '#a33b3b',
  },
  requisitoCumplido: {
    color: '#146c43',
  },
  button: {
    backgroundColor: '#8fa47e',
    borderRadius: 15,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  cancelBtn: { alignItems: 'center', marginTop: 14 },
  cancelText: { color: '#888', fontSize: 13 },
});