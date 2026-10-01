import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { usePokemon } from '@/context/PokemonContext';

export default function DetailsScreen() {
  const { pokemon } = usePokemon();

  if (!pokemon) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No hay ningún Pokémon seleccionado.</Text>
      </View>
    );
  }

  const move1 = pokemon.moves?.[0]?.move?.name;
  const move2 = pokemon.moves?.[1]?.move?.name;
  const move3 = pokemon.moves?.[2]?.move?.name;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.pokemonName}>{pokemon.name.toUpperCase()}</Text>
        <Text style={styles.pokemonId}>Número en Pokédex: #{pokemon.id}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Características Físicas</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Altura</Text>
            <Text style={styles.statValue}>{pokemon.height}</Text>
            <Text style={styles.statUnit}>decímetros (dm)</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Peso</Text>
            <Text style={styles.statValue}>{pokemon.weight}</Text>
            <Text style={styles.statUnit}>hectogramos (hg)</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Movimientos / Habilidades</Text>
        <View style={styles.moveCard}>
          <Text style={styles.moveLabel}>Movimiento 1:</Text>
          <Text style={styles.moveValue}>{move1 || 'No disponible'}</Text>
        </View>

        <View style={styles.moveCard}>
          <Text style={styles.moveLabel}>Movimiento 2:</Text>
          <Text style={styles.moveValue}>{move2 || 'No disponible'}</Text>
        </View>

        {move3 && (
          <View style={styles.moveCard}>
            <Text style={styles.moveLabel}>Movimiento 3:</Text>
            <Text style={styles.moveValue}>{move3}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F4F6F8',
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F4F6F8',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#E53935',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  pokemonName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
  },
  pokemonId: {
    fontSize: 15,
    color: '#777',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
  },
  statUnit: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  moveCard: {
    backgroundColor: '#FFF3E0',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moveLabel: {
    fontSize: 14,
    color: '#E65100',
    fontWeight: 'bold',
  },
  moveValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
});
