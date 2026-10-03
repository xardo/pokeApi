import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { getProfesores, Profesor } from '@/services/profesorApi';

export default function ProfesorScreen() {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'summary' | 'details'>('summary');
  const [imageError, setImageError] = useState(false);

  const currentProfesor: Profesor | null =
    profesores.length > 0 && currentIndex >= 0 && currentIndex < profesores.length
      ? profesores[currentIndex]
      : null;

  const loadData = async (query?: string) => {
    setLoading(true);
    setError('');
    setImageError(false);
    try {
      const data = await getProfesores(query);
      if (data && data.length > 0) {
        setProfesores(data);
        setCurrentIndex(0);
      } else {
        setProfesores([]);
        setError('No se encontraron profesores con ese criterio.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error al consultar los profesores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = () => {
    Keyboard.dismiss();
    loadData(search.trim());
  };

  return (
    <View style={styles.container}>
      {viewMode === 'summary' && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Profesores</Text>

          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar profesor por nombre..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
              activeOpacity={0.8}
            >
              <Text style={styles.searchButtonText}>Buscar</Text>
            </TouchableOpacity>
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6F00" />
              <Text style={styles.loadingText}>Cargando información...</Text>
            </View>
          )}

          {error !== '' && !loading && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {currentProfesor && !loading && (
            <View style={styles.card}>
              <View style={styles.badgeRow}>
                <Text style={styles.idText}>#{currentProfesor.id}</Text>
              </View>

              <Text style={styles.profesorName}>{currentProfesor.nombre}</Text>

              <View style={styles.imageContainer}>
                {currentProfesor.imagen && !imageError ? (
                  <Image
                    source={{ uri: currentProfesor.imagen }}
                    style={styles.profesorImage}
                    resizeMode="contain"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <View style={styles.placeholderContainer}>
                    <Text style={styles.placeholderIcon}>👨‍🏫</Text>
                    <Text style={styles.placeholderText}>Foto de Docente</Text>
                  </View>
                )}
              </View>

              <View style={styles.summaryContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionDot}>●</Text>
                  <Text style={styles.sectionTitle}>Resumen de Formación</Text>
                </View>
                <Text style={styles.summaryText} numberOfLines={3}>
                  {currentProfesor.formacion}
                </Text>
              </View>

              <View style={styles.footerRow}>
                {profesores.length > 1 ? (
                  <View style={styles.paginationRow}>
                    <TouchableOpacity
                      onPress={() => {
                        setImageError(false);
                        setCurrentIndex((prev) => Math.max(0, prev - 1));
                      }}
                      disabled={currentIndex === 0}
                      style={[
                        styles.navArrowBtn,
                        currentIndex === 0 && styles.navArrowBtnDisabled,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.navArrowText}>◀</Text>
                    </TouchableOpacity>

                    <Text style={styles.pageIndicator}>
                      {currentIndex + 1} de {profesores.length}
                    </Text>

                    <TouchableOpacity
                      onPress={() => {
                        setImageError(false);
                        setCurrentIndex((prev) => Math.min(profesores.length - 1, prev + 1));
                      }}
                      disabled={currentIndex === profesores.length - 1}
                      style={[
                        styles.navArrowBtn,
                        currentIndex === profesores.length - 1 && styles.navArrowBtnDisabled,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.navArrowText}>▶</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View />
                )}

                <TouchableOpacity
                  style={styles.verMasBtn}
                  onPress={() => setViewMode('details')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.verMasBtnText}>Ver más </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {viewMode === 'details' && currentProfesor && (
        <ScrollView
          contentContainerStyle={styles.detailsScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.detailsCard}>
            <View style={styles.avatarContainer}>
              {currentProfesor.imagen && !imageError ? (
                <Image
                  source={{ uri: currentProfesor.imagen }}
                  style={styles.avatarImage}
                  resizeMode="contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarIcon}>👨‍🏫</Text>
                </View>
              )}
            </View>

            <Text style={styles.detailsName}>{currentProfesor.nombre}</Text>
            <View style={styles.detailBadge}>
              <Text style={styles.detailBadgeText}>Perfil del Profesor</Text>
            </View>

            <View style={styles.fullProfileBox}>
              <View style={styles.profileHeaderRow}>
                <Text style={styles.profileSectionTitle}>Todo el Perfil</Text>
              </View>

              <ScrollView
                style={styles.innerScrollView}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                <Text style={styles.profileLabel}>Formación y Trayectoria Académica:</Text>
                <Text style={styles.profileBody}>{currentProfesor.formacion}</Text>
              </ScrollView>
            </View>

            <TouchableOpacity
              style={styles.regresarBtn}
              onPress={() => setViewMode('summary')}
              activeOpacity={0.8}
            >
              <Text style={styles.regresarBtnText}>Regresar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 35,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  searchInput: {
    flex: 1,
    height: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#222222',
  },
  searchButton: {
    height: 50,
    paddingHorizontal: 20,
    backgroundColor: '#FF6F00',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  loadingContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666666',
    fontSize: 14,
  },
  errorBox: {
    marginTop: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    color: '#C62828',
    textAlign: 'center',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 4,
  },
  idText: {
    fontSize: 13,
    color: '#888888',
    fontWeight: '600',
  },
  profesorName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 14,
  },
  imageContainer: {
    width: 160,
    height: 160,
    alignSelf: 'center',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  profesorImage: {
    width: 154,
    height: 154,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
  },
  placeholderIcon: {
    fontSize: 50,
    marginBottom: 6,
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
  },
  summaryContainer: {
    backgroundColor: '#F9FBFD',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E3ECF5',
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  sectionDot: {
    color: '#FF6F00',
    fontSize: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#555555',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333333',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navArrowBtn: {
    width: 36,
    height: 36,
    backgroundColor: '#F1F3F5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navArrowBtnDisabled: {
    opacity: 0.35,
  },
  navArrowText: {
    fontSize: 13,
    color: '#333333',
    fontWeight: 'bold',
  },
  pageIndicator: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  verMasBtn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  verMasBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  detailsScrollContent: {
    padding: 20,
    paddingBottom: 35,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarContainer: {
    width: 140,
    height: 140,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FF6F00',
    marginBottom: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  avatarImage: {
    width: 136,
    height: 136,
  },
  avatarPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
  },
  avatarIcon: {
    fontSize: 48,
  },
  detailsName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222222',
    textAlign: 'center',
    marginBottom: 6,
  },
  detailBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 18,
  },
  detailBadgeText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '600',
  },
  fullProfileBox: {
    width: '100%',
    maxHeight: 280,
    backgroundColor: '#F9FBFD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3ECF5',
    padding: 16,
    marginBottom: 20,
  },
  profileHeaderRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8,
    marginBottom: 10,
  },
  profileSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6F00',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  innerScrollView: {
    maxHeight: 200,
  },
  profileLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555555',
    marginBottom: 6,
  },
  profileBody: {
    fontSize: 14,
    lineHeight: 23,
    color: '#222222',
  },
  regresarBtn: {
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#2E7D32',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  regresarBtnText: {
    color: '#2E7D32',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
