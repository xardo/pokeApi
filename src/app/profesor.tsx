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

  const currentProfesor: Profesor | null =
    profesores.length > 0 && currentIndex >= 0 && currentIndex < profesores.length
      ? profesores[currentIndex]
      : null;

  const loadData = async (query?: string) => {
    setLoading(true);
    setError('');
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
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar profesor por nombre..."
              placeholderTextColor="#888"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearch}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
              activeOpacity={0.8}
            >
              <Text style={styles.searchButtonText}>b</Text>
            </TouchableOpacity>
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6F00" />
              <Text style={styles.loadingText}>Cargando profesor...</Text>
            </View>
          )}

          {error !== '' && !loading && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {currentProfesor && !loading && (
            <View style={styles.cardContainer}>
              <View style={styles.mainImageFrame}>
                {currentProfesor.imagen ? (
                  <Image
                    source={{ uri: currentProfesor.imagen }}
                    style={styles.mainImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.placeholderText}>Imagen</Text>
                  </View>
                )}
              </View>

              <View style={styles.summaryBox}>
                <Text style={styles.profesorName}>{currentProfesor.nombre}</Text>
                <Text style={styles.summaryTitle}>Resumen</Text>
                <Text style={styles.summaryText} numberOfLines={3}>
                  {currentProfesor.formacion}
                </Text>
              </View>

              <View style={styles.verMasRow}>
                {profesores.length > 1 && (
                  <View style={styles.paginationRow}>
                    <TouchableOpacity
                      onPress={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentIndex === 0}
                      style={[
                        styles.pageNavBtn,
                        currentIndex === 0 && styles.pageNavBtnDisabled,
                      ]}
                    >
                      <Text style={styles.pageNavText}>◀</Text>
                    </TouchableOpacity>
                    <Text style={styles.pageIndicator}>
                      {currentIndex + 1} / {profesores.length}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        setCurrentIndex((prev) => Math.min(profesores.length - 1, prev + 1))
                      }
                      disabled={currentIndex === profesores.length - 1}
                      style={[
                        styles.pageNavBtn,
                        currentIndex === profesores.length - 1 && styles.pageNavBtnDisabled,
                      ]}
                    >
                      <Text style={styles.pageNavText}>▶</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.verMasBtn}
                  onPress={() => setViewMode('details')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.verMasText}>ver mas</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {viewMode === 'details' && currentProfesor && (
        <View style={styles.detailsContainer}>
          <View style={styles.detailImageFrame}>
            {currentProfesor.imagen ? (
              <Image
                source={{ uri: currentProfesor.imagen }}
                style={styles.detailImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderText}>imagen</Text>
              </View>
            )}
          </View>

          <Text style={styles.detailName}>{currentProfesor.nombre}</Text>

          <View style={styles.profileBoxContainer}>
            <Text style={styles.profileHeader}>Todo el Perfil</Text>
            <ScrollView
              style={styles.profileScrollView}
              contentContainerStyle={styles.profileScrollContent}
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.profileSubhead}>Formación Académica y Trayectoria:</Text>
              <Text style={styles.profileBodyText}>{currentProfesor.formacion}</Text>
            </ScrollView>
          </View>

          <View style={styles.regresarRow}>
            <TouchableOpacity
              style={styles.regresarBtn}
              onPress={() => setViewMode('summary')}
              activeOpacity={0.8}
            >
              <Text style={styles.regresarText}>regresar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderWidth: 2,
    borderColor: '#333333',
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#111111',
    backgroundColor: '#FAFAFA',
  },
  searchButton: {
    width: 48,
    height: 48,
    borderWidth: 2,
    borderColor: '#D32F2F',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  searchButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D32F2F',
  },
  loadingContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666666',
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#EF9A9A',
    padding: 12,
    borderRadius: 6,
    marginVertical: 12,
  },
  errorText: {
    color: '#C62828',
    textAlign: 'center',
    fontSize: 14,
  },
  cardContainer: {
    alignItems: 'center',
  },
  mainImageFrame: {
    width: '100%',
    height: 220,
    borderWidth: 3,
    borderColor: '#0288D1',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E1F5FE',
    marginBottom: 16,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0288D1',
  },
  summaryBox: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#333333',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#FFFFFF',
    marginBottom: 14,
  },
  profesorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111111',
    marginBottom: 6,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555555',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333333',
  },
  verMasRow: {
    width: '100%',
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
  pageNavBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#EEEEEE',
    borderRadius: 4,
  },
  pageNavBtnDisabled: {
    opacity: 0.3,
  },
  pageNavText: {
    fontSize: 14,
    color: '#333333',
  },
  pageIndicator: {
    fontSize: 12,
    color: '#666666',
  },
  verMasBtn: {
    borderWidth: 2,
    borderColor: '#2E7D32',
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-end',
  },
  verMasText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  detailsContainer: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  detailImageFrame: {
    width: 120,
    height: 120,
    borderWidth: 3,
    borderColor: '#0288D1',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E1F5FE',
    marginBottom: 10,
  },
  detailImage: {
    width: '100%',
    height: '100%',
  },
  detailName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111111',
    marginBottom: 12,
    textAlign: 'center',
  },
  profileBoxContainer: {
    flex: 1,
    width: '100%',
    borderWidth: 2,
    borderColor: '#222222',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FAFAFA',
    marginBottom: 12,
  },
  profileHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111111',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
    paddingBottom: 6,
  },
  profileScrollView: {
    flex: 1,
  },
  profileScrollContent: {
    paddingBottom: 16,
  },
  profileSubhead: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 6,
  },
  profileBodyText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#222222',
  },
  regresarRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  regresarBtn: {
    borderWidth: 2,
    borderColor: '#2E7D32',
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  regresarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
});
