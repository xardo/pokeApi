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
import { router } from 'expo-router';

import { getPokemon } from '@/services/pokeApi';
import { usePokemon } from '@/context/PokemonContext';

export default function SearchScreen() {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para el anterior y el siguiente
  const [prevPokemon, setPrevPokemon] = useState<any>(null);
  const [nextPokemon, setNextPokemon] = useState<any>(null);

  const { pokemon, setPokemon } = usePokemon();

  const loadPokemon = async (nameOrId: string | number) => {
    setLoading(true);
    setError('');

    try {
      const data = await getPokemon(nameOrId);
      setPokemon(data);
      setSearch(data.name);

      // Cargar el Pokémon anterior (si existe)
      if (data.id > 1) {
        const prevData = await getPokemon(data.id - 1);
        setPrevPokemon(prevData);
      } else {
        setPrevPokemon(null);
      }

      // Cargar el Pokémon siguiente
      const nextData = await getPokemon(data.id + 1);
      setNextPokemon(nextData);

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('No se pudo consultar el Pokémon');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!pokemon) {
      loadPokemon(25); // Pikachu por defecto
    } else {
      setSearch(pokemon.name);
      loadPokemon(pokemon.id);
    }
  }, []);

  const handleSearch = async () => {
    if (!search.trim()) {
      setError('Escribe el nombre o ID de un Pokémon');
      return;
    }
    Keyboard.dismiss();
    await loadPokemon(search.trim());
  };

  const handleNext = async () => {
    if (!pokemon) return;
    await loadPokemon(pokemon.id + 1);
  };

  const handlePrevious = async () => {
    if (!pokemon || pokemon.id <= 1) return;
    await loadPokemon(pokemon.id - 1);
  };

  const goToDetails = () => {
    router.push('/details');
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.searchContainer}>
        <Text style={styles.title}>Buscar Pokémon</Text>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder="Ej: ditto o 25"
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleSearch}
          />

          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
            activeOpacity={0.8}
          >
            <Text style={styles.searchButtonText}>Buscar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E53935" />
          <Text style={styles.loadingText}>Consultando microservicio...</Text>
        </View>
      )}

      {error !== '' && !loading && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {pokemon && !loading && (
        <View style={styles.card}>
          <Text style={styles.pokemonName}>{pokemon.name.toUpperCase()}</Text>
          <Text style={styles.pokemonId}>#{pokemon.id}</Text>

          {/* Contenedor de las 3 imágenes (Anterior, Actual, Siguiente) */}
          <View style={styles.imagesRow}>
            {/* Imagen Anterior */}
            {prevPokemon && prevPokemon.sprites.front_default ? (
              <TouchableOpacity onPress={() => loadPokemon(prevPokemon.id)} style={styles.smallImageContainer}>
                <Image
                  source={{ uri: prevPokemon.sprites.front_default }}
                  style={styles.sideImage}
                  resizeMode="contain"
                />
                <Text style={styles.imageLabel}>Anterior</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.smallImageContainer}>
                <Text style={styles.noImageText}>-</Text>
              </View>
            )}

            {/* Imagen Principal (Actual) */}
            {pokemon.sprites.front_default ? (
              <View style={styles.mainImageContainer}>
                <Image
                  source={{ uri: pokemon.sprites.front_default }}
                  style={styles.pokemonImage}
                  resizeMode="contain"
                />
                <Text style={styles.mainImageLabel}>Actual</Text>
              </View>
            ) : (
              <Text style={styles.noImageText}>Sin imagen disponible</Text>
            )}

            {/* Imagen Siguiente */}
            {nextPokemon && nextPokemon.sprites.front_default ? (
              <TouchableOpacity onPress={() => loadPokemon(nextPokemon.id)} style={styles.smallImageContainer}>
                <Image
                  source={{ uri: nextPokemon.sprites.front_default }}
                  style={styles.sideImage}
                  resizeMode="contain"
                />
                <Text style={styles.imageLabel}>Siguiente</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.smallImageContainer}>
                <Text style={styles.noImageText}>-</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.detailsButton}
            onPress={goToDetails}
            activeOpacity={0.8}
          >
            <Text style={styles.detailsButtonText}>
              Ver Datos del Pokémon
            </Text>
          </TouchableOpacity>

          <View style={styles.navigationContainer}>
            <TouchableOpacity
              style={[
                styles.navigationButton,
                pokemon.id <= 1 && styles.disabledButton,
              ]}
              onPress={handlePrevious}
              disabled={pokemon.id <= 1}
              activeOpacity={0.8}
            >
              <Text style={styles.navigationButtonText}>Anterior</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navigationButton}
              onPress={handleNext}
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
    backgroundColor: '#F4F6F8',
    padding: 20,
  },
  searchContainer: {
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
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
    marginTop: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666666',
    fontSize: 15,
  },
  errorContainer: {
    marginTop: 20,
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
    marginTop: 24,
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
  },
  smallImageContainer: {
    alignItems: 'center',
    backgroundColor: '#F1F1F1',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CCC',
    padding: 5,
    opacity: 0.8,
  },
  sideImage: {
    width: 75,
    height: 75,
  },
  imageLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
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
  },
  detailsButton: {
    width: '100%',
    backgroundColor: '#1E88E5',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  navigationContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
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