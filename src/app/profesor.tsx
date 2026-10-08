import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Modal,
  Platform,
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

  // Estados para retroalimentación visual (Banner de éxito)
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Estados del Modal Formulario (Crear y Actualizar)
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedProfesorId, setSelectedProfesorId] = useState<number | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formImagen, setFormImagen] = useState('');
  const [formFormacion, setFormFormacion] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [previewError, setPreviewError] = useState(false);

  // Estado del Modal de Confirmación de Eliminación
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [profesorToDelete, setProfesorToDelete] = useState<Profesor | null>(null);
  const [deleting, setDeleting] = useState(false);

  const currentProfesor: Profesor | null =
    profesores.length > 0 && currentIndex >= 0 && currentIndex < profesores.length
      ? profesores[currentIndex]
      : null;

  const showNotification = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => {
      setSuccessBanner(null);
    }, 3500);
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
      setError(err?.message || 'Error al conectar con el microservicio de docentes.');
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

  // Abrir Modal para Crear
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

  // Abrir Modal para Editar
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

  // Guardar (Crear o Actualizar)
  const handleSubmitForm = async () => {
    if (!formNombre.trim()) {
      setFormError('Por favor ingresa el nombre completo del docente.');
      return;
    }
    if (!formImagen.trim()) {
      setFormError('Por favor ingresa la URL de la imagen del docente.');
      return;
    }
    if (!formFormacion.trim()) {
      setFormError('Por favor describe la formación académica del docente.');
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
        showNotification(`✅ Docente "${nuevo.nombre}" creado exitosamente.`);
        await loadData(search.trim(), nuevo.id);
      } else if (modalMode === 'edit' && selectedProfesorId !== null) {
        const actualizado = await updateProfesor(selectedProfesorId, {
          nombre: formNombre.trim(),
          imagen: formImagen.trim(),
          formacion: formFormacion.trim(),
        });
        setModalVisible(false);
        showNotification(`✅ Docente "${actualizado.nombre}" actualizado exitosamente.`);
        await loadData(search.trim(), actualizado.id);
      }
    } catch (err: any) {
      setFormError(err?.message || 'Error al guardar los datos del docente.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Confirmar y Ejecutar Eliminación
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
      showNotification(`🗑️ Docente "${profesorToDelete.nombre}" eliminado correctamente.`);
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
      {/* Banner de Éxito Flotante */}
      {successBanner && (
        <View style={styles.successBanner}>
          <Text style={styles.successBannerText}>{successBanner}</Text>
        </View>
      )}

      {/* ======================================================== */}
      {/* VISTA RESUMEN (TARJETA PRINCIPAL + NAVEGACIÓN CRUD)     */}
      {/* ======================================================== */}
      {viewMode === 'summary' && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Encabezado Superior con Botón "+ Crear" */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Gestión de Docentes</Text>
              <Text style={styles.subtitle}>Microservicio CRUD Uninpahu</Text>
            </View>

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleOpenCreateModal}
              activeOpacity={0.8}
            >
              <Text style={styles.createButtonText}>+ Nuevo</Text>
            </TouchableOpacity>
          </View>

          {/* Barra de Búsqueda */}
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar docente por nombre..."
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
                <Text style={styles.clearSearchText}>✕</Text>
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

          {/* Selector de Chips de Docentes */}
          {profesores.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}
            >
              {profesores.map((p, index) => {
                const isSelected = index === currentIndex;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => {
                      setImageError(false);
                      setCurrentIndex(index);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.chipText, isSelected && styles.chipTextSelected]}
                      numberOfLines={1}
                    >
                      #{p.id} {p.nombre.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Indicador de Carga */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6F00" />
              <Text style={styles.loadingText}>Conectando con el microservicio...</Text>
            </View>
          )}

          {/* Mensaje de Error */}
          {error !== '' && !loading && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => loadData()}
                activeOpacity={0.8}
              >
                <Text style={styles.retryButtonText}>Recargar Lista</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Tarjeta de Docente */}
          {currentProfesor && !loading && (
            <View style={styles.card}>
              <View style={styles.cardTopRow}>
                <View style={styles.badgeId}>
                  <Text style={styles.idText}>Docente #{currentProfesor.id}</Text>
                </View>

                {/* Acciones de Edición y Eliminación en Cabecera */}
                <View style={styles.actionIconsRow}>
                  <TouchableOpacity
                    style={styles.editIconBtn}
                    onPress={() => handleOpenEditModal(currentProfesor)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionIconText}>✏️ Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteIconBtn}
                    onPress={() => handlePromptDelete(currentProfesor)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.deleteIconText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.profesorName}>{currentProfesor.nombre}</Text>

              {/* Imagen del Docente */}
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
                    <Text style={styles.placeholderIcon}>👨‍🏫</Text>
                    <Text style={styles.placeholderText}>Foto de Docente</Text>
                  </View>
                )}
              </View>

              {/* Resumen de Formación */}
              <View style={styles.summaryContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionDot}>●</Text>
                  <Text style={styles.sectionTitle}>Formación y Perfil Académico</Text>
                </View>
                <Text style={styles.summaryText} numberOfLines={3}>
                  {currentProfesor.formacion}
                </Text>
              </View>

              {/* Paginación y Botón "Ver más" */}
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
                  <Text style={styles.verMasBtnText}>Ver más detalle</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* ======================================================== */}
      {/* VISTA DETALLES COMPLETOS DEL DOCENTE                    */}
      {/* ======================================================== */}
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
                  <Text style={styles.avatarIcon}>👨‍🏫</Text>
                </View>
              )}
            </View>

            <Text style={styles.detailsName}>{currentProfesor.nombre}</Text>
            <View style={styles.detailBadge}>
              <Text style={styles.detailBadgeText}>Perfil del Docente #{currentProfesor.id}</Text>
            </View>

            {/* Acciones Rápidas en Vista Detalle */}
            <View style={styles.detailActionsRow}>
              <TouchableOpacity
                style={styles.detailEditBtn}
                onPress={() => handleOpenEditModal(currentProfesor)}
                activeOpacity={0.8}
              >
                <Text style={styles.detailEditBtnText}>✏️ Editar Datos</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.detailDeleteBtn}
                onPress={() => handlePromptDelete(currentProfesor)}
                activeOpacity={0.8}
              >
                <Text style={styles.detailDeleteBtnText}>🗑️ Eliminar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.fullProfileBox}>
              <View style={styles.profileHeaderRow}>
                <Text style={styles.profileSectionTitle}>Trayectoria y Formación Completa</Text>
              </View>

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
              <Text style={styles.regresarBtnText}>◀ Regresar a la Lista</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ======================================================== */}
      {/* MODAL FORMULARIO: CREAR Y ACTUALIZAR DOCENTE            */}
      {/* ======================================================== */}
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
                {modalMode === 'create' ? '➕ Registrar Nuevo Docente' : '✏️ Actualizar Docente'}
              </Text>
              <TouchableOpacity
                onPress={() => !formSubmitting && setModalVisible(false)}
                disabled={formSubmitting}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {formError !== '' && (
                <View style={styles.formErrorBox}>
                  <Text style={styles.formErrorText}>{formError}</Text>
                </View>
              )}

              {/* Campo Nombre */}
              <Text style={styles.label}>Nombre y Título del Docente *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Dr. Carlos Mendoza"
                placeholderTextColor="#999"
                value={formNombre}
                onChangeText={setFormNombre}
                autoCapitalize="words"
              />

              {/* Campo URL Imagen */}
              <Text style={styles.label}>URL de la Fotografía *</Text>
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

              {/* Vista Previa de la Fotografía */}
              {formImagen.trim() !== '' && (
                <View style={styles.previewContainer}>
                  <Text style={styles.previewLabel}>Vista previa de la foto:</Text>
                  {!previewError ? (
                    <Image
                      source={{ uri: formImagen.trim() }}
                      style={styles.previewImage}
                      resizeMode="cover"
                      onError={() => setPreviewError(true)}
                    />
                  ) : (
                    <Text style={styles.previewErrorText}>⚠️ La URL no devuelve una imagen válida</Text>
                  )}
                </View>
              )}

              {/* Campo Formación */}
              <Text style={styles.label}>Formación y Trayectoria Académica *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Escribe los títulos, posgrados, experiencia y asignaturas del docente..."
                placeholderTextColor="#999"
                value={formFormacion}
                onChangeText={setFormFormacion}
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* Botones de Acción */}
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
                      {modalMode === 'create' ? 'Guardar Docente' : 'Actualizar'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL CONFIRMACIÓN DE ELIMINACIÓN                       */}
      {/* ======================================================== */}
      <Modal
        visible={deleteModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => !deleting && setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteConfirmCard}>
            <Text style={styles.deleteAlertIcon}>⚠️</Text>
            <Text style={styles.deleteAlertTitle}>¿Eliminar Docente?</Text>
            <Text style={styles.deleteAlertMessage}>
              ¿Estás seguro de que deseas eliminar a{' '}
              <Text style={{ fontWeight: 'bold' }}>{profesorToDelete?.nombre}</Text>? Esta acción no
              se puede deshacer.
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
                  <Text style={styles.deleteConfirmBtnText}>Sí, Eliminar</Text>
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
  successBanner: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 99,
  },
  successBannerText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
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
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: 46,
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
    fontSize: 16,
    color: '#888888',
    fontWeight: 'bold',
  },
  searchButton: {
    height: 46,
    paddingHorizontal: 16,
    backgroundColor: '#37474F',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  chipsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 10,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CFD8DC',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipSelected: {
    backgroundColor: '#FF6F00',
    borderColor: '#FF6F00',
  },
  chipText: {
    fontSize: 12,
    color: '#455A64',
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFFFFF',
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
    padding: 14,
    alignItems: 'center',
  },
  errorText: {
    color: '#C62828',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#C62828',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeId: {
    backgroundColor: '#ECEFF1',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  idText: {
    fontSize: 12,
    color: '#455A64',
    fontWeight: '700',
  },
  actionIconsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  editIconBtn: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FFE0B2',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  actionIconText: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: 'bold',
  },
  deleteIconBtn: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  deleteIconText: {
    fontSize: 14,
  },
  profesorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 12,
  },
  imageContainer: {
    width: 170,
    height: 170,
    alignSelf: 'center',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FFCC80',
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
    backgroundColor: '#FFF8E1',
    width: '100%',
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 4,
  },
  placeholderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E65100',
  },
  summaryContainer: {
    backgroundColor: '#F9FBFD',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E3ECF5',
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sectionDot: {
    color: '#FF6F00',
    fontSize: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555555',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryText: {
    fontSize: 13.5,
    lineHeight: 20,
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
    width: 34,
    height: 34,
    backgroundColor: '#F1F3F5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navArrowBtnDisabled: {
    opacity: 0.35,
  },
  navArrowText: {
    fontSize: 12,
    color: '#333333',
    fontWeight: 'bold',
  },
  pageIndicator: {
    fontSize: 12.5,
    color: '#666666',
    fontWeight: '600',
  },
  verMasBtn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
  },
  verMasBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  detailsScrollContent: {
    padding: 16,
    paddingBottom: 40,
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
    width: 150,
    height: 150,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FF6F00',
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
    backgroundColor: '#FFF8E1',
    width: '100%',
  },
  avatarIcon: {
    fontSize: 48,
  },
  detailsName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222222',
    textAlign: 'center',
    marginBottom: 4,
  },
  detailBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 14,
  },
  detailBadgeText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '600',
  },
  detailActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  detailEditBtn: {
    backgroundColor: '#FF6F00',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  detailEditBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  detailDeleteBtn: {
    backgroundColor: '#D32F2F',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  detailDeleteBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  fullProfileBox: {
    width: '100%',
    maxHeight: 280,
    backgroundColor: '#F9FBFD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3ECF5',
    padding: 14,
    marginBottom: 18,
  },
  profileHeaderRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8,
    marginBottom: 10,
  },
  profileSectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FF6F00',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  innerScrollView: {
    maxHeight: 200,
  },
  profileBody: {
    fontSize: 14,
    lineHeight: 22,
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
    fontSize: 14,
  },
  // Modal Formulario Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 12,
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#888888',
    fontWeight: 'bold',
  },
  formErrorBox: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  formErrorText: {
    color: '#C62828',
    fontSize: 13,
    fontWeight: '500',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444444',
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#222222',
    marginBottom: 8,
  },
  textArea: {
    minHeight: 90,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 2,
  },
  previewLabel: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 4,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  previewErrorText: {
    fontSize: 11,
    color: '#D32F2F',
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 14,
  },
  cancelModalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#ECEFF1',
  },
  cancelModalBtnText: {
    color: '#455A64',
    fontWeight: '600',
    fontSize: 14,
  },
  saveModalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#FF6F00',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 110,
  },
  saveModalBtnDisabled: {
    opacity: 0.65,
  },
  saveModalBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Modal Confirmación Eliminar
  deleteConfirmCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
  },
  deleteAlertIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  deleteAlertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 8,
  },
  deleteAlertMessage: {
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  deleteActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  deleteCancelBtn: {
    flex: 1,
    backgroundColor: '#ECEFF1',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteCancelBtnText: {
    color: '#455A64',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteConfirmBtn: {
    flex: 1,
    backgroundColor: '#D32F2F',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteConfirmBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
