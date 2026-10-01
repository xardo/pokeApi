import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNote } from '@/context/NoteContext';

export default function NoteDetailsScreen() {
  const { noteCharacter } = useNote();

  if (!noteCharacter) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No hay ningún personaje seleccionado.</Text>
      </View>
    );
  }

  const charData = noteCharacter.character;
  const voiceActors = noteCharacter.voice_actors || [];

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        {charData.images?.jpg?.image_url && (
          <Image
            source={{ uri: charData.images.jpg.image_url }}
            style={styles.characterAvatar}
            resizeMode="cover"
          />
        )}
        <Text style={styles.characterName}>{charData.name.toUpperCase()}</Text>
        <Text style={styles.subtitle}>ID: #{charData.mal_id}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Características</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Rol</Text>
            <Text style={styles.statValue}>{noteCharacter.role}</Text>
            <Text style={styles.statUnit}>
              {noteCharacter.role === 'Main' ? 'Principal' : 'Secundario'}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Favoritos</Text>
            <Text style={styles.statValue}>
              {noteCharacter.favorites ? noteCharacter.favorites.toLocaleString() : '0'}
            </Text>
            <Text style={styles.statUnit}>votos</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actores de Voz</Text>
        {voiceActors.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptySubtext}>Sin actores registrados</Text>
          </View>
        ) : (
          voiceActors.slice(0, 8).map((va, index) => {
            const vaImage = va.person?.images?.jpg?.image_url;
            return (
              <View key={`${va.person?.mal_id || index}-${index}`} style={styles.actorCard}>
                {vaImage ? (
                  <Image
                    source={{ uri: vaImage }}
                    style={styles.actorAvatar}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.actorAvatar, styles.actorPlaceholder]}>
                    <Text style={styles.placeholderText}>🎙️</Text>
                  </View>
                )}

                <View style={styles.actorInfo}>
                  <Text style={styles.actorName}>{va.person?.name || 'Desconocido'}</Text>
                  <Text style={styles.actorLanguage}>{va.language}</Text>
                </View>
              </View>
            );
          })
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
  characterAvatar: {
    width: 120,
    height: 150,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: '#EAEAEA',
  },
  characterName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
  },
  statUnit: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  actorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actorAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
    backgroundColor: '#EAEAEA',
  },
  actorPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  placeholderText: {
    fontSize: 18,
  },
  actorInfo: {
    flex: 1,
  },
  actorName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
  },
  actorLanguage: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptySubtext: {
    color: '#888',
    fontSize: 14,
  },
});
