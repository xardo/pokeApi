import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  askIA,
  getIAContext,
  getIALimit,
  IAContextData,
  IALimitInfo,
  IAMode,
  IAProvider,
  IAResponse,
  IATimeoutSeconds,
} from '@/services/iaApi';

const DEFAULT_POKEMONS = [
  'bulbasaur',
  'ivysaur',
  'venusaur',
  'charmander',
  'charmeleon',
  'charizard',
  'squirtle',
  'wartortle',
  'blastoise',
  'caterpie',
];

const DEFAULT_CHARACTERS = [
  'Lawliet, L',
  'Ryuk',
  'Yagami, Light',
  'Aizawa, Yumi',
  'Aizawa, Shuuichi',
  'Aizawa, Eriko',
  'Amane, Misa',
  'Armonia Justin Beyondormason',
  'Block, Kyle',
  'Bullook, Halle',
];

const TIMEOUT_OPTIONS: IATimeoutSeconds[] = [20, 40, 80, 160];

const PROVIDER_OPTIONS: { id: IAProvider; label: string; desc: string }[] = [
  { id: 'flash', label: 'Gemini 3.8 Flash', desc: 'gemini-3.8-flash (Estandar)' },
  { id: 'lite', label: 'Gemini Flash Lite', desc: 'gemini-3.1-flash-lite (Ligero)' },
  { id: 'gemma', label: 'Gemma 4', desc: 'gemma-4-26b (Open Model)' },
];

export default function IAScreen() {
  const [question, setQuestion] = useState('');
  const [mode, setMode] = useState<IAMode>('restricted');
  const [provider, setProvider] = useState<IAProvider>('flash');
  const [timeoutSeconds, setTimeoutSeconds] = useState<IATimeoutSeconds>(20);
  const [loading, setLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState('');
  const [lastResult, setLastResult] = useState<IAResponse | null>(null);
  const [history, setHistory] = useState<IAResponse[]>([]);
  const [contextData, setContextData] = useState<IAContextData | null>(null);
  const [limitInfo, setLimitInfo] = useState<IALimitInfo>({
    limit: 10,
    used: 0,
    remaining: 10,
    isExceeded: false,
  });
  const [showDbModal, setShowDbModal] = useState(false);

  useEffect(() => {
    getIAContext()
      .then((ctx) => setContextData(ctx))
      .catch(() => {});

    getIALimit()
      .then((lim) => setLimitInfo(lim))
      .catch(() => {});
  }, []);

  const handleAsk = async () => {
    if (mode === 'restricted' && limitInfo.isExceeded) {
      setError(
        `Has alcanzado el limite maximo de ${limitInfo.limit} preguntas para la Base de Datos. Puedes cambiar al modo General para seguir consultando.`
      );
      return;
    }

    if (!question.trim()) {
      setError('Ingresa una pregunta.');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setElapsedTime(0);
    setError('');

    const start = Date.now();
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    try {
      const response = await askIA(question.trim(), mode, provider, timeoutSeconds);
      setLastResult(response);
      if (response.limitInfo) {
        setLimitInfo(response.limitInfo);
      } else if (mode === 'restricted') {
        setLimitInfo((prev) => ({
          ...prev,
          used: prev.used + 1,
          remaining: Math.max(0, prev.remaining - 1),
          isExceeded: prev.used + 1 >= prev.limit,
        }));
      }
      setHistory((prev) => [response, ...prev.slice(0, 9)]);
    } catch (err: any) {
      setError(err?.message || 'Error al consultar el servicio.');
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  };

  const pokemonsList = contextData?.pokemons || DEFAULT_POKEMONS;
  const charactersList = contextData?.characters || DEFAULT_CHARACTERS;

  return (
    <View style={styles.mainWrapper}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerTitleBox}>
            <Text style={styles.title}>Consulta de IA</Text>
            <Text style={styles.subtitle}>Microservicio de consultas</Text>
          </View>

          <View style={styles.headerRightActions}>
            <View
              style={[
                styles.limitPill,
                mode === 'free' && styles.limitPillFree,
                mode === 'restricted' && limitInfo.isExceeded && styles.limitPillExceeded,
              ]}
            >
              <Text
                style={[
                  styles.limitPillText,
                  mode === 'free' && styles.limitPillTextFree,
                  mode === 'restricted' && limitInfo.isExceeded && styles.limitPillTextExceeded,
                ]}
              >
                {mode === 'restricted'
                  ? `${limitInfo.remaining} / ${limitInfo.limit} en BD`
                  : 'Consultas libres'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.dbBadgeBtn}
              onPress={() => setShowDbModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.dbBadgeBtnText}>Registros BD</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Parametrizacion del Servicio de Inteligencia Artificial (Gemini Flash, Gemini Pro, Gemma) */}
        <View style={styles.paramCard}>
          <Text style={styles.paramSectionLabel}>Modelo de Inteligencia Artificial (Google AI Studio):</Text>
          <View style={styles.paramRow}>
            {PROVIDER_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.providerBtn,
                  provider === item.id && styles.providerBtnActive,
                ]}
                onPress={() => setProvider(item.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.providerBtnText,
                    provider === item.id && styles.providerBtnTextActive,
                  ]}
                >
                  {item.label}
                </Text>
                <Text
                  style={[
                    styles.providerSubText,
                    provider === item.id && styles.providerBtnTextActive,
                  ]}
                >
                  {item.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Parametrizacion del Tiempo de Espera (20s, 40s, 80s, 160s) */}
        <View style={styles.paramCard}>
          <View style={styles.timeoutHeaderRow}>
            <Text style={styles.paramSectionLabel}>Tiempo de espera del backend (timeout):</Text>
            <Text style={styles.timeoutCurrentLabel}>{timeoutSeconds}s maximo</Text>
          </View>
          <View style={styles.paramRow}>
            {TIMEOUT_OPTIONS.map((sec) => (
              <TouchableOpacity
                key={sec}
                style={[
                  styles.timeoutBtn,
                  timeoutSeconds === sec && styles.timeoutBtnActive,
                ]}
                onPress={() => setTimeoutSeconds(sec)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.timeoutBtnText,
                    timeoutSeconds === sec && styles.timeoutBtnTextActive,
                  ]}
                >
                  {sec} seg
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Modo de consulta: Base de Datos vs General */}
        <View style={styles.modeSelectorCard}>
          <Text style={styles.modeSectionLabel}>Modo de consulta:</Text>
          <View style={styles.modeButtonsRow}>
            <TouchableOpacity
              style={[
                styles.modeBtn,
                mode === 'restricted' && styles.modeBtnRestrictedActive,
              ]}
              onPress={() => setMode('restricted')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modeBtnTitle,
                  mode === 'restricted' && styles.modeBtnTextActive,
                ]}
              >
                Base de Datos
              </Text>
              <Text
                style={[
                  styles.modeBtnSubtitle,
                  mode === 'restricted' && styles.modeBtnTextActive,
                ]}
              >
                Pokemon y Anime (10/10)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeBtn,
                mode === 'free' && styles.modeBtnFreeActive,
              ]}
              onPress={() => setMode('free')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modeBtnTitle,
                  mode === 'free' && styles.modeBtnTextActive,
                ]}
              >
                General
              </Text>
              <Text
                style={[
                  styles.modeBtnSubtitle,
                  mode === 'free' && styles.modeBtnTextActive,
                ]}
              >
                Sin filtro
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pantalla de respuesta */}
        <View style={styles.displayScreenOuter}>
          <View style={styles.displayScreenHeader}>
            <Text style={styles.displayScreenHeaderText}>
              {lastResult ? `Respuesta (${lastResult.provider || provider} - ${lastResult.model})` : 'Respuesta'}
            </Text>
            {lastResult && (
              <View
                style={[
                  styles.statusPill,
                  lastResult.mode === 'restricted'
                    ? styles.statusPillRestricted
                    : styles.statusPillFree,
                ]}
              >
                <Text style={styles.statusPillText}>
                  {lastResult.mode === 'restricted' ? 'Base de Datos' : 'General'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.displayScreenInner}>
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#2E7D32" />
                <Text style={styles.loadingText}>
                  Consultando {provider.toUpperCase()}... ({elapsedTime}s / {timeoutSeconds}s)
                </Text>
              </View>
            ) : error !== '' ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>Error</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : lastResult ? (
              <View>
                <Text style={styles.questionAskedLabel}>
                  Consulta: {lastResult.question}
                </Text>
                <Text style={styles.answerText}>{lastResult.answer}</Text>
              </View>
            ) : (
              <View style={styles.emptyStateBox}>
                <Text style={styles.emptyQuestionMark}>¿?</Text>
                <Text style={styles.emptyStateText}>
                  Escribe una consulta en el campo inferior.
                </Text>
              </View>
            )}
          </View>

          {lastResult && !loading && (
            <View style={styles.displayFooterRow}>
              <Text style={styles.sourceInfoText}>
                Servicio: {lastResult.provider || provider} | Modelo: {lastResult.model}
              </Text>
              <TouchableOpacity
                style={styles.clearResultBtn}
                onPress={() => {
                  setLastResult(null);
                  setQuestion('');
                  setError('');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.clearResultBtnText}>Limpiar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.inputBarContainer}>
          <TextInput
            style={styles.questionInput}
            placeholder={
              mode === 'restricted'
                ? 'Consultar sobre Pokemon o Death Note...'
                : 'Escribe tu consulta...'
            }
            placeholderTextColor="#888888"
            value={question}
            onChangeText={setQuestion}
            onSubmitEditing={handleAsk}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            onPress={handleAsk}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.sendButtonText}>Enviar</Text>
          </TouchableOpacity>
        </View>

        {history.length > 1 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Consultas anteriores</Text>
            {history.slice(1).map((item, idx) => (
              <View key={idx} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyQ} numberOfLines={1}>
                    {item.question}
                  </Text>
                  <Text style={styles.historyModeTag}>
                    {item.provider || 'IA'} - {item.mode === 'restricted' ? 'BD' : 'General'}
                  </Text>
                </View>
                <Text style={styles.historyA} numberOfLines={3}>
                  {item.answer}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showDbModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDbModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registros en Base de Datos</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowDbModal(false)}
              >
                <Text style={styles.modalCloseBtnText}>Cerrar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.dbGroupTitle}>Pokemon registrados:</Text>
              <View style={styles.tagsWrap}>
                {pokemonsList.map((p, i) => (
                  <View key={i} style={styles.pokemonTag}>
                    <Text style={styles.pokemonTagText}>
                      #{i + 1} {p.toUpperCase()}
                    </Text>
                  </View>
                ))}
              </View>

              <Text style={styles.dbGroupTitle}>Personajes de Death Note:</Text>
              <View style={styles.tagsWrap}>
                {charactersList.map((c, i) => (
                  <View key={i} style={styles.animeTag}>
                    <Text style={styles.animeTagText}>
                      #{i + 1} {c}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  container: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitleBox: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  subtitle: {
    fontSize: 12,
    color: '#555555',
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  limitPill: {
    backgroundColor: '#E0F2F1',
    borderWidth: 1,
    borderColor: '#00796B',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  limitPillFree: {
    backgroundColor: '#E3F2FD',
    borderColor: '#1565C0',
  },
  limitPillExceeded: {
    backgroundColor: '#FFEBEE',
    borderColor: '#C62828',
  },
  limitPillText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#004D40',
  },
  limitPillTextFree: {
    color: '#0D47A1',
  },
  limitPillTextExceeded: {
    color: '#C62828',
  },
  dbBadgeBtn: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#2E7D32',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  dbBadgeBtnText: {
    color: '#1B5E20',
    fontWeight: 'bold',
    fontSize: 12,
  },
  paramCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  paramSectionLabel: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#444444',
    marginBottom: 6,
  },
  timeoutHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeoutCurrentLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 6,
  },
  paramRow: {
    flexDirection: 'row',
    gap: 6,
  },
  providerBtn: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  providerBtnActive: {
    backgroundColor: '#1B5E20',
    borderColor: '#1B5E20',
  },
  providerBtnText: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  },
  providerSubText: {
    fontSize: 9.5,
    color: '#777777',
    marginTop: 2,
    textAlign: 'center',
  },
  providerBtnTextActive: {
    color: '#FFFFFF',
  },
  timeoutBtn: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
  },
  timeoutBtnActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#1B5E20',
  },
  timeoutBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333333',
  },
  timeoutBtnTextActive: {
    color: '#FFFFFF',
  },
  modeSelectorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modeSectionLabel: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#444444',
    marginBottom: 6,
  },
  modeButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  modeBtn: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  modeBtnRestrictedActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#1B5E20',
  },
  modeBtnFreeActive: {
    backgroundColor: '#1565C0',
    borderColor: '#0D47A1',
  },
  modeBtnTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  },
  modeBtnSubtitle: {
    fontSize: 10,
    color: '#666666',
    marginTop: 2,
    textAlign: 'center',
  },
  modeBtnTextActive: {
    color: '#FFFFFF',
  },
  displayScreenOuter: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2E7D32',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    minHeight: 180,
    justifyContent: 'space-between',
  },
  displayScreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  displayScreenHeaderText: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillRestricted: {
    backgroundColor: '#E8F5E9',
  },
  statusPillFree: {
    backgroundColor: '#E3F2FD',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  displayScreenInner: {
    borderWidth: 1.5,
    borderColor: '#4CAF50',
    backgroundColor: '#F9FBF9',
    borderRadius: 8,
    padding: 12,
    minHeight: 110,
    justifyContent: 'center',
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  loadingText: {
    marginTop: 8,
    color: '#2E7D32',
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorBox: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#C62828',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12.5,
    color: '#B71C1C',
    textAlign: 'center',
    lineHeight: 17,
  },
  questionAskedLabel: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#555555',
    marginBottom: 6,
  },
  answerText: {
    fontSize: 13.5,
    color: '#1E1E1E',
    lineHeight: 20,
  },
  emptyStateBox: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  emptyQuestionMark: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 12,
    color: '#555555',
    textAlign: 'center',
  },
  displayFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  sourceInfoText: {
    fontSize: 10.5,
    color: '#666666',
    flex: 1,
  },
  clearResultBtn: {
    borderWidth: 1,
    borderColor: '#E53935',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  clearResultBtnText: {
    color: '#E53935',
    fontWeight: 'bold',
    fontSize: 11,
  },
  inputBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#222222',
    borderRadius: 8,
    padding: 3,
    marginBottom: 14,
  },
  questionInput: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 10,
    fontSize: 13.5,
    color: '#222222',
  },
  sendButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    height: 42,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  historySection: {
    marginTop: 2,
  },
  historyTitle: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#444444',
    marginBottom: 6,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
    gap: 8,
  },
  historyQ: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#222222',
    flex: 1,
  },
  historyModeTag: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#2E7D32',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  historyA: {
    fontSize: 11.5,
    color: '#555555',
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222222',
  },
  modalCloseBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#EEEEEE',
    borderRadius: 6,
  },
  modalCloseBtnText: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#444444',
  },
  dbGroupTitle: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginTop: 6,
    marginBottom: 6,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  pokemonTag: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#81C784',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  pokemonTagText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  animeTag: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#E57373',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  animeTagText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#B71C1C',
  },
});
