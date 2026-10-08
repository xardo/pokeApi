import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
  createProfesor,
  deleteProfesor,
  getProfesores,
  Profesor,
  updateProfesor,
} from '@/services/profesorApi';

export default function ProfesorScreen() {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'summary' | 'details'>('summary');
  const [imageError, setImageError] = useState(false);

  const [notification, setNotification] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedProfesorId, setSelectedProfesorId] = useState<number | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formImagen, setFormImagen] = useState('');
  const [formFormacion, setFormFormacion] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [previewError, setPreviewError] = useState(false);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [profesorToDelete, setProfesorToDelete] = useState<Profesor | null>(null);
  const [deleting, setDeleting] = useState(false);

  const currentProfesor: Profesor | null =
    profesores.length > 0 && currentIndex >= 0 && currentIndex < profesores.length
      ? profesores[currentIndex]
      : null;

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const loadData = async (query?: string, keepSelectionId?: number) => {
    setLoading(true);
    setError('');
    setImageError(false);
    try {
      const data = await getProfesores(query);
      if (data && data.length > 0) {
        setProfesores(data);
        if (keepSelectionId) {
          const idx = data.findIndex((p) => p.id === keepSelectionId);
          setCurrentIndex(idx >= 0 ? idx : 0);
        } else {
          setCurrentIndex(0);
        }
      } else {
        setProfesores([]);
        if (query) {
          setError(`No se encontraron docentes con el término "${query}".`);
        } else {
          setError('No hay docentes registrados en la base de datos.');
        }
      }
    } catch (err: any) {
      setProfesores([]);
      setError(err?.message || 'Error al conectar con la base de datos.');
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

  const handleClearSearch = () => {
    setSearch('');
    Keyboard.dismiss();
    loadData('');
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedProfesorId(null);
    setFormNombre('');
    setFormImagen('');
    setFormFormacion('');
    setFormError('');
    setPreviewError(false);
    setModalVisible(true);
  };

  const handleOpenEditModal = (prof: Profesor) => {
    setModalMode('edit');
    setSelectedProfesorId(prof.id);
    setFormNombre(prof.nombre);
    setFormImagen(prof.imagen);
    setFormFormacion(prof.formacion);
    setFormError('');
    setPreviewError(false);
    setModalVisible(true);
  };

  const handleSubmitForm = async () => {
    if (!formNombre.trim()) {
      setFormError('Ingresa el nombre del docente.');
      return;
    }
    if (!formImagen.trim()) {
      setFormError('Ingresa la URL de la imagen.');
      return;
    }
    if (!formFormacion.trim()) {
      setFormError('Ingresa la formación académica.');
      return;
    }

    setFormSubmitting(true);
    setFormError('');

    try {
      if (modalMode === 'create') {
        const nuevo = await createProfesor({
          nombre: formNombre.trim(),
          imagen: formImagen.trim(),
          formacion: formFormacion.trim(),
        });
        setModalVisible(false);
        showNotification('Docente registrado correctamente.');
        await loadData(search.trim(), nuevo.id);
      } else if (modalMode === 'edit' && selectedProfesorId !== null) {
        const actualizado = await updateProfesor(selectedProfesorId, {
          nombre: formNombre.trim(),
          imagen: formImagen.trim(),
          formacion: formFormacion.trim(),
        });
        setModalVisible(false);
        showNotification('Docente actualizado correctamente.');
        await loadData(search.trim(), actualizado.id);
      }
    } catch (err: any) {
      setFormError(err?.message || 'Error al guardar los datos.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handlePromptDelete = (prof: Profesor) => {
    setProfesorToDelete(prof);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!profesorToDelete) return;
    setDeleting(true);
    try {
      await deleteProfesor(profesorToDelete.id);
      setDeleteModalVisible(false);
      showNotification('Docente eliminado correctamente.');
      setProfesorToDelete(null);
      await loadData(search.trim());
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo eliminar el docente.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      {notification && (
        <View style={styles.notificationBanner}>
          <Text style={styles.notificationText}>{notification}</Text>
        </View>
      )}

      {viewMode === 'summary' && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Docentes</Text>
              <Text style={styles.subtitle}>Gestión académica</Text>
            </View>

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleOpenCreateModal}
              activeOpacity={0.8}
            >
              <Text style={styles.createButtonText}>Nuevo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre..."
              placeholderTextColor="#888"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchBtn}
                onPress={handleClearSearch}
                activeOpacity={0.7}
              >
                <Text style={styles.clearSearchText}>Limpiar</Text>
              </TouchableOpacity>
            )}
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
              <Text style={styles.loadingText}>Cargando...</Text>
            </View>
          )}

          {error !== '' && !loading && (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>Error de conexión</Text>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => loadData(search.trim())}
                activeOpacity={0.8}
              >
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          )}

          {currentProfesor && !loading && (
            <View style={styles.card}>
              <View style={styles.cardTopRow}>
                <View style={styles.badgeId}>
                  <Text style={styles.idText}>ID: {currentProfesor.id}</Text>
                </View>

                <View style={styles.actionIconsRow}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => handleOpenEditModal(currentProfesor)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.editBtnText}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handlePromptDelete(currentProfesor)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.deleteBtnText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.profesorName}>{currentProfesor.nombre}</Text>

              <View style={styles.imageContainer}>
                {currentProfesor.imagen && !imageError ? (
                  <Image
                    source={{ uri: currentProfesor.imagen }}
                    style={styles.profesorImage}
                    resizeMode="cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <View style={styles.placeholderContainer}>
                    <Text style={styles.placeholderText}>Sin imagen disponible</Text>
                  </View>
                )}
              </View>

              <View style={styles.summaryContainer}>
                <Text style={styles.sectionTitle}>Formación académica</Text>
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
                      <Text style={styles.navArrowText}>Anterior</Text>
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
                      <Text style={styles.navArrowText}>Siguiente</Text>
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
                  <Text style={styles.verMasBtnText}>Ver detalle</Text>
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
                  resizeMode="cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.placeholderText}>Sin imagen</Text>
                </View>
              )}
            </View>

            <Text style={styles.detailsName}>{currentProfesor.nombre}</Text>
            <View style={styles.detailBadge}>
              <Text style={styles.detailBadgeText}>Docente #{currentProfesor.id}</Text>
            </View>

            <View style={styles.detailActionsRow}>
              <TouchableOpacity
                style={styles.detailEditBtn}
                onPress={() => handleOpenEditModal(currentProfesor)}
                activeOpacity={0.8}
              >
                <Text style={styles.detailEditBtnText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.detailDeleteBtn}
                onPress={() => handlePromptDelete(currentProfesor)}
                activeOpacity={0.8}
              >
                <Text style={styles.detailDeleteBtnText}>Eliminar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.fullProfileBox}>
              <Text style={styles.profileSectionTitle}>Perfil y trayectoria</Text>
              <ScrollView
                style={styles.innerScrollView}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                <Text style={styles.profileBody}>{currentProfesor.formacion}</Text>
              </ScrollView>
            </View>

            <TouchableOpacity
              style={styles.regresarBtn}
              onPress={() => setViewMode('summary')}
              activeOpacity={0.8}
            >
              <Text style={styles.regresarBtnText}>Volver</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => !formSubmitting && setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalMode === 'create' ? 'Nuevo docente' : 'Editar docente'}
              </Text>
              <TouchableOpacity
                onPress={() => !formSubmitting && setModalVisible(false)}
                disabled={formSubmitting}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>Cerrar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {formError !== '' && (
                <View style={styles.formErrorBox}>
                  <Text style={styles.formErrorText}>{formError}</Text>
                </View>
              )}

              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre completo"
                placeholderTextColor="#999"
                value={formNombre}
                onChangeText={setFormNombre}
                autoCapitalize="words"
              />

              <Text style={styles.label}>URL de la imagen</Text>
              <TextInput
                style={styles.input}
                placeholder="https://ejemplo.com/foto.jpg"
                placeholderTextColor="#999"
                value={formImagen}
                onChangeText={(text) => {
                  setFormImagen(text);
                  setPreviewError(false);
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />

              {formImagen.trim() !== '' && (
                <View style={styles.previewContainer}>
                  <Text style={styles.previewLabel}>Vista previa:</Text>
                  {!previewError ? (
                    <Image
                      source={{ uri: formImagen.trim() }}
                      style={styles.previewImage}
                      resizeMode="cover"
                      onError={() => setPreviewError(true)}
                    />
                  ) : (
                    <Text style={styles.previewErrorText}>No se pudo cargar la imagen</Text>
                  )}
                </View>
              )}

              <Text style={styles.label}>Formación académica</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descripción del perfil académico..."
                placeholderTextColor="#999"
                value={formFormacion}
                onChangeText={setFormFormacion}
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
              />

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.cancelModalBtn}
                  onPress={() => setModalVisible(false)}
                  disabled={formSubmitting}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelModalBtnText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveModalBtn, formSubmitting && styles.saveModalBtnDisabled]}
                  onPress={handleSubmitForm}
                  disabled={formSubmitting}
                  activeOpacity={0.8}
                >
                  {formSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveModalBtnText}>
                      {modalMode === 'create' ? 'Guardar' : 'Actualizar'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={deleteModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => !deleting && setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteConfirmCard}>
            <Text style={styles.deleteAlertTitle}>Confirmar eliminación</Text>
            <Text style={styles.deleteAlertMessage}>
              ¿Deseas eliminar a {profesorToDelete?.nombre}? Esta acción no se puede deshacer.
            </Text>

            <View style={styles.deleteActionsRow}>
              <TouchableOpacity
                style={styles.deleteCancelBtn}
                onPress={() => setDeleteModalVisible(false)}
                disabled={deleting}
                activeOpacity={0.8}
              >
                <Text style={styles.deleteCancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteConfirmBtn, deleting && { opacity: 0.7 }]}
                onPress={handleConfirmDelete}
                disabled={deleting}
                activeOpacity={0.8}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteConfirmBtnText}>Eliminar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  notificationBanner: {
    backgroundColor: '#2E7D32',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 8,
    zIndex: 99,
  },
  notificationText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222222',
  },
  subtitle: {
    fontSize: 12,
    color: '#777777',
    marginTop: 2,
  },
  createButton: {
    backgroundColor: '#FF6F00',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#222222',
  },
  clearSearchBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  clearSearchText: {
    fontSize: 12,
    color: '#666666',
  },
  searchButton: {
    height: 44,
    paddingHorizontal: 16,
    backgroundColor: '#37474F',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  loadingContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666666',
    fontSize: 13,
  },
  errorBox: {
    marginTop: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#B71C1C',
    marginBottom: 6,
  },
  errorText: {
    color: '#C62828',
    textAlign: 'center',
    fontSize: 13,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#C62828',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeId: {
    backgroundColor: '#ECEFF1',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  idText: {
    fontSize: 11,
    color: '#455A64',
    fontWeight: '600',
  },
  actionIconsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  editBtn: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FFE0B2',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  editBtnText: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '600',
  },
  deleteBtn: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  deleteBtnText: {
    fontSize: 12,
    color: '#C62828',
    fontWeight: '600',
  },
  profesorName: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 12,
  },
  imageContainer: {
    width: 160,
    height: 160,
    alignSelf: 'center',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profesorImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    width: '100%',
  },
  placeholderText: {
    fontSize: 12,
    color: '#64748B',
  },
  summaryContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#334155',
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
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  navArrowBtnDisabled: {
    opacity: 0.35,
  },
  navArrowText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  pageIndicator: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  verMasBtn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  verMasBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  detailsScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 140,
    height: 140,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    width: '100%',
  },
  detailsName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 4,
  },
  detailBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 14,
  },
  detailBadgeText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
  },
  detailActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  detailEditBtn: {
    backgroundColor: '#FF6F00',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  detailEditBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  detailDeleteBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  detailDeleteBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  fullProfileBox: {
    width: '100%',
    maxHeight: 260,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 16,
  },
  profileSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  innerScrollView: {
    maxHeight: 180,
  },
  profileBody: {
    fontSize: 13,
    lineHeight: 20,
    color: '#334155',
  },
  regresarBtn: {
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#94A3B8',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  regresarBtnText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 12,
    color: '#64748B',
  },
  formErrorBox: {
    backgroundColor: '#FFEBEE',
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  formErrorText: {
    color: '#C62828',
    fontSize: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1E293B',
    marginBottom: 8,
  },
  textArea: {
    minHeight: 80,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  previewImage: {
    width: 70,
    height: 70,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  previewErrorText: {
    fontSize: 11,
    color: '#DC2626',
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
  },
  cancelModalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  cancelModalBtnText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 13,
  },
  saveModalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#FF6F00',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 90,
  },
  saveModalBtnDisabled: {
    opacity: 0.6,
  },
  saveModalBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  deleteConfirmCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  deleteAlertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  deleteAlertMessage: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  deleteActionsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  deleteCancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 9,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteCancelBtnText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 13,
  },
  deleteConfirmBtn: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: 9,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteConfirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
});
