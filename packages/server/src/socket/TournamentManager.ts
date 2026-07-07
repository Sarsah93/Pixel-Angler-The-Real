/**
 * @file TournamentManager.ts
 * @description 거제 벵에돔 토너먼트 등의 실시간 게임 대회 진행 관리자
 */

export interface TournamentContestant {
  playerId: string;
  nickname: string;
  bestLengthCm: number;
}

export class TournamentManager {
  private contestants = new Map<string, TournamentContestant>();
  private tournamentActive = false;

  startTournament(): void {
    this.contestants.clear();
    this.tournamentActive = true;
    console.log('[TournamentManager] A new fishing tournament has started!');
  }

  submitScore(playerId: string, nickname: string, lengthCm: number): void {
    if (!this.tournamentActive) return;

    if (!this.contestants.has(playerId)) {
      this.contestants.set(playerId, {
        playerId,
        nickname,
        bestLengthCm: lengthCm,
      });
    } else {
      const entry = this.contestants.get(playerId)!;
      if (lengthCm > entry.bestLengthCm) {
        entry.bestLengthCm = lengthCm;
      }
    }
  }

  getLeaderboard(): Array<{ nickname: string; score: number }> {
    return Array.from(this.contestants.values())
      .map((c) => ({
        nickname: c.nickname,
        score: c.bestLengthCm,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // 상위 10명만
  }

  endTournament(): void {
    this.tournamentActive = false;
    console.log('[TournamentManager] Tournament has ended.');
  }
}
