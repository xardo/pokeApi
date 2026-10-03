import { Slot, usePathname, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PokemonProvider } from '@/context/PokemonContext';
import { NoteProvider } from '@/context/NoteContext';

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();

  const isPokemon = pathname === '/' || pathname === '/search';
  const isPokemonDetails = pathname === '/details';
  const isNote = pathname === '/note';
  const isNoteDetails = pathname === '/note-details';
  const isProfesor = pathname === '/profesor';

  return (
    <PokemonProvider>
      <NoteProvider>
        <View style={styles.screen}>
          <View style={styles.content}>
            <Slot />
          </View>

          <View style={styles.bottomNavContainer}>
            <TouchableOpacity
              style={[styles.navButton, isPokemon && styles.navButtonActive]}
              onPress={() => router.replace('/')}
            >
              <Text style={[styles.navButtonText, isPokemon && styles.navButtonTextActive]}>
                Pokémon
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navButton, isPokemonDetails && styles.navButtonActive]}
              onPress={() => router.replace('/details')}
            >
              <Text style={[styles.navButtonText, isPokemonDetails && styles.navButtonTextActive]}>
                Datos Pokémon
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navButton, isNote && styles.navButtonActive]}
              onPress={() => router.replace('/note')}
            >
              <Text style={[styles.navButtonText, isNote && styles.navButtonTextActive]}>
                Death Note
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navButton, isNoteDetails && styles.navButtonActive]}
              onPress={() => router.replace('/note-details')}
            >
              <Text style={[styles.navButtonText, isNoteDetails && styles.navButtonTextActive]}>
                Datos Death Note
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navButton, isProfesor && styles.navButtonActiveProfesor]}
              onPress={() => router.replace('/profesor' as any)}
            >
              <Text style={[styles.navButtonText, isProfesor && styles.navButtonTextActive]}>
                Profesor
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </NoteProvider>
    </PokemonProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  content: {
    flex: 1,
  },
  bottomNavContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#DDDDDD',
    paddingVertical: 10,
    paddingHorizontal: 6,
    gap: 4,
  },
  navButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonActive: {
    backgroundColor: '#E53935',
    borderColor: '#E53935',
  },
  navButtonActiveProfesor: {
    backgroundColor: '#FF6F00',
    borderColor: '#FF6F00',
  },
  navButtonText: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#555555',
    textAlign: 'center',
  },
  navButtonTextActive: {
    color: '#FFFFFF',
  },
});
