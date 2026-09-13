export type Suit = 'S' | 'H' | 'D' | 'C';
export type Rank = 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export interface Card {
  /** Stable identifier, e.g. "14H" for ace of hearts. */
  id: string;
  suit: Suit;
  rank: Rank;
}

export interface Player {
  id: number;
  name: string;
  isHuman: boolean;
  hand: Card[];
  /** True once the player has emptied their hand after the deck ran out. */
  out: boolean;
}

export interface TablePair {
  attack: Card;
  defense: Card | null;
}

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface GameOptions {
  playerCount: 2 | 3 | 4;
  transfer: boolean;
  names: string[];
  humanIndex?: number;
  /** Seat id of the durak from the previous game (that player defends first). */
  previousLoser?: number | null;
  seed: number;
}

export type GamePhase = 'playing' | 'over';

export interface GameResult {
  /** Seat id of the durak, or null on a draw. */
  loser: number | null;
  draw: boolean;
}

export type GameEvent =
  | { type: 'deal' }
  | { type: 'attack'; player: number; card: Card; throwIn: boolean }
  | { type: 'defend'; player: number; card: Card; target: Card }
  | { type: 'transfer'; player: number; card: Card; newDefender: number }
  | { type: 'pickUpDeclared'; player: number }
  | { type: 'pass'; player: number }
  | { type: 'boutEnd'; outcome: 'beaten' | 'pickedUp'; defender: number; cards: TablePair[] }
  | { type: 'draw'; player: number; count: number }
  | { type: 'playerOut'; player: number }
  | { type: 'gameOver'; result: GameResult };

export type Action =
  | { type: 'attack'; player: number; card: string }
  | { type: 'defend'; player: number; card: string; target: string }
  | { type: 'transfer'; player: number; card: string }
  | { type: 'pickUp'; player: number }
  | { type: 'pass'; player: number };

export interface GameState {
  options: GameOptions;
  rng: number;
  players: Player[];
  /** Draw pile. The last element is the top; index 0 is the face-up trump card (drawn last). */
  deck: Card[];
  trumpCard: Card;
  trumpSuit: Suit;
  discard: Card[];
  table: TablePair[];
  /** Primary attacker of the current bout (changes on a transfer). */
  attacker: number;
  defender: number;
  /** Whether the defender has declared a pick-up in this bout. */
  pickingUp: boolean;
  /** Attackers that have passed since the last new card was added to the table. */
  passed: number[];
  /** Upper bound on attack cards for this bout. */
  maxAttackCards: number;
  boutNumber: number;
  phase: GamePhase;
  result: GameResult | null;
  /** Events produced by the most recent action. */
  events: GameEvent[];
  /** Number of actions applied so far. */
  tick: number;
}

export interface LegalMoves {
  /** The seat that must act now, or null when the game is over. */
  actor: number | null;
  attackCards: Card[];
  /** For a defender: map attack card id -> defense cards that beat it. */
  defenseOptions: Record<string, Card[]>;
  transferCards: Card[];
  canPickUp: boolean;
  canPass: boolean;
}
