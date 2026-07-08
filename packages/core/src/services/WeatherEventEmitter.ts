/**
 * @file WeatherEventEmitter.ts
 * @description 돌발 기상 및 특수 환경 이벤트 이미터 서비스 (순수 TypeScript)
 *
 * 게임 플레이 중 확률적으로 임시 기상 이변을 발생시켜 낚시 물리와 환경에 변수를 부여합니다.
 */

export type WeatherEventType =
  | 'sudden_wind'     // 갑작스러운 돌풍 (캐스팅 비거리 저하, 오차 증가)
  | 'passing_rain'    // 소나기 (기온 소폭 하강, 빗줄기 연출)
  | 'tide_reversal'   // 조류 급변 (조류 흐름 세기 가중)
  | 'boiling'         // 보일링 (어군 표층 결집, 입질 확률 1.5배 상승)
  | 'none';

export interface WeatherEventEffect {
  windSpeedAdd: number;
  waveHeightAdd: number;
  tempChange: number;
  rainVolume: number;
  biteChanceMultiplier: number;
}

export interface WeatherEvent {
  type: WeatherEventType;
  name: string;
  durationMinutes: number;
  startMinutes: number;
  effect: WeatherEventEffect;
  description: string;
}

export type WeatherEventCallback = (event: WeatherEvent | null) => void;

class WeatherEventEmitter {
  private activeEvent: WeatherEvent | null = null;
  private listeners: Set<WeatherEventCallback> = new Set();
  private lastEventEndMinute = 0;
  private checkIntervalMinutes = 15; // 게임 시간 15분마다 발생 여부 체크
  private lastCheckedMinute = 0;

  // 각 이벤트의 기본 스펙 정의
  private readonly EVENT_TEMPLATES: Record<Exclude<WeatherEventType, 'none'>, { name: string; desc: string; effect: WeatherEventEffect }> = {
    sudden_wind: {
      name: '갑작스러운 돌풍',
      desc: '강한 돌풍이 불기 시작합니다. 캐스팅 비거리가 줄어들고 오차가 증가합니다.',
      effect: { windSpeedAdd: 9.5, waveHeightAdd: 1.1, tempChange: -1.0, rainVolume: 0, biteChanceMultiplier: 0.8 },
    },
    passing_rain: {
      name: '소나기',
      desc: '갑작스러운 소나기가 내립니다. 수온이 미세하게 낮아지고 입질 패턴에 변화를 줍니다.',
      effect: { windSpeedAdd: 2.0, waveHeightAdd: 0.3, tempChange: -1.5, rainVolume: 6.5, biteChanceMultiplier: 1.1 },
    },
    tide_reversal: {
      name: '조류 급변',
      desc: '조류의 흐름이 급격하게 바뀌고 거칠어집니다. 텐션 제어가 어려워집니다.',
      effect: { windSpeedAdd: 0.0, waveHeightAdd: 0.6, tempChange: 0.0, rainVolume: 0, biteChanceMultiplier: 0.95 },
    },
    boiling: {
      name: '보일링 발생',
      desc: '물고기 떼가 표층으로 올라와 베이트피시를 사냥하며 보일링을 일으킵니다! 입질 빈도가 급증합니다.',
      effect: { windSpeedAdd: 0.0, waveHeightAdd: 0.0, tempChange: 0.0, rainVolume: 0, biteChanceMultiplier: 1.5 },
    },
  };

  /** 현재 진행 중인 돌발 기상 이벤트 조회 */
  getActiveEvent(): WeatherEvent | null {
    return this.activeEvent;
  }

  /** 이벤트 리스너 등록 */
  addListener(callback: WeatherEventCallback): void {
    this.listeners.add(callback);
    // 최초 등록 시 현재 이벤트 상태 바로 피드백
    callback(this.activeEvent);
  }

  /** 이벤트 리스너 제거 */
  removeListener(callback: WeatherEventCallback): void {
    this.listeners.delete(callback);
  }

  /** 이벤트 변경 알림 브로드캐스트 */
  private notify(): void {
    for (const callback of this.listeners) {
      try {
        callback(this.activeEvent);
      } catch (e) {
        console.error('[WeatherEventEmitter] Error in listener:', e);
      }
    }
  }

  /** 수동으로 기상 이벤트를 시작 (주로 디버그/수동 연출용) */
  triggerEvent(type: Exclude<WeatherEventType, 'none'>, currentMinute: number, durationMinutes = 30): WeatherEvent {
    const template = this.EVENT_TEMPLATES[type];
    const event: WeatherEvent = {
      type,
      name: template.name,
      durationMinutes,
      startMinutes: currentMinute,
      effect: { ...template.effect },
      description: template.desc,
    };

    this.activeEvent = event;
    this.notify();
    return event;
  }

  /** 현재 이벤트를 강제 종료 */
  clearEvent(): void {
    if (this.activeEvent) {
      this.activeEvent = null;
      this.notify();
    }
  }

  /**
   * 매 게임 시간의 tick마다 돌발 이벤트의 발생/소멸을 계산합니다.
   *
   * @param currentMinute - 게임 분 기준 현재 시간
   */
  tick(currentMinute: number): void {
    // 1. 활성 이벤트 소멸 체크
    if (this.activeEvent) {
      const elapsed = currentMinute - this.activeEvent.startMinutes;
      if (elapsed >= this.activeEvent.durationMinutes) {
        console.log(`[WeatherEventEmitter] Event ${this.activeEvent.name} expired.`);
        this.lastEventEndMinute = currentMinute;
        this.activeEvent = null;
        this.notify();
      }
      return;
    }

    // 2. 일정 틱 간격으로만 신규 이벤트 생성 여부 주사위 굴림
    if (currentMinute - this.lastCheckedMinute < this.checkIntervalMinutes) {
      return;
    }
    this.lastCheckedMinute = currentMinute;

    // 이벤트 종료 후 최소 60분 간은 쿨타임 유지
    if (currentMinute - this.lastEventEndMinute < 60) {
      return;
    }

    // 5% 확률로 돌발 이벤트 발생
    if (Math.random() < 0.05) {
      const eventTypes: Exclude<WeatherEventType, 'none'>[] = ['sudden_wind', 'passing_rain', 'tide_reversal', 'boiling'];
      const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const duration = 20 + Math.floor(Math.random() * 40); // 20~60분 지속

      const event = this.triggerEvent(randomType, currentMinute, duration);
      console.log(`[WeatherEventEmitter] Triggered sudden weather: ${event.name}`);
    }
  }
}

export const WeatherEvents = new WeatherEventEmitter();
