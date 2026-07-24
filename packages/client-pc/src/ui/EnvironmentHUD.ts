import Phaser from 'phaser';
import type { FishingEnvironment, TideInfo } from '@tra/core';
import { isNighttime, isGoldenHour, getWindDirectionLabel, getLunarDayDisplay as getCoreLunarDay } from '@tra/core';

// ─────────────────────────────────────────────
// 물때 단계 표시 유틸리티
// ─────────────────────────────────────────────

function getTidePhaseIcon(tide: TideInfo): string {
  if (tide.minutesToNextTide < 30) {
    return tide.nextTideType === 'high' ? '🏝️ 간조(저조)' : '🌊 만조(고조)';
  }
  return tide.nextTideType === 'high' ? '↑ 밀물 진행' : '↓ 썰물 진행';
}

function getLunarDayDisplay(lunarDay: number): string {
  const names: Record<number, string> = {
    1: '삭(1물)', 2: '2물', 3: '3물', 4: '4물', 5: '5물',
    6: '6물', 7: '7물(조금)', 8: '8물(무쉬)', 9: '9물',
    10: '10물', 11: '11물', 12: '12물', 13: '13물',
    14: '14물', 15: '망(사리)', 16: '사리-1', 17: '17물',
    18: '18물', 19: '19물', 20: '20물', 21: '21물(조금)',
    22: '22물', 23: '23물', 24: '24물', 25: '25물',
    26: '26물', 27: '27물', 28: '28물', 29: '그믐', 30: '30물',
  };
  return names[lunarDay] ?? `${lunarDay}물`;
}

// ─────────────────────────────────────────────
// EnvironmentHUD 컴포넌트
// ─────────────────────────────────────────────

export class EnvironmentHUD {
  private container: Phaser.GameObjects.Container;
  private bg!: Phaser.GameObjects.Rectangle;
  private timeText!: Phaser.GameObjects.Text;
  private lunarText!: Phaser.GameObjects.Text;
  private tideText!: Phaser.GameObjects.Text;
  private weatherText!: Phaser.GameObjects.Text;
  private windText!: Phaser.GameObjects.Text;
  private goldenHourBadge!: Phaser.GameObjects.Text;

  private updateTimer: Phaser.Time.TimerEvent | null = null;
  private currentEnv: FishingEnvironment | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.container = scene.add.container(x, y).setDepth(20);
    this.buildUI(scene);
  }

  private buildUI(scene: Phaser.Scene): void {
    // 배경 패널
    this.bg = scene.add.rectangle(0, 0, 220, 130, 0x001133, 0.85)
      .setStrokeStyle(1, 0x3366aa)
      .setOrigin(0, 0);

    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '11px',
      color: '#ccddff',
      fontFamily: 'monospace',
      // 패널(220px) 안에서 줄바꿈 — 긴 물때 라벨/큰 조위값이 우측으로 넘치지 않게 (텍스트 전수조사)
      wordWrap: { width: 200 },
    };

    // 시간 표시
    this.timeText = scene.add.text(10, 8, '⏰ 00:00', { ...style, fontSize: '13px', color: '#ffffff' });

    // 음력/물때 이름
    this.lunarText = scene.add.text(10, 26, '🌙 -물', style);

    // 조위 방향/상태
    this.tideText = scene.add.text(10, 44, '🌊 --', style);

    // 날씨
    this.weatherText = scene.add.text(10, 62, '☁️ --', style);

    // 바람
    this.windText = scene.add.text(10, 80, '💨 -- m/s --', style);

    // 골든타임 배지
    this.goldenHourBadge = scene.add.text(10, 98, '', {
      fontSize: '11px',
      color: '#ffdd44',
      backgroundColor: '#553300',
      padding: { x: 6, y: 3 },
    }).setVisible(false);

    this.container.add([
      this.bg,
      this.timeText,
      this.lunarText,
      this.tideText,
      this.weatherText,
      this.windText,
      this.goldenHourBadge,
    ]);

    // 1분마다 시간 갱신
    this.updateTimer = scene.time.addEvent({
      delay: 60000,
      loop: true,
      callback: () => this.refreshTime(),
    });

    this.refreshTime();
  }

  /** 환경 데이터 업데이트 */
  setEnvironment(env: FishingEnvironment): void {
    this.currentEnv = env;
    this.refreshAll();
  }

  /** 시간 갱신 */
  private refreshTime(): void {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    this.timeText.setText(`⏰ ${hh}:${mm}`);

    if (this.currentEnv) {
      this.updateGoldenHourBadge();
    }
  }

  /** 환경 데이터 기반 전체 갱신 */
  private refreshAll(): void {
    if (!this.currentEnv) return;
    const { tide, weather } = this.currentEnv;

    // 음력
    const lunarDayNum = getCoreLunarDay(this.currentEnv.currentTime);
    this.lunarText.setText(`🌙 ${getLunarDayDisplay(lunarDayNum)} (${tide.tidePhaseLabel})`);

    // 조위
    this.tideText.setText(`${getTidePhaseIcon(tide)} (${tide.currentWaterLevelCm}cm)`);

    // 날씨
    const weatherIcon = this.getWeatherIcon(weather.weatherCondition);
    this.weatherText.setText(`${weatherIcon} ${weather.temperatureC.toFixed(1)}°C`);

    // 바람
    const windDir = getWindDirectionLabel(weather.windDirectionDeg);
    this.windText.setText(`💨 ${weather.windSpeedMs.toFixed(1)}m/s ${windDir}`);

    this.updateGoldenHourBadge();
    this.refreshTime();
  }

  private updateGoldenHourBadge(): void {
    if (!this.currentEnv) return;
    const now = new Date();
    const weather = this.currentEnv.weather;
    if (isGoldenHour(now, weather.sunriseAt, weather.sunsetAt)) {
      this.goldenHourBadge.setText('🌅 골든타임!').setVisible(true);
    } else if (isNighttime(now, weather.sunriseAt, weather.sunsetAt)) {
      this.goldenHourBadge.setText('🌙 야간').setVisible(true);
    } else {
      this.goldenHourBadge.setVisible(false);
    }
  }

  private getWeatherIcon(condition: string): string {
    const icons: Record<string, string> = {
      clear: '☀️',
      partly_cloudy: '⛅',
      cloudy: '☁️',
      rainy: '🌧️',
      foggy: '🌫️',
      windy: '🌬️',
      stormy: '🌀',
      snowy: '❄️',
    };
    return icons[condition] ?? '🌤️';
  }

  /** 씬에서 제거할 때 타이머 정리 */
  destroy(): void {
    if (this.updateTimer) {
      this.updateTimer.destroy();
      this.updateTimer = null;
    }
    this.container.destroy();
  }

  /** 가시성 설정 */
  setVisible(visible: boolean): this {
    this.container.setVisible(visible);
    return this;
  }
}
