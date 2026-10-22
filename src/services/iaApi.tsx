import { GET_IA_BASE_URL, GET_IA_LOCAL_BASE_URL } from '@/constants/apiConfig';

export type IAMode = 'restricted' | 'free';
export type IAProvider = 'flash' | 'lite' | 'gemma' | 'groq' | 'llama-8b';
export type IATimeoutSeconds = 20 | 40 | 80 | 160;

export interface IALimitInfo {
  limit: number;
  used: number;
  remaining: number;
  isExceeded: boolean;
}

export interface IAResponse {
  question: string;
  mode: IAMode;
  modeDescription: string;
  provider?: string;
  model: string;
  answer: string;
  limitInfo?: IALimitInfo;
  sources?: {
    pokemon: string;
    anime: string;
    allowedPokemons?: string[];
    allowedCharacters?: string[];
  };
  timestamp: string;
}

export interface IAContextData {
  descripcion: string;
  pokemonSource: string;
  animeSource: string;
  totalPokemons: number;
  totalCharacters: number;
  pokemons: string[];
  characters: string[];
}

/**
 * Envía una pregunta al Microservicio de Inteligencia Artificial (Render o Local)
 * parametrizando desde el frontend:
 * - El modo ('restricted' | 'free')
 * - El proveedor de IA ('gemini' | 'openai' | 'deepseek')
 * - El tiempo de espera / timeout (20s, 40s, 80s, 160s)
 */
export async function askIA(
  question: string,
  mode: IAMode = 'restricted',
  provider: IAProvider = 'flash',
  timeoutSeconds: IATimeoutSeconds = 20,
  customApiKey?: string
): Promise<IAResponse> {
  const cleanQuestion = question.trim();
  if (!cleanQuestion) {
    throw new Error('Debes escribir una pregunta para consultar a la Inteligencia Artificial.');
  }

  const urlsToTry = [GET_IA_BASE_URL(provider), GET_IA_LOCAL_BASE_URL(provider)].filter(
    (u, idx, arr) => Boolean(u) && arr.indexOf(u) === idx
  );

  let lastError: Error | null = null;
  const timeoutMs = timeoutSeconds * 1000;

  for (const baseUrl of urlsToTry) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };
      if (customApiKey && customApiKey.trim() !== '') {
        headers['X-Gemini-Api-Key'] = customApiKey.trim();
        headers['X-Api-Key'] = customApiKey.trim();
      }

      const response = await fetch(`${baseUrl}/ask`, {
        method: 'POST',
        signal: controller.signal,
        headers,
        body: JSON.stringify({
          question: cleanQuestion,
          mode,
          provider,
          apiKey: customApiKey?.trim() || undefined,
        }),
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => null);

      if (response.ok && data) {
        return data as IAResponse;
      }

      throw new Error(data?.error || `Error ${response.status} en el microservicio de IA`);
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        lastError = new Error(
          `Tiempo de espera agotado (${timeoutSeconds} segundos). El servidor no respondió dentro del límite parametrizado.`
        );
      } else {
        lastError = new Error(err?.message || 'No se pudo conectar con el microservicio de IA.');
      }
    }
  }

  throw (
    lastError ||
    new Error(
      'No se pudo conectar con el microservicio de IA. Verifica la conexion o el tiempo de espera.'
    )
  );
}

/**
 * Obtiene la informacion del limite de preguntas permitidas
 */
export async function getIALimit(): Promise<IALimitInfo> {
  const urlsToTry = [GET_IA_BASE_URL(), GET_IA_LOCAL_BASE_URL()].filter(
    (u, idx, arr) => Boolean(u) && arr.indexOf(u) === idx
  );

  for (const baseUrl of urlsToTry) {
    try {
      const response = await fetch(`${baseUrl}/limit`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (response.ok) {
        return (await response.json()) as IALimitInfo;
      }
    } catch {}
  }

  return { limit: 10, used: 0, remaining: 10, isExceeded: false };
}

/**
 * Obtiene la lista de los 10 Pokémon y 10 personajes de Anime que están cargados en la base de datos propia
 */
export async function getIAContext(): Promise<IAContextData> {
  const urlsToTry = [GET_IA_BASE_URL(), GET_IA_LOCAL_BASE_URL()].filter(
    (u, idx, arr) => Boolean(u) && arr.indexOf(u) === idx
  );

  for (const baseUrl of urlsToTry) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(`${baseUrl}/context`, {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        return (await response.json()) as IAContextData;
      }
    } catch {
      clearTimeout(timeoutId);
    }
  }

  throw new Error('No se pudo obtener el contexto del microservicio de IA');
}
