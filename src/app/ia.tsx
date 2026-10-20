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
  IAResponse,
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

export default function IAScreen() {
  const [question, setQuestion] = useState('');
  const [mode, setMode] = useState<IAMode>('restricted');
  const [loading, setLoading] = useState(false);
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
    if (limitInfo.isExceeded) {
      setError(`Has alcanzado el limite maximo de ${limitInfo.limit} preguntas permitidas.`);
      return;
    }

    if (!question.trim()) {
      setError('Ingresa una pregunta.');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setError('');

    try {
      const response = await askIA(question.trim(), mode);
      setLastResult(response);
      if (response.limitInfo) {
        setLimitInfo(response.limitInfo);
      } else {
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
                limitInfo.isExceeded && styles.limitPillExceeded,
              ]}
            >
              <Text
                style={[
                  styles.limitPillText,
                  limitInfo.isExceeded && styles.limitPillTextExceeded,
                ]}
              >
                {limitInfo.remaining} / {limitInfo.limit} disponibles
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
                Pokemon y Anime
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

        <View style={styles.displayScreenOuter}>
          <View style={styles.displayScreenHeader}>
            <Text style={styles.displayScreenHeaderText}>Respuesta</Text>
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
                <Text style={styles.loadingText}>Procesando consulta...</Text>
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
                {lastResult.mode === 'restricted'
                  ? 'Filtro: PostgreSQL / Firebase'
                  : 'Modo general'}
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
                    {item.mode === 'restricted' ? 'BD' : 'General'}
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
    marginBottom: 12,
  },
  headerTitleBox: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1B5E20',
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
  limitPillExceeded: {
    backgroundColor: '#FFEBEE',
    borderColor: '#C62828',
  },
  limitPillText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#004D40',
  },
  limitPillTextExceeded: {
    color: '#C62828',
  },
  subtitle: {
    fontSize: 12,
    color: '#555555',
    marginTop: 2,
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
  modeSelectorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modeSectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#444444',
    marginBottom: 8,
  },
  modeButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeBtn: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
    borderColor: '#DDDDDD',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
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
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  },
  modeBtnSubtitle: {
    fontSize: 11,
    color: '#666666',
    marginTop: 2,
    textAlign: 'center',
  },
  modeBtnTextActive: {
    color: '#FFFFFF',
  },
  displayScreenOuter: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#2E7D32',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    minHeight: 210,
    justifyContent: 'space-between',
  },
  displayScreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  displayScreenHeaderText: {
    fontSize: 13,
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
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: '#F9FBF9',
    borderRadius: 10,
    padding: 14,
    minHeight: 130,
    justifyContent: 'center',
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginTop: 10,
    color: '#2E7D32',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorBox: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#C62828',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 13,
    color: '#B71C1C',
    textAlign: 'center',
  },
  questionAskedLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555555',
    marginBottom: 8,
  },
  answerText: {
    fontSize: 14,
    color: '#1E1E1E',
    lineHeight: 21,
  },
  emptyStateBox: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  emptyQuestionMark: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 6,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#555555',
    textAlign: 'center',
  },
  displayFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  sourceInfoText: {
    fontSize: 11,
    color: '#666666',
    flex: 1,
  },
  clearResultBtn: {
    borderWidth: 1.5,
    borderColor: '#E53935',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 8,
  },
  clearResultBtnText: {
    color: '#E53935',
    fontWeight: 'bold',
    fontSize: 12,
  },
  inputBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#222222',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  questionInput: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#222222',
  },
  sendButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 18,
    height: 44,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  historySection: {
    marginTop: 4,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#444444',
    marginBottom: 8,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  historyQ: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#222222',
    flex: 1,
  },
  historyModeTag: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2E7D32',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  historyA: {
    fontSize: 12,
    color: '#555555',
    lineHeight: 17,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222222',
  },
  modalCloseBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#EEEEEE',
    borderRadius: 6,
  },
  modalCloseBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#444444',
  },
  dbGroupTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginTop: 8,
    marginBottom: 8,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  pokemonTag: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#81C784',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pokemonTagText: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  animeTag: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#E57373',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  animeTagText: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#B71C1C',
  },
});
