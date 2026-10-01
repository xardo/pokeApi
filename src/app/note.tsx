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

import {
  getCharacter,
  getCharacterByIndex,
  NoteCharacterItem,
} from '@/services/noteApi';
import { useNote } from '@/context/NoteContext';

export default function NoteScreen() {
  const [noteSearch, setNoteSearch] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteError, setNoteError] = useState('');
  const [noteIndex, setNoteIndex] = useState(0);
  const [noteTotal, setNoteTotal] = useState(0);
  const [prevNote, setPrevNote] = useState<NoteCharacterItem | null>(null);
  const [nextNote, setNextNote] = useState<NoteCharacterItem | null>(null);

  const { noteCharacter, setNoteCharacter } = useNote();

  const loadNote = async (query: string | number) => {
    setNoteLoading(true);
    setNoteError('');
    try {
      const result = await getCharacter(query);
      setNoteCharacter(result.character);
      setNoteIndex(result.index);
      setNoteTotal(result.total);
      setPrevNote(result.prev);
      setNextNote(result.next);
      setNoteSearch(result.character.character.name);
    } catch (err: any) {
      setNoteError(err.message || 'No se pudo consultar el personaje');
    } finally {
      setNoteLoading(false);
    }
  };

  const loadNoteByIndex = async (index: number) => {
    setNoteLoading(true);
    setNoteError('');
    try {
      const result = await getCharacterByIndex(index);
      setNoteCharacter(result.character);
      setNoteIndex(result.index);
      setNoteTotal(result.total);
      setPrevNote(result.prev);
      setNextNote(result.next);
      setNoteSearch(result.character.character.name);
    } catch (err: any) {
      setNoteError(err.message || 'No se pudo consultar el personaje');
    } finally {
      setNoteLoading(false);
    }
  };

  useEffect(() => {
    if (!noteCharacter) {
      loadNoteByIndex(0);
    } else {
      setNoteSearch(noteCharacter.character.name);
      loadNote(noteCharacter.character.name);
    }
  }, []);

  const handleNoteSearch = async () => {
    if (!noteSearch.trim()) {
      setNoteError('Escribe el nombre o ID de un personaje');
      return;
    }
    Keyboard.dismiss();
    await loadNote(noteSearch.trim());
  };

  const handleNoteNext = async () => {
    if (noteIndex < noteTotal - 1) {
      await loadNoteByIndex(noteIndex + 1);
    }
  };

  const handleNotePrevious = async () => {
    if (noteIndex > 0) {
      await loadNoteByIndex(noteIndex - 1);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Buscar Personaje</Text>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Ej: light o 1"
          placeholderTextColor="#999"
          value={noteSearch}
          onChangeText={setNoteSearch}
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={handleNoteSearch}
        />

        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleNoteSearch}
          activeOpacity={0.8}
        >
          <Text style={styles.searchButtonText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {noteLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E53935" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      )}

      {noteError !== '' && !noteLoading && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{noteError}</Text>
        </View>
      )}

      {noteCharacter && !noteLoading && (
        <View style={styles.card}>
          <Text style={styles.pokemonName}>
            {noteCharacter.character.name.toUpperCase()}
          </Text>
          <Text style={styles.pokemonId}>
            #{noteCharacter.character.mal_id}
          </Text>

          <View style={styles.imagesRow}>
            {prevNote && prevNote.character.images?.jpg?.image_url ? (
              <TouchableOpacity
                onPress={() => loadNoteByIndex(noteIndex - 1)}
                style={styles.smallImageContainer}
              >
                <Image
                  source={{ uri: prevNote.character.images.jpg.image_url }}
                  style={styles.sideImage}
                  resizeMode="cover"
                />
                <Text style={styles.imageLabel}>Anterior</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.smallImageContainer}>
                <Text style={styles.noImageText}>-</Text>
              </View>
            )}

            {noteCharacter.character.images?.jpg?.image_url ? (
              <View style={styles.mainImageContainer}>
                <Image
                  source={{ uri: noteCharacter.character.images.jpg.image_url }}
                  style={styles.pokemonImage}
                  resizeMode="cover"
                />
                <Text style={styles.mainImageLabel}>Actual</Text>
              </View>
            ) : (
              <Text style={styles.noImageText}>Sin imagen</Text>
            )}

            {nextNote && nextNote.character.images?.jpg?.image_url ? (
              <TouchableOpacity
                onPress={() => loadNoteByIndex(noteIndex + 1)}
                style={styles.smallImageContainer}
              >
                <Image
                  source={{ uri: nextNote.character.images.jpg.image_url }}
                  style={styles.sideImage}
                  resizeMode="cover"
                />
                <Text style={styles.imageLabel}>Siguiente</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.smallImageContainer}>
                <Text style={styles.noImageText}>-</Text>
              </View>
            )}
          </View>

          <View style={styles.navigationContainer}>
            <TouchableOpacity
              style={[
                styles.navigationButton,
                noteIndex <= 0 && styles.disabledButton,
              ]}
              onPress={handleNotePrevious}
              disabled={noteIndex <= 0}
              activeOpacity={0.8}
            >
              <Text style={styles.navigationButtonText}>Anterior</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.navigationButton,
                noteIndex >= noteTotal - 1 && styles.disabledButton,
              ]}
              onPress={handleNoteNext}
              disabled={noteIndex >= noteTotal - 1}
              activeOpacity={0.8}
            >
              <Text style={styles.navigationButtonText}>Siguiente</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#F4F6F8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 10,
  },
  searchRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#222222',
  },
  searchButton: {
    height: 50,
    paddingHorizontal: 20,
    backgroundColor: '#E53935',
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
    fontSize: 15,
  },
  errorContainer: {
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
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  pokemonName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222222',
    textAlign: 'center',
  },
  pokemonId: {
    fontSize: 14,
    color: '#888888',
    marginTop: 2,
  },
  imagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 15,
    width: '100%',
  },
  mainImageContainer: {
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E53935',
    padding: 5,
  },
  pokemonImage: {
    width: 140,
    height: 140,
    borderRadius: 8,
  },
  smallImageContainer: {
    alignItems: 'center',
    backgroundColor: '#F1F1F1',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CCC',
    padding: 5,
    opacity: 0.85,
  },
  sideImage: {
    width: 75,
    height: 75,
    borderRadius: 6,
  },
  imageLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 3,
  },
  mainImageLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#E53935',
    marginTop: 2,
  },
  noImageText: {
    color: '#888',
    marginVertical: 20,
    paddingHorizontal: 15,
  },
  navigationContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  navigationButton: {
    flex: 1,
    height: 46,
    backgroundColor: '#E53935',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  navigationButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
